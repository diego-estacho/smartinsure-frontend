<script setup lang="ts">
/**
 * Etapa 4 — Cotações (exec-plan 0013, RN-056..063) — **API real**. Dispara o fan-out (POST, 202) e
 * acompanha o leque por polling (GET, ADR-051): cada Seguradora aparece assim que sua Cotação chega,
 * classificada pela ACL do backend (ADR-064) — Automática, Análise (com esteira), Indisponível (com
 * motivos) ou Não reconhecida. Selecionar só é permitido nas seguíveis (RN-059); a Análise de
 * subscrição pede confirmação (vai para a esteira da Seguradora). Recálculo por mudança real de dado
 * (RN-060) descarta a seleção e recota. "Baixar minuta" envia os termos e abre o documento (RN-063).
 *
 * Sempre mostramos o MOTIVO por Seguradora quando não é seguível (RN-058) — inclusive quando nenhuma
 * seguradora retorna cotação seguível: o corretor precisa ver por que cada uma recusou, não um beco sem saída.
 */
import type { Quotation } from '~/composables/useQuotations'
import { analysisTrackLabel, quotationStatusView } from '~/composables/useQuotations'
import { extractApiErrorMessage } from '~/lib/apiError'

const wizard = useQuotationGroupWizardStore()
const { runQuotations, listQuotations, selectQuotation } = useQuotations()
const { submitMinuta } = useQuotationMinuta()
const { isMobile } = useIsMobile()

const loading = ref(false)
const error = ref<string | null>(null)
const unavailOpen = ref(false)
const polling = ref(false)

// Gate de seleção (RN-059): a Análise de subscrição é confirmada antes de marcar (vai para a esteira).
const confirmOpen = ref(false)
const pendingSelection = ref<Quotation | null>(null)

// Baixar minuta (RN-063).
const draftLoading = ref(false)
const draftError = ref<string | null>(null)

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 120_000
let pollTimer: ReturnType<typeof setInterval> | null = null

type SortKey = 'premio' | 'comissao' | 'limite'
const sortKey = ref<SortKey>('premio')
const sortOptions: { value: SortKey, label: string }[] = [
  { value: 'premio', label: 'Prêmio' },
  { value: 'comissao', label: 'Comissão' },
  { value: 'limite', label: 'Limite' },
]

const scopeText = computed(() => {
  if (wizard.scope.mode === 'all') return 'Cotando todas as seguradoras disponíveis'
  const n = wizard.scope.insurerIds.length
  return `Cotando ${n} ${n === 1 ? 'seguradora selecionada' : 'seguradoras selecionadas'}`
})

const available = computed<Quotation[]>(() => {
  const list = [...(wizard.quotations?.available ?? [])]
  return list.sort((a, b) => {
    // Prêmio: menor é melhor (asc); comissão e limite: maior é melhor (desc).
    if (sortKey.value === 'comissao') return b.comissao - a.comissao
    if (sortKey.value === 'limite') return b.limite - a.limite
    return a.premio - b.premio
  })
})

const unavailable = computed(() => wizard.quotations?.unavailable ?? [])
const pending = computed(() => wizard.quotations?.pending ?? [])
const selectedId = computed(() => wizard.selectedQuotation?.id ?? null)

// Progresso do fan-out: quantas já resolveram (disponível/indisponível) de quantas no total (RN-057).
const resolvedCount = computed(() => available.value.length + unavailable.value.length)
const totalCount = computed(() => resolvedCount.value + pending.value.length)
const cotando = computed(() => pending.value.length > 0)

