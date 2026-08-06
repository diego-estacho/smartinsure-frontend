<script setup lang="ts">
import type { ExecuteCreditInquiryResponse } from '~/composables/useCreditInquiries'
import type { PolicyHolderListItem } from '~/composables/usePolicyHolders'
import { buildCreditInquiryRows, formatResponseTime, formatShortCurrencyBRL, isCnpjQuery } from '~/lib/creditInquiry'
import { formatCnpj, isValidCnpj } from '~/lib/documents'
import { toBrDateTime } from '~/lib/dates'
import { extractApiErrorMessage } from '~/lib/apiError'

/**
 * RN-029/RN-030/RN-031/RN-200 — Consulta de Crédito: um componente, duas entradas.
 * `page` (rota /consulta-credito) traz busca + seleção de Corretora; `embed` (modal do passo 1
 * da cotação) recebe Tomador e Corretora por prop e entra direto em loading → result.
 */
const props = withDefaults(defineProps<{
  mode?: 'page' | 'embed'
  /** embed: Corretora ativa (obrigatória para executar) e Tomador já definido. */
  brokerageId?: string
  brokerageName?: string
  policyHolderName?: string
  policyHolderCnpj?: string
}>(), {
  mode: 'page',
  brokerageId: '',
  brokerageName: '',
  policyHolderName: '',
  policyHolderCnpj: '',
})

type Phase = 'idle' | 'searching' | 'choose' | 'notfound' | 'loading' | 'error' | 'result'

const { executeCreditInquiry } = useCreditInquiries()
const { listPolicyHolders } = usePolicyHolders()
const { workspaces, activeWorkspace, loadContext, loading: workspacesLoading } = useWorkspaces()

const phase = ref<Phase>('idle')
const query = ref('')
const fieldError = ref('')
const selectedBrokerageId = ref('')
const candidates = ref<PolicyHolderListItem[]>([])
const searchTerm = ref('')
const selectedPolicyHolder = ref<PolicyHolderListItem | null>(null)
const response = ref<ExecuteCreditInquiryResponse | null>(null)
const errorMessage = ref('')
const elapsedMs = ref<number | null>(null)
const recent = ref<string[]>([])

// CNPJ atualmente em consulta (reconsulta usa este valor).
const currentCnpj = ref('')

// RN-201: exportação do quadro consolidado (.xlsx) — só no modo página, após o resultado.
const exporting = ref(false)
const toast = ref('')

const rows = computed(() => buildCreditInquiryRows(response.value?.results ?? []))
const availableRows = computed(() => rows.value.filter(row => row.status === 'Available'))

const isEmbed = computed(() => props.mode === 'embed')

// Nome/CNPJ do Tomador exibido no resultado (razão social vem da Seguradora quando disponível).
const resultName = computed(() =>
  response.value?.policyHolderName || selectedPolicyHolder.value?.name || props.policyHolderName || '—',
)
const resultCnpj = computed(() => response.value?.policyHolderCnpj || currentCnpj.value)
const resultCity = computed(() => {
  const city = selectedPolicyHolder.value?.city
  const uf = selectedPolicyHolder.value?.stateCode
  if (city && uf) {
    return `${city}/${uf}`
  }
  return city || uf || ''
})

// KPIs (RN-029).
const kpis = computed(() => {
  const summary = response.value?.summary
  const queried = Number(summary?.insurersQueried ?? 0)
  const available = Number(summary?.insurersAvailable ?? 0)
  const leader = availableRows.value.reduce<{ name: string, value: number } | null>((top, row) => {
    if (!top || row.maxAvailable > top.value) {
      return { name: row.insurerName, value: row.maxAvailable }
    }
    return top
  }, null)
  return {
    queried,
    available,
    withoutLimit: queried - available,
    maxLimit: leader ? formatShortCurrencyBRL(leader.value) : formatShortCurrencyBRL(0),
    leaderName: leader?.name ?? '',
    queriedAt: response.value ? toBrDateTime(response.value.queriedAt) : '',
    elapsed: formatResponseTime(elapsedMs.value),
  }
})

const noneAvailable = computed(() => phase.value === 'result' && availableRows.value.length === 0)

const consultLabel = computed(() =>
  phase.value === 'searching' || phase.value === 'loading' ? 'Consultando…' : 'Consultar',
)

