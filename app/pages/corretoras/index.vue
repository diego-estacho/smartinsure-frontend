<script setup lang="ts">
/**
 * Corretoras — listagem (RN-018). Página fina (ADR-018): orquestra o estado de tela, chama o
 * composable de dados (filtro/ordenação/paginação server-side) e compõe os componentes de
 * domínio (abas de situação, busca, drawer de filtros, chips, tabela e paginação).
 */
import type { BrokerageFilters } from '~/components/brokerages/FiltersDrawer.vue'
import type { BrokerageListItem, BrokerageSituationCounts } from '~/composables/useBrokerages'
import {
  brokerageSituationTabs,
  brokerageSectorOptions,
  getBrokerageSituationAction,
} from '~/lib/status/brokerages'

definePageMeta({ layout: 'shell' })

const { listBrokerages, changeBrokerageStatus } = useBrokerages()
const { listInsurers } = useInsurers()

const items = ref<BrokerageListItem[]>([])
const counts = ref<BrokerageSituationCounts>({ all: 0, active: 0, incomplete: 0, inactive: 0 })
const totalCount = ref(0)
const listState = ref<'data' | 'loading' | 'error'>('loading')

const query = ref('')
const situation = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)
const filtersOpen = ref(false)
const filters = ref<BrokerageFilters>({
  situation: null,
  insurerId: null,
  calculationEngine: null,
  sector: null,
  registeredFrom: null,
  registeredTo: null,
})

const insurers = ref<{ title: string, value: string }[]>([])
const inactivateTarget = ref<BrokerageListItem | null>(null)
const busy = ref(false)
const toast = ref('')
const createOpen = ref(false)

const subtitle = computed(() =>
  `${counts.value.all} corretora${counts.value.all === 1 ? '' : 's'}`
  + ` · ${counts.value.active} ativa${counts.value.active === 1 ? '' : 's'}`
  + ` · ${counts.value.incomplete} com cadastro incompleto`,
)

// Nº de filtros avançados aplicados (a situação vive nas abas).
const advancedFilterCount = computed(() =>
  [filters.value.insurerId, filters.value.calculationEngine, filters.value.sector,
    filters.value.registeredFrom, filters.value.registeredTo].filter(Boolean).length)

const appliedChips = computed(() => {
  const chips: { key: string, label: string, remove: () => void }[] = []
  if (filters.value.insurerId) {
    const name = insurers.value.find(i => i.value === filters.value.insurerId)?.title ?? 'Seguradora'
    chips.push({ key: 'insurer', label: name, remove: () => setFilter('insurerId', null) })
  }
  if (filters.value.calculationEngine) {
    chips.push({ key: 'engine', label: filters.value.calculationEngine, remove: () => setFilter('calculationEngine', null) })
  }
  if (filters.value.sector) {
    const label = brokerageSectorOptions.find(o => o.value === filters.value.sector)?.title ?? filters.value.sector
    chips.push({ key: 'sector', label: `Setor ${label.toLowerCase()}`, remove: () => setFilter('sector', null) })
  }
  if (filters.value.registeredFrom) {
    chips.push({ key: 'from', label: `De ${formatDate(filters.value.registeredFrom)}`, remove: () => setFilter('registeredFrom', null) })
  }
  if (filters.value.registeredTo) {
    chips.push({ key: 'to', label: `Até ${formatDate(filters.value.registeredTo)}`, remove: () => setFilter('registeredTo', null) })
  }
  return chips
})

const hasAnyFilter = computed(() =>
  Boolean(query.value) || situation.value !== null || advancedFilterCount.value > 0)

const rangeLabel = computed(() => {
  if (totalCount.value === 0) return 'Nenhum resultado'
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, totalCount.value)
  return `Mostrando ${start}–${end} de ${totalCount.value} resultados`
})

await loadInsurers()
await refresh()

async function refresh() {
  listState.value = 'loading'
  try {
    const response = await listBrokerages({
      page: page.value,
      pageSize: pageSize.value,
      q: query.value || undefined,
      situation: situation.value,
      insurerId: filters.value.insurerId,
      calculationEngine: filters.value.calculationEngine,
      sector: filters.value.sector,
      registeredFrom: filters.value.registeredFrom,
      registeredTo: filters.value.registeredTo,
    })
    items.value = response.items
    counts.value = response.counts
    totalCount.value = Number(response.totalCount)
    listState.value = 'data'
  }
  catch {
    listState.value = 'error'
  }
}