const headers = [
  { title: 'Seguradora', key: 'name' },
  { title: 'Prêmio', key: 'premio', align: 'end' },
  { title: 'Comissão', key: 'comissao', align: 'end' },
  { title: 'Limite', key: 'limite', align: 'end' },
  { title: 'Classificação', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
] as const

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Classificação exibida (RN-058): Automática = sucesso; Análise = aviso com a esteira específica.
function classification(item: Quotation): { label: string, color: string } {
  if (item.status === 'auto') return quotationStatusView.auto
  const track = item.analysisTrack ? analysisTrackLabel[item.analysisTrack] : null
  return { label: track ?? quotationStatusView.analise.label, color: 'warning' }
}

// Motivo legível: tira o invólucro técnico da falha de integração e deixa a mensagem da seguradora.
function cleanReason(reason: string): string {
  const cleaned = reason
    .replace(/^Falha na integração:\s*/i, '')
    .replace(/^PlugV2 (?:retornou|devolveu)[^.]*\.\s*/i, '')
    .replace(/^Erro!\s*/i, '')
    .replace(/^Atenção!\s*/i, '')
    .trim()
  return cleaned.length > 0 ? cleaned : reason
}

// Monograma da Seguradora (2 iniciais) — fallback quando não há logo ou a URL falha.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map(part => part[0] ?? '').join('')
  return (letters || name.slice(0, 2)).toUpperCase()
}

// Logos externos podem falhar (URL quebrada / offline) — nesse caso cai no monograma.
const logoFailed = ref(new Set<string>())
function onLogoError(id: string): void {
  logoFailed.value = new Set(logoFailed.value).add(id)
}
function showLogo(item: { id: string, logoUrl: string | null }): boolean {
  return Boolean(item.logoUrl) && !logoFailed.value.has(item.id)
}

function canSelect(item: Quotation): boolean {
  return item.isFollowable
}

function requestSelect(item: Quotation): void {
  // RN-059: só as seguíveis; a Análise de subscrição confirma antes (vai para a esteira da Seguradora).
  if (!item.isFollowable) return
  if (item.result === 'Analysis') {
    pendingSelection.value = item
    confirmOpen.value = true
    return
  }
  void doSelect(item)
}

async function confirmSelect(): Promise<void> {
  const item = pendingSelection.value
  confirmOpen.value = false
  pendingSelection.value = null
  if (item) await doSelect(item)
}

function cancelSelect(): void {
  confirmOpen.value = false
  pendingSelection.value = null
}

async function doSelect(item: Quotation): Promise<void> {
  const groupId = wizard.quotationGroupId
  if (!groupId) return
  try {
    await selectQuotation(groupId, item.id)
    wizard.setSelectedQuotation(item)
  }
  catch (err) {
    error.value = extractApiErrorMessage(err, 'Não foi possível selecionar a cotação.')
  }
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  polling.value = false
}

async function refresh(): Promise<void> {
  const groupId = wizard.quotationGroupId
  if (!groupId) return
  const result = await listQuotations(groupId)
  wizard.setQuotations(result)

  // Reflete a Cotação escolhida persistida no servidor (RN-059).
  if (result.selectedQuotationId && !wizard.selectedQuotation) {
    const selected = result.available.find(quotation => quotation.id === result.selectedQuotationId)
    if (selected) wizard.setSelectedQuotation(selected)
  }

  if (result.pending.length === 0) {
    stopPolling()
    wizard.markQuotationsGenerated()
  }
}

function startPolling(): void {
  polling.value = true
  const startedAt = Date.now()
  pollTimer = setInterval(() => {
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      stopPolling()
      return
    }
    void refresh().catch(() => {})
  }, POLL_INTERVAL_MS)
}

async function generate(): Promise<void> {
  const groupId = wizard.quotationGroupId
  const brokerageId = wizard.brokerageId
  if (!groupId || !brokerageId) {
    error.value = 'Não foi possível identificar o grupo de cotação ou a corretora para cotar.'
    return
  }

  loading.value = true
  error.value = null
  try {
    await runQuotations(groupId, brokerageId)
    await refresh()
    if (wizard.quotations?.pending.length) startPolling()
  }
  catch (err) {
    error.value = extractApiErrorMessage(err, 'Não foi possível iniciar as cotações.')
  }
  finally {
    loading.value = false
  }
}

