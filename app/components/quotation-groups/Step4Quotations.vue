<script setup lang="ts">
/**
 * Etapa 4 — Cotações (exec-plan 0015, incremento 4) — **MOCK**. Barra de escopo (read-only),
 * estado de carregamento "espera → lote" (Consultando seguradoras…), lista de cotações
 * disponíveis (tabela no desktop / cards no mobile) ordenável, indisponíveis colapsadas, e o
 * painel da cotação selecionada. As tags da minuta e as cláusulas particulares entram no 4b.
 *
 * Dados via `useQuotations` (mock atrás de interface); ligar o motor real é TODO(backend) — OPEN-07.
 */
import type { Quotation, QuotationStatus } from '~/composables/useQuotations'
import { quotationStatusView } from '~/composables/useQuotations'

const wizard = useQuotationGroupWizardStore()
const { fetchQuotations } = useQuotations()
const { brokerage } = useCurrentBrokerage()
const { isMobile } = useIsMobile()

const loading = ref(false)
const error = ref<string | null>(null)
const unavailOpen = ref(false)

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
const selectedId = computed(() => wizard.selectedQuotation?.id ?? null)

const headers = [
  { title: 'Seguradora', key: 'name' },
  { title: 'Prêmio', key: 'premio', align: 'end' },
  { title: 'Comissão', key: 'comissao', align: 'end' },
  { title: 'Limite', key: 'limite', align: 'end' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' },
] as const

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Aceita `string` porque o item vindo do slot do SiDataTable é tipado como `any`.
function statusView(status: string): { label: string, color: string } {
  return quotationStatusView[status as QuotationStatus] ?? quotationStatusView.auto
}

function select(quotation: Quotation): void {
  wizard.setSelectedQuotation(quotation)
}

async function loadQuotations(): Promise<void> {
  const groupId = wizard.quotationGroupId
  if (!groupId) {
    error.value = 'Grupo de cotação não encontrado. Volte e conclua a etapa de risco.'
    return
  }
  loading.value = true
  error.value = null
  try {
    wizard.setQuotations(await fetchQuotations({ groupId, brokerageId: brokerage.id }))
    wizard.markQuotationsGenerated()
  }
  catch {
    error.value = 'Não foi possível consultar as seguradoras.'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  // Recálculo inteligente: preserva as cotações se nada mudou desde a última geração; recalcula
  // (descartando a seleção anterior) se a assinatura dos dados mudou — ou gera pela primeira vez.
  if (wizard.quotations && !wizard.signatureChanged) return
  if (wizard.signatureChanged) wizard.setSelectedQuotation(null)
  loadQuotations()
})
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

    <!-- Espera → lote. -->
    <div
      v-if="loading"
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
      <div class="si-qg-step4__skeleton" />
      <div class="si-qg-step4__skeleton" />
      <div class="si-qg-step4__skeleton" />
    </div>

    <template v-else>
      <SiAlert
        v-if="error"
        type="error"
        class="mb-0"
        :text="error"
      />

      <SiAlert
        v-else-if="!available.length"
        type="warning"
        title="Sem capacidade para o escopo escolhido"
        text="Nenhuma seguradora tem capacidade para este tomador. Volte e altere a seleção ou inclua todas as seguradoras."
        class="mb-0"
      />

      <template v-else>
        <div class="si-qg-step4__results-head">
          <span class="si-qg-step4__count">{{ available.length }} seguradora{{ available.length === 1 ? '' : 's' }} disponíve{{ available.length === 1 ? 'l' : 'is' }}</span>
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
            <span class="si-cell-strong">{{ item.name }}</span>
          </template>
          <template #[`item.premio`]="{ item }">
            <span class="si-qg-step4__premio">{{ brl(item.premio) }}</span>
          </template>
          <template #[`item.comissao`]="{ item }">
            {{ item.comissao }}%
          </template>
          <template #[`item.limite`]="{ item }">
            {{ brl(item.limite) }}
          </template>
          <template #[`item.status`]="{ item }">
            <div class="si-qg-step4__status-cell">
              <SiChip
                :color="statusView(item.status).color"
                size="small"
              >
                {{ item.statusLabel }}
              </SiChip>
              <SiChip
                v-if="item.requiresCcg"
                color="info"
                size="small"
              >
                Exige CCG
              </SiChip>
            </div>
          </template>
          <template #[`item.actions`]="{ item }">
            <SiButton
              :variant="selectedId === item.id ? 'flat' : 'tonal'"
              size="small"
              :prepend-icon="selectedId === item.id ? 'check' : undefined"
              @click="select(item)"
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
              <span class="si-qg-step4__card-name">{{ item.name }}</span>
              <div class="si-qg-step4__status-cell">
                <SiChip
                  :color="statusView(item.status).color"
                  size="small"
                >
                  {{ item.statusLabel }}
                </SiChip>
                <SiChip
                  v-if="item.requiresCcg"
                  color="info"
                  size="small"
                >
                  Exige CCG
                </SiChip>
              </div>
            </div>
            <div class="si-qg-step4__card-facts">
              <div class="si-qg-step4__card-premio">
                <span class="si-qg-step4__card-eyebrow">Prêmio</span>
                <span class="si-qg-step4__premio">{{ brl(item.premio) }}</span>
              </div>
              <div>
                <span class="si-qg-step4__card-eyebrow">Comissão</span>
                <span class="si-qg-step4__card-value">{{ item.comissao }}%</span>
              </div>
              <div>
                <span class="si-qg-step4__card-eyebrow">Limite</span>
                <span class="si-qg-step4__card-value">{{ brl(item.limite) }}</span>
              </div>
            </div>
            <SiButton
              block
              :variant="selectedId === item.id ? 'flat' : 'tonal'"
              :prepend-icon="selectedId === item.id ? 'check' : undefined"
              @click="select(item)"
            >
              {{ selectedId === item.id ? 'Selecionada' : 'Selecionar' }}
            </SiButton>
          </SiCard>
        </div>

        <!-- Indisponíveis (colapsado). -->
        <div
          v-if="unavailable.length"
          class="si-qg-step4__unavail"
        >
          <button
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
            v-if="unavailOpen"
            class="si-qg-step4__unavail-list"
          >
            <div
              v-for="item in unavailable"
              :key="item.id"
              class="si-qg-step4__unavail-item"
            >
              <span class="si-qg-step4__unavail-name">{{ item.name }}</span>
              <span class="si-qg-step4__unavail-reason">{{ item.reason }}</span>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- Painel da cotação selecionada (tags/cláusulas entram no 4b). -->
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
          :prepend-icon="'download'"
        >
          Baixar minuta
        </SiButton>
      </div>
      <dl class="si-qg-step4__panel-facts">
        <div>
          <dt>Prêmio</dt>
          <dd class="si-qg-step4__premio">
            {{ brl(wizard.selectedQuotation.premio) }}
          </dd>
        </div>
        <div>
          <dt>Comissão</dt>
          <dd>{{ wizard.selectedQuotation.comissao }}%</dd>
        </div>
        <div>
          <dt>Limite</dt>
          <dd>{{ brl(wizard.selectedQuotation.limite) }}</dd>
        </div>
      </dl>

      <QuotationGroupsMinutaClauses />
    </SiCard>
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

.si-qg-step4__skeleton {
  height: 76px;
  border-radius: var(--si-radius-lg);
  background: rgb(var(--v-theme-background));
  border: 1px solid var(--si-cinza-claro);
  animation: si-qg-pulse 1.4s ease-in-out infinite;
}

@keyframes si-qg-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
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

.si-qg-step4__status-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--si-space-1);
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
  flex-direction: column;
  gap: 2px;
  padding: var(--si-space-3);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-sm);
  background: rgb(var(--v-theme-background));
}

.si-qg-step4__unavail-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step4__unavail-reason {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
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

@media (max-width: 599.98px) {
  .si-qg-step4__panel-facts {
    gap: var(--si-space-4);
  }
}
</style>