onMounted(async () => {
  if (isEmbed.value) {
    selectedBrokerageId.value = props.brokerageId
    if (props.policyHolderCnpj) {
      await runInquiry(props.policyHolderCnpj)
    }
    return
  }

  // RN-064: as Corretoras do select são as VINCULADAS ao usuário (workspaces), não a listagem
  // de gestão (`listBrokerages`, escopada, que traz só a Corretora ativa). loadContext é idempotente.
  await loadContext()
  selectedBrokerageId.value = activeWorkspace.value?.id ?? workspaces.value[0]?.id ?? ''
  recent.value = loadRecent()
})

// Consultas recentes: convenência de recência (não é histórico). Persistidas em localStorage —
// custo zero de banco, sobrevivem ao reload; o histórico persistido (RN-031) é assunto de outra tela.
const RECENT_KEY = 'si:credit-inquiry:recent'

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, 5) : []
  }
  catch {
    return []
  }
}

function pushRecent(term: string) {
  recent.value = [term, ...recent.value.filter(item => item !== term)].slice(0, 5)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value))
  }
  catch {
    // localStorage indisponível (modo privado/quota) — recência fica só em memória.
  }
}

async function submitInquiry() {
  fieldError.value = ''
  const term = query.value.trim()
  if (!term) {
    fieldError.value = 'Informe o CNPJ, o nome ou a razão social do tomador.'
    return
  }
  if (!selectedBrokerageId.value) {
    fieldError.value = 'Selecione uma corretora.'
    return
  }
  pushRecent(term)

  if (isCnpjQuery(term)) {
    // RN-029: CNPJ inválido (dígito verificador) é recusado ANTES de qualquer consulta.
    if (!isValidCnpj(term)) {
      fieldError.value = 'CNPJ inválido'
      return
    }
    selectedPolicyHolder.value = null
    await runInquiry(term)
    return
  }
  await runSearch(term)
}

async function runSearch(term: string) {
  phase.value = 'searching'
  searchTerm.value = term
  try {
    const result = await listPolicyHolders({ search: term, pageSize: 20, brokerageId: selectedBrokerageId.value })
    candidates.value = result.items
    phase.value = result.items.length > 0 ? 'choose' : 'notfound'
  }
  catch (error) {
    errorMessage.value = extractApiErrorMessage(error, 'Não foi possível buscar o tomador.')
    phase.value = 'error'
  }
}

async function pick(candidate: PolicyHolderListItem) {
  selectedPolicyHolder.value = candidate
  await runInquiry(candidate.documentNumber)
}

async function runInquiry(cnpj: string) {
  currentCnpj.value = cnpj
  phase.value = 'loading'
  errorMessage.value = ''
  const startedAt = performance.now()
  try {
    response.value = await executeCreditInquiry({
      brokerageId: selectedBrokerageId.value,
      policyHolderCnpj: cnpj,
    })
    elapsedMs.value = Math.round(performance.now() - startedAt)
    phase.value = 'result'
  }
  catch (error) {
    errorMessage.value = extractApiErrorMessage(
      error,
      'O serviço de limites não respondeu a tempo. Isso costuma ser instabilidade momentânea da integração.',
    )
    phase.value = 'error'
  }
}

function retryInquiry() {
  if (currentCnpj.value) {
    runInquiry(currentCnpj.value)
  }
}

function startNewInquiry() {
  phase.value = 'idle'
  query.value = ''
  fieldError.value = ''
  candidates.value = []
  selectedPolicyHolder.value = null
  response.value = null
  currentCnpj.value = ''
}

function useRecent(term: string) {
  query.value = term
  submitInquiry()
}

function candidateCity(candidate: PolicyHolderListItem): string {
  if (candidate.city && candidate.stateCode) {
    return `${candidate.city}/${candidate.stateCode}`
  }
  return candidate.city || candidate.stateCode || '—'
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()
}