async function baixarMinuta(): Promise<void> {
  const groupId = wizard.quotationGroupId
  const quotation = wizard.selectedQuotation
  const brokerageId = wizard.brokerageId
  if (!groupId || !quotation || !brokerageId) return

  draftLoading.value = true
  draftError.value = null
  try {
    const terms = Object.entries(wizard.minuta)
      .map(([name, value]) => ({ name, value: String(value ?? '') }))
      .filter(term => term.value.trim().length > 0)
    const particularClauses = Object.entries(wizard.clauses)
      .filter(([, on]) => on)
      .map(([externalId]) => ({
        particularClauseExternalId: externalId,
        // Tags próprias da cláusula preenchidas pelo corretor (RN-062): nome → valor (só as não vazias).
        tags: Object.entries(wizard.clauseTags[externalId] ?? {})
          .map(([name, value]) => ({ name, value: String(value ?? '') }))
          .filter(tag => tag.value.trim().length > 0),
      }))

    const result = await submitMinuta(groupId, quotation.id, { brokerageId, terms, particularClauses })
    if (result.draftUrl && import.meta.client) {
      window.open(result.draftUrl, '_blank', 'noopener')
    }
    else if (!result.draftUrl) {
      draftError.value = 'A seguradora não retornou a minuta.'
    }
  }
  catch (err) {
    draftError.value = extractApiErrorMessage(err, 'Não foi possível baixar a minuta.')
  }
  finally {
    draftLoading.value = false
  }
}

onMounted(() => {
  // Recálculo inteligente (RN-060): preserva as cotações se nada mudou; recalcula (descartando a
  // seleção) se a assinatura dos dados mudou — ou gera pela primeira vez.
  if (wizard.quotations && !wizard.signatureChanged) {
    // Estado preservado (voltar ao passo) ou restaurado (refresh com o id na rota): se ainda há
    // Seguradoras cotando, retoma o acompanhamento por polling em vez de recomeçar o fan-out.
    if (wizard.quotations.pending.length) startPolling()
    return
  }
  if (wizard.signatureChanged) wizard.setSelectedQuotation(null)
  void generate()
})

onBeforeUnmount(() => stopPolling())
</script>