async function loadInsurers() {
  try {
    const response = await listInsurers({ pageSize: 100 })
    insurers.value = response.items.map(insurer => ({
      title: insurer.tradeName ?? insurer.corporateName,
      value: insurer.id,
    }))
  }
  catch { /* filtro de seguradora fica vazio se a lista falhar */ }
}

// Qualquer alteração de filtro volta à página 1 (RN-018).
function resetAndRefresh() {
  page.value = 1
  refresh()
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(resetAndRefresh, 300)
})

watch(situation, () => {
  filters.value.situation = situation.value
  resetAndRefresh()
})

function applyFilters(next: BrokerageFilters) {
  filters.value = next
  situation.value = next.situation
  resetAndRefresh()
}

function setFilter<K extends keyof BrokerageFilters>(key: K, value: BrokerageFilters[K]) {
  filters.value = { ...filters.value, [key]: value }
  resetAndRefresh()
}

function clearFilters() {
  query.value = ''
  situation.value = null
  filters.value = {
    situation: null, insurerId: null, calculationEngine: null,
    sector: null, registeredFrom: null, registeredTo: null,
  }
  resetAndRefresh()
}

function goToPage(target: number) {
  page.value = target
  refresh()
}

function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
  refresh()
}

function openDetail(item: BrokerageListItem) {
  navigateTo(`/corretoras/${item.id}`)
}

async function confirmInactivate() {
  const target = inactivateTarget.value
  const action = target ? getBrokerageSituationAction(target.situation) : null
  if (!target || !action) return
  busy.value = true
  try {
    await changeBrokerageStatus(target.id, action.targetStatus)
    toast.value = action.successMessage
    inactivateTarget.value = null
    await refresh()
  }
  catch { toast.value = 'Não foi possível alterar a situação da corretora.' }
  finally { busy.value = false }
}

function exportList() {
  // TODO(AB#): endpoint de exportação ainda não existe no backend (RN a definir).
  toast.value = 'Exportação disponível em breve.'
}

function onBrokerageCreated(payload: { id: string, incomplete: boolean }) {
  toast.value = payload.incomplete ? 'Corretora cadastrada como incompleta.' : 'Corretora cadastrada.'
  refresh()
}

function onBrokerageDiscarded() {
  toast.value = 'Cadastro descartado. Nada foi salvo.'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR')
}
</script>