// RN-201: baixa o .xlsx da consulta persistida pelo BFF (reusa o exporter do backend, RN-018).
async function exportInquiry() {
  const inquiryId = response.value?.creditInquiryId
  if (!inquiryId) {
    return
  }
  exporting.value = true
  try {
    const blob = await $fetch<Blob>(`/api/credit-inquiries/${inquiryId}/export`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `consulta-credito-${resultCnpj.value.replace(/\D/g, '')}.xlsx`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  catch (error) {
    toast.value = extractApiErrorMessage(error, 'Não foi possível exportar a consulta.')
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="si-ci-panel" :class="`si-ci-panel--${mode}`">
    <!-- Cabeçalho (somente page). -->
    <header v-if="!isEmbed" class="si-ci-panel__header">
      <div class="si-ci-panel__heading">
        <h1 class="si-ci-panel__title">Consulta de crédito</h1>
      </div>
      <div v-if="phase === 'result'" class="si-ci-panel__actions">
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'download'"
          :loading="exporting"
          :disabled="!response?.creditInquiryId"
          @click="exportInquiry"
        >
          Exportar
        </SiButton>
        <SiButton variant="outlined" color="secondary" @click="startNewInquiry">
          Nova consulta
        </SiButton>
      </div>
    </header>

    <!-- Faixa de contexto (somente embed) — rótulo + valor no mesmo bloco flex. -->
    <div v-if="isEmbed" class="si-ci-context">
      <div class="si-ci-context__block">
        <span class="si-ci-context__label">Corretora</span>
        <span class="si-ci-context__value">{{ brokerageName || '—' }}</span>
      </div>
      <div class="si-ci-context__block si-ci-context__block--grow">
        <span class="si-ci-context__label">Tomador</span>
        <span class="si-ci-context__value si-ci-context__value--wrap">{{ policyHolderName || resultName }}</span>
        <span class="si-ci-context__doc">CNPJ {{ formatCnpj(policyHolderCnpj || resultCnpj) }}</span>
      </div>
      <SiButton
        v-if="phase === 'result'"
        variant="outlined"
        color="secondary"
        size="small"
        :prepend-icon="'refresh'"
        @click="retryInquiry"
      >
        Reconsultar
      </SiButton>
    </div>

    <!-- Card de busca (somente page). -->
    <SiCard v-if="!isEmbed" variant="outlined" class="si-ci-search">
      <div class="si-ci-search__fields">
        <!-- Wrappers levam o dimensionamento flex; o flex-child real é o div, não o v-input
             interno do SiFieldShell (senão o nome longo da Corretora esmaga o campo Tomador). -->
        <div class="si-ci-search__broker">
          <SiSelect
            v-model="selectedBrokerageId"
            label="Corretora"
            :items="workspaces"
            item-title="name"
            item-value="id"
            :loading="workspacesLoading"
            hide-details
          />
        </div>
        <div class="si-ci-search__query">
          <SiTextField
            v-model="query"
            label="Tomador"
            placeholder="CNPJ, nome ou razão social"
            :prepend-inner-icon="'search'"
            clearable
            hide-details
            :error="!!fieldError"
            class="si-field--search"
            @keyup.enter="submitInquiry"
          />
        </div>
        <SiButton
          :prepend-icon="'search'"
          :loading="phase === 'searching' || phase === 'loading'"
          class="si-ci-search__submit"
          @click="submitInquiry"
        >
          {{ consultLabel }}
        </SiButton>
      </div>

      <p v-if="fieldError" class="si-ci-search__error">
        <SiIcon :icon="'alertTriangle'" :size="15" />
        {{ fieldError }}
      </p>

      <div v-if="recent.length" class="si-ci-search__recent">
        <span class="si-ci-search__recent-label">Consultados recentemente</span>
        <div class="si-ci-search__recent-chips">
          <button
            v-for="term in recent"
            :key="term"
            type="button"
            class="si-ci-recent-chip"
            @click="useRecent(term)"
          >
            {{ term }}
          </button>
        </div>
      </div>
    </SiCard>

    <!-- idle (page). -->
    <div v-if="!isEmbed && phase === 'idle'" class="si-ci-state">
      <span class="si-ci-state__icon si-ci-state__icon--neutral">
        <SiIcon :icon="'search'" :size="24" />
      </span>
      <h2 class="si-ci-state__title">Consulte o limite de crédito de um tomador</h2>
      <p class="si-ci-state__text">
        Informe o CNPJ, o nome ou a razão social. Consultamos ao mesmo tempo todas as seguradoras
        vinculadas à corretora selecionada e mostramos o limite disponível em cada uma.
      </p>
    </div>

    <!-- searching / loading. -->
    <div v-if="phase === 'searching' || phase === 'loading'" class="si-ci-state">
      <SiProgressCircular indeterminate color="primary" :size="40" />
      <h2 class="si-ci-state__title">
        {{ phase === 'loading' ? 'Consultando as seguradoras…' : 'Buscando tomadores…' }}
      </h2>
      <p class="si-ci-state__text">
        Cada seguradora responde no seu tempo. Isso costuma levar alguns segundos.
      </p>
    </div>

    <!-- choose (candidatos). -->
    <SiCard v-if="phase === 'choose'" variant="outlined" class="si-ci-candidates">
      <div class="si-ci-candidates__head">
        <span class="si-ci-candidates__count">{{ candidates.length }} tomadores encontrados para "{{ searchTerm }}"</span>
        <span class="si-ci-candidates__hint">Selecione o tomador para consultar</span>
      </div>
      <button
        v-for="candidate in candidates"
        :key="candidate.id"
        type="button"
        class="si-ci-candidate"
        @click="pick(candidate)"
      >
        <SiAvatar :size="36" color="charcoal" rounded="10">
          <span class="si-ci-insurer__initials">{{ initials(candidate.name) }}</span>
        </SiAvatar>
        <div class="si-ci-candidate__text">
          <span class="si-ci-candidate__name">{{ candidate.name }}</span>
          <span class="si-ci-candidate__meta">
            CNPJ {{ formatCnpj(candidate.documentNumber) }} · {{ candidateCity(candidate) }}
          </span>
        </div>
        <SiChip v-if="candidate.isAppointedToBrokerage" color="success" size="small" variant="tonal">
          Já é tomador
        </SiChip>
        <SiIcon :icon="'chevronRight'" :size="18" class="si-ci-candidate__chevron" />
      </button>
    </SiCard>

    <!-- notfound. -->
    <div v-if="phase === 'notfound'" class="si-ci-state">
      <span class="si-ci-state__icon si-ci-state__icon--neutral">
        <SiIcon :icon="'search'" :size="24" />
      </span>
      <h2 class="si-ci-state__title">Nenhum tomador encontrado</h2>
      <p class="si-ci-state__text">
        Não encontramos nenhum tomador para "{{ searchTerm }}". Confira a grafia ou informe o CNPJ.
      </p>
    </div>

    <!-- error. -->
    <div v-if="phase === 'error'" class="si-ci-state">
      <span class="si-ci-state__icon si-ci-state__icon--danger">
        <SiIcon :icon="'alertTriangle'" :size="24" />
      </span>
      <h2 class="si-ci-state__title">Não foi possível concluir a consulta</h2>
      <p class="si-ci-state__text">{{ errorMessage }}</p>
      <SiButton :prepend-icon="'refresh'" @click="retryInquiry">Tentar novamente</SiButton>
    </div>

    <!-- result. -->
    <template v-if="phase === 'result' && response">
      <SiCard variant="outlined" class="si-ci-holder">
        <div class="si-ci-holder__head">
          <SiAvatar :size="48" color="charcoal" rounded="14">
            <span class="si-ci-insurer__initials">{{ initials(resultName) }}</span>
          </SiAvatar>
          <div class="si-ci-holder__id">
            <span class="si-ci-holder__name">{{ resultName }}</span>
            <span class="si-ci-holder__meta">
              CNPJ {{ formatCnpj(resultCnpj) }}<template v-if="resultCity"> · {{ resultCity }}</template>
            </span>
          </div>
          <SiButton
            v-if="!isEmbed"
            variant="outlined"
            color="secondary"
            size="small"
            :prepend-icon="'refresh'"
            @click="retryInquiry"
          >
            Reconsultar
          </SiButton>
        </div>

        <!-- Faixa de KPIs (RN-029): células planas sobre o card branco (não cards internos), como o
             protótipo — label caixa-alta + valor tabular; divisórias de 1px pelo gap do grid. -->
        <div class="si-ci-kpis">
          <div class="si-ci-kpi">
            <span class="si-ci-kpi__label">Seguradoras consultadas</span>
            <span class="si-ci-kpi__value">{{ `${kpis.queried} de ${kpis.queried}` }}</span>
            <SiProgressLinear :model-value="100" color="primary" height="4" rounded class="si-ci-kpi__bar" />
          </div>
          <div class="si-ci-kpi">
            <span class="si-ci-kpi__label">Com limite aprovado</span>
            <span class="si-ci-kpi__value">{{ kpis.available }}</span>
            <span class="si-ci-kpi__hint">{{ kpis.withoutLimit }} sem limite ou indisponíveis</span>
          </div>
          <div class="si-ci-kpi si-ci-kpi--accent">
            <span class="si-ci-kpi__label">Maior limite disponível</span>
            <span class="si-ci-kpi__value">{{ kpis.maxLimit }}</span>
            <span class="si-ci-kpi__hint">{{ kpis.leaderName }}</span>
          </div>
          <div class="si-ci-kpi si-ci-kpi--date">
            <span class="si-ci-kpi__label">Consulta</span>
            <span class="si-ci-kpi__value">{{ kpis.queriedAt }}</span>
            <span v-if="kpis.elapsed" class="si-ci-kpi__hint">concluída em {{ kpis.elapsed }}</span>
          </div>
        </div>
      </SiCard>

      <div v-if="noneAvailable" class="si-ci-state">
        <span class="si-ci-state__icon si-ci-state__icon--warning">
          <SiIcon :icon="'alertTriangle'" :size="24" />
        </span>
        <h2 class="si-ci-state__title">Nenhuma seguradora retornou limite disponível</h2>
        <p class="si-ci-state__text">
          Verifique se o tomador tem cadastro ativo nas seguradoras ou reconsulte em alguns minutos.
          Seguradoras indisponíveis não significam recusa de crédito.
        </p>
      </div>

      <CreditInquiryTable :rows="rows" :mode="mode" />
    </template>

    <SiSnackbar
      :model-value="Boolean(toast)"
      @update:model-value="(v) => { if (!v) toast = '' }"
    >
      {{ toast }}
    </SiSnackbar>
  </section>
</template>

<style scoped>
.si-ci-panel {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
}

.si-ci-panel--embed {
  gap: var(--si-space-4);
}

/* Cabeçalho. */
.si-ci-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
  flex-wrap: wrap;
}

.si-ci-panel__heading {
  flex: 1;
  min-width: 0;
}

.si-ci-panel__title {
  margin: 0;
  font-size: 28px;
  font-weight: var(--si-font-weight-semibold);
  letter-spacing: -0.02em;
}

.si-ci-panel__actions {
  display: flex;
  gap: var(--si-space-2);
  flex-wrap: wrap;
}

/* Faixa de contexto (embed). */
.si-ci-context {
  display: flex;
  gap: var(--si-space-6);
  align-items: flex-start;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  padding: var(--si-space-4);
}

.si-ci-context__block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.si-ci-context__block--grow {
  flex: 1;
}

.si-ci-context__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--si-cinza);
}

.si-ci-context__value {
  font-size: 13.5px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-context__value--wrap {
  white-space: normal;
}

.si-ci-context__doc {
  font-size: 12.5px;
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

/* Card de busca. */
.si-ci-search {
  padding: var(--si-space-5) var(--si-space-5) var(--si-space-4);
  /* Card branco como o protótipo (o variant outlined do Vuetify vem transparente). */
  background: rgb(var(--v-theme-surface));
}

.si-ci-search__fields {
  display: flex;
  align-items: flex-end;
  gap: var(--si-space-3);
  flex-wrap: wrap;
}

.si-ci-search__broker {
  flex: 0 1 300px;
  /* Deixa o flex encolher até o basis mesmo com nome de Corretora longo (o select trunca),
   * senão o min-content do nome empurra e esmaga o campo Tomador ao lado. */
  min-width: 0;
}

.si-ci-search__query {
  flex: 1 1 340px;
  min-width: 300px;
}

.si-ci-search__submit {
  min-height: 44px;
}

.si-ci-search__error {
  display: flex;
  align-items: center;
  gap: var(--si-space-1);
  margin: var(--si-space-2) 0 0;
  font-size: 12.5px;
  color: rgb(var(--v-theme-error));
}

.si-ci-search__recent {
  margin-top: var(--si-space-4);
  padding-top: var(--si-space-4);
  border-top: 1px solid var(--si-cinza-claro);
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  flex-wrap: wrap;
}

.si-ci-search__recent-label {
  font-size: 12px;
  color: var(--si-cinza);
}

.si-ci-search__recent-chips {
  display: flex;
  gap: var(--si-space-2);
  flex-wrap: wrap;
}

.si-ci-recent-chip {
  min-height: 30px;
  padding-inline: var(--si-space-3);
  border-radius: var(--si-radius-pill);
  border: 1px solid var(--si-cinza-claro);
  background: rgb(var(--v-theme-surface));
  font-size: 12.5px;
  cursor: pointer;
}

/* Estados centrais. */
.si-ci-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-3);
  padding: var(--si-space-12) var(--si-space-4);
}

/* Na página, os estados (vazio/buscando/carregando/sem-resultado/erro) ficam num card branco
 * enquadrado, como o protótipo. No embed (modal) a moldura é o próprio diálogo, então não enquadra. */
.si-ci-panel--page .si-ci-state {
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
}

.si-ci-state__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: var(--si-radius-pill);
}