<template>
  <div class="si-qg-step4">
    <!-- Barra de escopo (somente leitura). -->
    <div class="si-qg-step4__scope">
      <SiIcon
        icon="shieldCheck"
        :size="16"
      />
      <span>{{ scopeText }}</span>
    </div>

    <!-- Espera inicial → lote incremental. -->
    <div
      v-if="loading && !available.length && !unavailable.length && !pending.length"
      class="si-qg-step4__loading"
    >
      <div class="si-qg-step4__loading-head">
        <SiProgressCircular
          indeterminate
          :size="18"
          :width="2"
        />
        <span>Consultando seguradoras…</span>
      </div>
      <SiSkeleton
        v-for="n in 3"
        :key="n"
        height="76px"
        radius="var(--si-radius-lg)"
      />
    </div>

    <template v-else>
      <SiAlert
        v-if="error"
        type="error"
        class="mb-0"
        :text="error"
      />

      <template v-else>
        <!-- Progresso do fan-out: quantas já voltaram de quantas (RN-057). -->
        <div
          v-if="cotando"
          class="si-qg-step4__progress"
        >
          <SiProgressCircular
            indeterminate
            :size="18"
            :width="2"
          />
          <span>Cotando seguradoras… <strong>{{ resolvedCount }}</strong> de {{ totalCount }}</span>
        </div>

        <!-- Disponíveis (seguíveis): tabela/cards. -->
        <template v-if="available.length">
          <div class="si-qg-step4__results-head">
            <span class="si-qg-step4__count">
              {{ available.length }} seguradora{{ available.length === 1 ? '' : 's' }} disponíve{{ available.length === 1 ? 'l' : 'is' }}
            </span>
            <div class="si-qg-step4__sort">
              <span class="si-qg-step4__sort-label">Ordenar por</span>
              <SiButton
                v-for="opt in sortOptions"
                :key="opt.value"
                size="x-small"
                :variant="sortKey === opt.value ? 'flat' : 'text'"
                :color="sortKey === opt.value ? 'primary' : 'secondary'"
                @click="sortKey = opt.value"
              >
                {{ opt.label }}
              </SiButton>
            </div>
          </div>

          <!-- Desktop: tabela. -->
          <SiDataTable
            v-if="!isMobile"
            :headers="headers"
            :items="available"
            item-value="id"
            hide-default-footer
            class="si-qg-step4__table"
          >
            <template #[`item.name`]="{ item }">
              <div class="si-qg-step4__insurer">
                <span class="si-qg-step4__insurer-logo">
                  <img
                    v-if="showLogo(item)"
                    :src="item.logoUrl!"
                    :alt="item.name"
                    class="si-qg-step4__insurer-img"
                    loading="lazy"
                    @error="onLogoError(item.id)"
                  >
                  <template v-else>{{ initials(item.name) }}</template>
                </span>
                <span class="si-cell-strong">{{ item.name }}</span>
                <SiChip
                  v-if="item.requiresCcg"
                  size="x-small"
                  color="info"
                >
                  CCG
                </SiChip>
              </div>
            </template>
            <template #[`item.premio`]="{ item }">
              <span class="si-qg-step4__premio">{{ item.status === 'auto' ? brl(item.premio) : '—' }}</span>
            </template>
            <template #[`item.comissao`]="{ item }">
              {{ item.status === 'auto' ? `${item.comissao}%` : '—' }}
            </template>
            <template #[`item.limite`]="{ item }">
              {{ item.limite ? brl(item.limite) : '—' }}
            </template>
            <template #[`item.status`]="{ item }">
              <SiChip
                :color="classification(item).color"
                size="small"
              >
                {{ classification(item).label }}
              </SiChip>
            </template>
            <template #[`item.actions`]="{ item }">
              <SiButton
                :variant="selectedId === item.id ? 'flat' : 'tonal'"
                size="small"
                :disabled="!canSelect(item)"
                :prepend-icon="selectedId === item.id ? 'check' : undefined"
                @click="requestSelect(item)"
              >
                {{ selectedId === item.id ? 'Selecionada' : 'Selecionar' }}
              </SiButton>
            </template>
          </SiDataTable>

          <!-- Mobile: cards. -->
          <div
            v-else
            class="si-qg-step4__cards"
          >
            <SiCard
              v-for="item in available"
              :key="item.id"
              variant="outlined"
              class="si-qg-step4__card"
              :class="{ 'si-qg-step4__card--on': selectedId === item.id }"
            >
              <div class="si-qg-step4__card-head">
                <div class="si-qg-step4__card-insurer">
                  <span class="si-qg-step4__insurer-logo">
                    <img
                      v-if="showLogo(item)"
                      :src="item.logoUrl!"
                      :alt="item.name"
                      class="si-qg-step4__insurer-img"
                      loading="lazy"
                      @error="onLogoError(item.id)"
                    >
                    <template v-else>{{ initials(item.name) }}</template>
                  </span>
                  <span class="si-qg-step4__card-name">{{ item.name }}</span>
                </div>
                <SiChip
                  :color="classification(item).color"
                  size="small"
                >
                  {{ classification(item).label }}
                </SiChip>
              </div>
              <div class="si-qg-step4__card-facts">
                <div class="si-qg-step4__card-premio">
                  <span class="si-qg-step4__card-eyebrow">Prêmio</span>
                  <span class="si-qg-step4__premio">{{ item.status === 'auto' ? brl(item.premio) : '—' }}</span>
                </div>
                <div>
                  <span class="si-qg-step4__card-eyebrow">Comissão</span>
                  <span class="si-qg-step4__card-value">{{ item.status === 'auto' ? `${item.comissao}%` : '—' }}</span>
                </div>
                <div>
                  <span class="si-qg-step4__card-eyebrow">Limite</span>
                  <span class="si-qg-step4__card-value">{{ item.limite ? brl(item.limite) : '—' }}</span>
                </div>
              </div>
              <SiButton
                block
                :variant="selectedId === item.id ? 'flat' : 'tonal'"
                :disabled="!canSelect(item)"
                :prepend-icon="selectedId === item.id ? 'check' : undefined"
                @click="requestSelect(item)"
              >
                {{ selectedId === item.id ? 'Selecionada' : 'Selecionar' }}
              </SiButton>
            </SiCard>
          </div>
        </template>

        <!-- Skeletons nomeados das Seguradoras ainda cotando (RN-057): logo + nome já conhecidos;
             cada um vira a cotação real assim que a Seguradora responde. -->
        <div
          v-if="pending.length"
          class="si-qg-step4__pending"
        >
          <div
            v-for="item in pending"
            :key="item.id"
            class="si-qg-step4__skel"
          >
            <span class="si-qg-step4__insurer-logo">
              <img
                v-if="showLogo(item)"
                :src="item.logoUrl!"
                :alt="item.name"
                class="si-qg-step4__insurer-img"
                loading="lazy"
                @error="onLogoError(item.id)"
              >
              <template v-else>{{ initials(item.name) }}</template>
            </span>
            <div class="si-qg-step4__skel-body">
              <span class="si-qg-step4__skel-name">{{ item.name }}</span>
              <SiSkeleton
                width="55%"
                height="10px"
                radius="999px"
              />
            </div>
            <span class="si-qg-step4__skel-status">
              <SiProgressCircular
                indeterminate
                :size="14"
                :width="2"
              />
              Cotando…
            </span>
          </div>
        </div>

        <!-- Nenhuma seguível (e já terminou de cotar): empty state centrado; os motivos vêm logo abaixo. -->
        <div
          v-if="!cotando && !available.length"
          class="si-qg-step4__empty"
        >
          <span class="si-qg-step4__empty-icon">
            <SiIcon
              icon="alertTriangle"
              :size="22"
            />
          </span>
          <h3 class="si-qg-step4__empty-title">
            Nenhuma cotação disponível
          </h3>
          <p class="si-qg-step4__empty-text">
            Nenhuma seguradora conseguiu cotar este risco. Veja abaixo o motivo de cada uma e ajuste
            os dados (tomador, modalidade ou valor) antes de tentar novamente.
          </p>
        </div>

        <!-- Indisponíveis — SEMPRE que houver, com o motivo real (RN-058). Expandido quando não há
             nenhuma seguível (o corretor precisa ver o porquê); colapsável quando há disponíveis. -->
        <div
          v-if="unavailable.length"
          class="si-qg-step4__unavail"
        >
          <button
            v-if="available.length"
            type="button"
            class="si-qg-step4__unavail-toggle"
            @click="unavailOpen = !unavailOpen"
          >
            <span class="si-qg-step4__unavail-title">
              <SiIcon
                icon="info"
                :size="17"
              />
              Indisponíveis ({{ unavailable.length }})
            </span>
            <SiIcon
              :icon="unavailOpen ? 'chevronUp' : 'chevronDown'"
              :size="18"
            />
          </button>
          <div
            v-else
            class="si-qg-step4__unavail-head"
          >
            <SiIcon
              icon="info"
              :size="17"
            />
            <span>Indisponíveis ({{ unavailable.length }})</span>
          </div>

          <div
            v-if="!available.length || unavailOpen"
            class="si-qg-step4__unavail-list"
          >
            <div
              v-for="item in unavailable"
              :key="item.id"
              class="si-qg-step4__unavail-item"
            >
              <span class="si-qg-step4__unavail-mono">
                <img
                  v-if="showLogo(item)"
                  :src="item.logoUrl!"
                  :alt="item.name"
                  class="si-qg-step4__unavail-logo"
                  loading="lazy"
                  @error="onLogoError(item.id)"
                >
                <template v-else>{{ initials(item.name) }}</template>
              </span>
              <div class="si-qg-step4__unavail-body">
                <div class="si-qg-step4__unavail-line">
                  <span class="si-qg-step4__unavail-name">{{ item.name }}</span>
                  <span class="si-qg-step4__unavail-badge">Indisponível</span>
                </div>
                <span class="si-qg-step4__unavail-reason">{{ cleanReason(item.reason) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Painel da cotação selecionada + minuta. -->
    <SiCard
      v-if="wizard.selectedQuotation"
      variant="outlined"
      class="si-qg-step4__panel"
    >
      <span class="si-qg-step4__panel-eyebrow">Cotação selecionada</span>
      <div class="si-qg-step4__panel-head">
        <h3 class="si-qg-step4__panel-name">
          {{ wizard.selectedQuotation.name }}
        </h3>
        <SiButton
          variant="outlined"
          color="secondary"
          size="small"
          prepend-icon="download"
          :loading="draftLoading"
          @click="baixarMinuta"
        >
          Baixar minuta
        </SiButton>
      </div>
      <SiAlert
        v-if="draftError"
        type="error"
        class="mb-2"
        :text="draftError"
      />
      <dl class="si-qg-step4__panel-facts">
        <div>
          <dt>Prêmio</dt>
          <dd class="si-qg-step4__premio">
            {{ wizard.selectedQuotation.status === 'auto' ? brl(wizard.selectedQuotation.premio) : '—' }}
          </dd>
        </div>
        <div>
          <dt>Comissão</dt>
          <dd>{{ wizard.selectedQuotation.status === 'auto' ? `${wizard.selectedQuotation.comissao}%` : '—' }}</dd>
        </div>
        <div>
          <dt>Limite</dt>
          <dd>{{ wizard.selectedQuotation.limite ? brl(wizard.selectedQuotation.limite) : '—' }}</dd>
        </div>
      </dl>

      <QuotationGroupsMinutaClauses />
    </SiCard>

    <!-- Gate de subscrição (RN-059): confirma o envio para análise da seguradora. -->
    <SiDialog
      v-model="confirmOpen"
      :max-width="480"
    >
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          Enviar para análise da seguradora?
        </h2>
        <p class="mb-5">
          A cotação de <strong>{{ pendingSelection?.name }}</strong> exige análise de subscrição da
          seguradora antes de seguir. As esteiras são configuradas por seguradora. Deseja continuar?
        </p>
        <div class="si-qg-step4__dialog-actions">
          <SiButton
            variant="text"
            color="secondary"
            @click="cancelSelect"
          >
            Cancelar
          </SiButton>
          <SiButton @click="confirmSelect">
            Continuar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </div>
</template>

<style scoped>
.si-qg-step4 {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  margin-top: var(--si-space-4);
}

.si-qg-step4__scope {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-2) var(--si-space-3);
  border-radius: var(--si-radius-md);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-size: var(--si-fs-small);
}

/* ── Espera → lote ── */
.si-qg-step4__loading {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-qg-step4__loading-head {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

/* ── Resultado ── */
.si-qg-step4__results-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
}

.si-qg-step4__count {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-qg-step4__sort {
  display: flex;
  align-items: center;
  gap: var(--si-space-1);
}

.si-qg-step4__sort-label {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-right: var(--si-space-1);
}

.si-qg-step4__premio {
  font-weight: var(--si-font-weight-bold);
  font-variant-numeric: tabular-nums;
}

/* ── Logo da seguradora (tile branco) — disponíveis (tabela/cards) ── */
.si-qg-step4__insurer,
.si-qg-step4__card-insurer {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  min-width: 0;
}

.si-qg-step4__insurer-logo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--si-radius-sm);
  background: #fff;
  border: 1px solid var(--si-cinza-claro);
  padding: 3px;
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 10px;
  font-weight: var(--si-font-weight-bold);
}

.si-qg-step4__insurer-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ── Progresso + skeletons nomeados (cotando) ── */
.si-qg-step4__progress {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-2) var(--si-space-3);
  border-radius: var(--si-radius-md);
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-size: var(--si-fs-small);
}