<template>
  <VContainer class="si-brokerages">
    <div class="si-brokerages__header">
      <div>
        <h1 class="si-brokerages__title">
          Corretoras
        </h1>
        <p class="si-brokerages__subtitle">
          {{ subtitle }}
        </p>
      </div>

      <div class="si-brokerages__actions">
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'download'"
          @click="exportList"
        >
          Exportar
        </SiButton>
        <SiButton
          :prepend-icon="'plus'"
          @click="createOpen = true"
        >
          Nova corretora
        </SiButton>
      </div>
    </div>

    <SiCard
      variant="outlined"
      class="si-brokerages__filters"
    >
      <SiTabs
        v-model="situation"
        class="si-brokerages__tabs"
      >
        <SiTab
          v-for="tab in brokerageSituationTabs"
          :key="tab.key"
          :value="tab.value"
          :text="tab.label"
          :count="counts[tab.key]"
        />
      </SiTabs>

      <div class="si-brokerages__search-row">
        <SiTextField
          v-model="query"
          placeholder="Buscar por CNPJ, razão social ou nome fantasia"
          :prepend-inner-icon="'search'"
          density="compact"
          clearable
          hide-details
          class="si-brokerages__search"
        />
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'sliders'"
          @click="filtersOpen = true"
        >
          Filtros avançados
          <SiChip
            v-if="advancedFilterCount > 0"
            size="x-small"
            color="success"
            class="ml-2"
          >
            {{ advancedFilterCount }}
          </SiChip>
        </SiButton>
      </div>

      <div
        v-if="appliedChips.length"
        class="si-brokerages__chips"
      >
        <SiChip
          v-for="chip in appliedChips"
          :key="chip.key"
          size="small"
          closable
          @click:close="chip.remove"
        >
          {{ chip.label }}
        </SiChip>
        <SiButton
          variant="text"
          size="small"
          @click="clearFilters"
        >
          Limpar filtros
        </SiButton>
      </div>
    </SiCard>

    <SiCard
      variant="outlined"
      class="si-brokerages__table-card"
    >
      <!-- Erro -->
      <div
        v-if="listState === 'error'"
        class="si-brokerages__state"
      >
        <div class="si-brokerages__state-icon si-brokerages__state-icon--danger">
          <SiIcon :icon="'alertTriangle'" />
        </div>
        <h2 class="si-brokerages__state-title">
          Não foi possível carregar as corretoras
        </h2>
        <p class="si-brokerages__state-text">
          A consulta expirou. Isso costuma ser instabilidade momentânea do serviço de cadastro.
        </p>
        <SiButton
          :prepend-icon="'refresh'"
          @click="refresh"
        >
          Tentar novamente
        </SiButton>
      </div>

      <!-- Vazio -->
      <div
        v-else-if="listState === 'data' && items.length === 0"
        class="si-brokerages__state"
      >
        <div class="si-brokerages__state-icon">
          <SiIcon :icon="'search'" />
        </div>
        <h2 class="si-brokerages__state-title">
          Nenhuma corretora encontrada
        </h2>
        <p class="si-brokerages__state-text">
          Ajuste a busca ou os filtros, ou cadastre uma nova corretora para começar.
        </p>
        <div class="si-brokerages__state-actions">
          <SiButton
            v-if="hasAnyFilter"
            variant="outlined"
            color="secondary"
            @click="clearFilters"
          >
            Limpar filtros
          </SiButton>
          <SiButton
            :prepend-icon="'plus'"
            @click="createOpen = true"
          >
            Nova corretora
          </SiButton>
        </div>
      </div>

      <!-- Dados / carregando -->
      <template v-else>
        <BrokeragesListTable
          :items="items"
          :loading="listState === 'loading'"
          @open="openDetail"
          @view="openDetail"
          @edit="openDetail"
          @enable="openDetail"
          @inactivate="inactivateTarget = $event"
        />
        <div class="si-brokerages__footer">
          <span class="si-brokerages__range">{{ rangeLabel }}</span>
          <SiPagination
            :page="page"
            :items-per-page="pageSize"
            :total="totalCount"
            @update:page="goToPage"
            @update:items-per-page="changePageSize"
          />
        </div>
      </template>
    </SiCard>

    <BrokeragesFiltersDrawer
      v-model="filtersOpen"
      :filters="filters"
      :result-count="totalCount"
      :insurers="insurers"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <BrokeragesCreateWizard
      v-model="createOpen"
      @created="onBrokerageCreated"
      @discarded="onBrokerageDiscarded"
    />

    <SiDialog
      :model-value="inactivateTarget !== null"
      :max-width="440"
      @update:model-value="(v) => { if (!v) inactivateTarget = null }"
    >
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          {{ getBrokerageSituationAction(inactivateTarget?.situation).confirmTitle }}
        </h2>
        <p class="mb-5">
          {{ getBrokerageSituationAction(inactivateTarget?.situation).confirmText }}
        </p>
        <div class="si-brokerages__dialog-actions">
          <SiButton
            variant="text"
            @click="inactivateTarget = null"
          >
            Cancelar
          </SiButton>
          <SiButton
            :color="getBrokerageSituationAction(inactivateTarget?.situation).color"
            :loading="busy"
            @click="confirmInactivate"
          >
            {{ getBrokerageSituationAction(inactivateTarget?.situation).label.split(' ')[0] }}
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>

    <SiSnackbar
      :model-value="Boolean(toast)"
      @update:model-value="(v) => { if (!v) toast = '' }"
    >
      {{ toast }}
    </SiSnackbar>
  </VContainer>
</template>

<style scoped>
.si-brokerages {
  max-width: var(--si-container-wide);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
}

.si-brokerages__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-top: var(--si-space-6);
}

.si-brokerages__title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: var(--si-font-weight-semibold);
}

.si-brokerages__subtitle {
  margin: var(--si-space-1) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-brokerages__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-brokerages__tabs {
  padding: 0 var(--si-space-5);
}

.si-brokerages__search-row {
  display: flex;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  flex-wrap: wrap;
}

.si-brokerages__search {
  flex: 1;
  min-width: 280px;
}

.si-brokerages__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  padding: 0 var(--si-space-5) var(--si-space-4);
}

.si-brokerages__table-card {
  overflow: hidden;
}

.si-brokerages__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-3) var(--si-space-5);
  background: rgb(var(--v-theme-background));
  flex-wrap: wrap;
}

.si-brokerages__range {
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-brokerages__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-3);
  padding: 64px 24px;
}

.si-brokerages__state-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--si-radius-pill);
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

.si-brokerages__state-icon--danger {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.si-brokerages__state-title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-brokerages__state-text {
  margin: 0;
  max-width: 380px;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-brokerages__state-actions {
  display: flex;
  gap: var(--si-space-2);
  margin-top: var(--si-space-2);
}

.si-brokerages__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

@media (max-width: 767.98px) {
  .si-brokerages__header,
  .si-brokerages__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