.si-ci-state__icon--neutral {
  background: var(--si-cinza-suave);
  color: var(--si-cinza);
}

.si-ci-state__icon--danger {
  background: var(--si-danger-tint);
  color: rgb(var(--v-theme-error));
}

.si-ci-state__icon--warning {
  background: var(--si-warning-tint);
  color: var(--si-warning-fg);
}

.si-ci-state__title {
  margin: 0;
  font-size: 17px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-state__text {
  margin: 0;
  max-width: 460px;
  font-size: 13.5px;
  color: var(--si-cinza);
}

/* Candidatos. */
.si-ci-candidates {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.si-ci-candidates__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  flex-wrap: wrap;
  padding: var(--si-space-4) var(--si-space-5);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-ci-candidates__count {
  font-size: 14px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-candidates__hint {
  font-size: 12.5px;
  color: var(--si-cinza);
}

.si-ci-candidate {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  width: 100%;
  min-height: 64px;
  padding: var(--si-space-3) var(--si-space-5);
  border: none;
  border-bottom: 1px solid var(--si-cinza-claro);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.si-ci-candidate:hover {
  background: rgb(var(--v-theme-background));
}

.si-ci-candidate__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-ci-candidate__name {
  font-size: 14.5px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-candidate__meta {
  font-size: 12.5px;
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-ci-candidate__chevron {
  color: var(--si-cinza);
}

/* Cartão do tomador + KPIs. */
.si-ci-holder {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.si-ci-holder__head {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
}

.si-ci-holder__id {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-ci-holder__name {
  font-size: 18px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-holder__meta {
  font-size: 13px;
  color: var(--si-cinza);
}

.si-ci-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--si-cinza-claro);
  border-top: 1px solid var(--si-cinza-claro);
}

.si-ci-kpi {
  background: rgb(var(--v-theme-background));
  padding: var(--si-space-4) var(--si-space-5);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
}

.si-ci-kpi__label {
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--si-cinza);
}

.si-ci-kpi__value {
  font-size: 22px;
  line-height: 1.15;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}

.si-ci-kpi__hint {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-ci-kpi--accent .si-ci-kpi__value {
  color: var(--si-verde-800);
}

/* KPI "Consulta" (data/hora): valor menor que os numéricos, como o protótipo (15px). */
.si-ci-kpi--date .si-ci-kpi__value {
  font-size: 15px;
  line-height: 1.3;
}

.si-ci-kpi__bar {
  margin-top: var(--si-space-2);
}

@media (max-width: 1024px) {
  .si-ci-panel__title {
    font-size: 24px;
  }

  .si-ci-search__fields {
    flex-direction: column;
    align-items: stretch;
  }

  .si-ci-search__broker,
  .si-ci-search__query {
    flex: 1 1 auto;
    min-width: 0;
  }

  .si-ci-search__submit {
    width: 100%;
    min-height: 48px;
  }

  .si-ci-kpis {
    grid-template-columns: 1fr 1fr;
  }

  .si-ci-context {
    flex-direction: column;
    gap: var(--si-space-3);
  }
}

@media (max-width: 560px) {
  .si-ci-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