.si-qg-step4__pending {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-qg-step4__skel {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  padding: var(--si-space-3) var(--si-space-4);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  background: rgb(var(--v-theme-surface));
}

.si-qg-step4__skel-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
}

.si-qg-step4__skel-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__skel-status {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* ── Cards (mobile) ── */
.si-qg-step4__cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-qg-step4__card {
  padding: var(--si-space-4);
}

.si-qg-step4__card--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.si-qg-step4__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-qg-step4__card-name {
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__card-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-2) var(--si-space-4);
  margin-bottom: var(--si-space-3);
}

.si-qg-step4__card-facts > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

/* Prêmio (destaque) ocupa a linha inteira; comissão e limite dividem a linha de baixo. */
.si-qg-step4__card-premio {
  grid-column: 1 / -1;
}

.si-qg-step4__card-eyebrow {
  display: block;
  font-size: var(--si-fs-caption);
  text-transform: uppercase;
  letter-spacing: var(--si-ls-eyebrow);
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.si-qg-step4__card-value {
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

/* ── Indisponíveis ── */
.si-qg-step4__unavail {
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  overflow: hidden;
}

.si-qg-step4__unavail-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  min-height: 48px;
  padding: var(--si-space-3) var(--si-space-4);
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.si-qg-step4__unavail-head {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-3) var(--si-space-4);
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.si-qg-step4__unavail-title {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__unavail-list {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  padding: 0 var(--si-space-4) var(--si-space-4);
}

.si-qg-step4__unavail-item {
  display: flex;
  align-items: flex-start;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-sm);
  background: rgb(var(--v-theme-background));
}

.si-qg-step4__unavail-mono {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--si-radius-sm);
  background: #fff;
  border: 1px solid var(--si-cinza-claro);
  padding: 4px;
  overflow: hidden;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-bold);
}

.si-qg-step4__unavail-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.si-qg-step4__unavail-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.si-qg-step4__unavail-line {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-wrap: wrap;
}

.si-qg-step4__unavail-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__unavail-badge {
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  color: #991b1b;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 999px;
}

.si-qg-step4__unavail-reason {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.45;
}

/* ── Empty state (nenhuma cotação seguível) ── */
.si-qg-step4__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-2);
  padding: var(--si-space-6) var(--si-space-4) var(--si-space-2);
}

.si-qg-step4__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: rgba(var(--v-theme-warning), 0.14);
  color: rgb(var(--v-theme-warning));
}

.si-qg-step4__empty-title {
  margin: 0;
  font-size: var(--si-fs-body);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__empty-text {
  margin: 0;
  max-width: 440px;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.6);
  line-height: 1.5;
}

/* ── Painel da cotação selecionada ── */
.si-qg-step4__panel {
  padding: var(--si-space-4);
  border-color: rgb(var(--v-theme-primary));
}

.si-qg-step4__panel-eyebrow {
  font-size: var(--si-fs-caption);
  text-transform: uppercase;
  letter-spacing: var(--si-ls-eyebrow);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-primary));
}

.si-qg-step4__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin: var(--si-space-1) 0 var(--si-space-3);
}

.si-qg-step4__panel-name {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__panel-facts {
  display: flex;
  gap: var(--si-space-6);
  margin: 0;
}

.si-qg-step4__panel-facts dt {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-qg-step4__panel-facts dd {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-qg-step4__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

@media (max-width: 599.98px) {
  .si-qg-step4__panel-facts {
    gap: var(--si-space-4);
  }
}
</style>
