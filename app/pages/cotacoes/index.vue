<script setup lang="ts">
import type { QuotationBookItem } from '~/composables/useQuotationBook'
import { getQuotationSituationView, quotationSituationOptions } from '~/lib/status/quotations'

/**
 * Listagem de Cotações — o "livro" da Corretora (RN-077/RN-078). Read-only, paginado e filtrado no
 * servidor: cada linha é uma Cotação (uma Seguradora), achatando os Grupos. A situação apresentada
 * (RN-078) vem do resultado por nome estável, relabelada aqui. Mobile é lista de cards (não a tabela
 * rolando). Núcleo desta fatia: abas + busca + tabela + paginação + estados; o drawer de filtros
 * avançados entra na fatia seguinte (o backend já aceita os params).
 */
definePageMeta({ layout: 'shell' })

const { listQuotations } = useQuotationBook()

const items = ref<QuotationBookItem[]>([])
const counts = ref<Record<string, number>>({})
const totalCount = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)

const page = ref(1)
const pageSize = ref(8)
const search = ref('')
const situation = ref<string | null>(null)

const hasActiveFilters = computed(() => !!search.value || situation.value !== null)
const isEmptyFirstUse = computed(
  () => !loading.value && !error.value && items.value.length === 0 && !hasActiveFilters.value,
)

// DS Table: rótulos à esquerda; IS é o valor destacado (dimensiona a operação).
const headers = [
  { title: 'Cotação', key: 'number', sortable: false },
  { title: 'Tomador', key: 'policyHolderName', sortable: false },
  { title: 'Segurado', key: 'insuredName', sortable: false },
  { title: 'Seguradora', key: 'insurerName', sortable: false },
  { title: 'Modalidade', key: 'modalityName', sortable: false },
  { title: 'Valores', key: 'values', sortable: false, align: 'end' },
  { title: 'Status', key: 'result', sortable: false },
  { title: 'Vigência', key: 'coverage', sortable: false },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
] as const

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Decimais do contrato podem chegar como string ou number (openapi) — coage e valida.
function money(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    return '—'
  }
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isNaN(n) ? '—' : brl.format(n)
}

function percent(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    return '—'
  }
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isNaN(n) ? '—' : `${n.toLocaleString('pt-BR')}%`
}

// Datas do contrato chegam como "AAAA-MM-DD" (DateOnly) — formata sem depender de fuso.
function shortDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—'
  }
  const [year, month, day] = iso.slice(0, 10).split('-')
  return day && month && year ? `${day}/${month}/${year}` : '—'
}

function situationCount(value: string | null): number {
  if (value === null) {
    return Object.values(counts.value).reduce((sum, n) => sum + n, 0)
  }
  return counts.value[value] ?? 0
}

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listQuotations({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      situation: situation.value,
    })
    items.value = response.items ?? []
    totalCount.value = Number(response.totalCount ?? 0)
    counts.value = Object.fromEntries(
      (response.counts ?? []).map(count => [count.result, Number(count.count)]),
    )
  }
  catch {
    error.value = 'Não foi possível carregar as cotações.'
  }
  finally {
    loading.value = false
  }
}

// Nova busca/aba volta à página 1 e refaz (server-side).
watch([search, situation], () => {
  page.value = 1
  refresh()
})

function goToPage(target: number) {
  page.value = target
  refresh()
}

function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
  refresh()
}

function clearFilters() {
  search.value = ''
  situation.value = null
}
</script>

<template>
  <VContainer class="si-quotations">
    <!-- Cabeçalho: escondido no vazio-primeiro-uso (só um CTA verde por tela). -->
    <div
      v-if="!isEmptyFirstUse"
      class="si-quotations__header"
    >
      <div class="si-quotations__title">
        <span class="si-quotations__eyebrow">Plataforma · Cotações</span>
        <h1 class="text-h5">
          Cotações
        </h1>
      </div>

      <div class="si-quotations__header-actions">
        <SiButton
          :prepend-icon="'refresh'"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>
        <SiButton
          to="/ofertas/nova"
          :prepend-icon="'plus'"
        >
          Nova oferta
        </SiButton>
      </div>
    </div>

    <template v-if="!isEmptyFirstUse && !error">
      <div class="si-quotations__tabs">
        <SiButton
          v-for="option in quotationSituationOptions"
          :key="option.title"
          :variant="situation === option.value ? 'tonal' : 'text'"
          size="small"
          @click="situation = option.value"
        >
          {{ option.title }} ({{ situationCount(option.value) }})
        </SiButton>
      </div>

      <div class="si-quotations__toolbar">
        <SiTextField
          v-model="search"
          placeholder="Buscar por tomador, segurado, seguradora, modalidade ou nº"
          density="compact"
          prepend-inner-icon="search"
          clearable
          class="si-quotations__search"
        />
      </div>
    </template>

    <!-- Estado: erro (com retry). -->
    <SiCard
      v-if="error"
      variant="outlined"
      class="si-quotations__state"
    >
      <SiIcon
        icon="alertTriangle"
        :size="40"
        class="si-quotations__state-icon"
      />
      <h2 class="text-subtitle-1">
        Não foi possível carregar as cotações
      </h2>
      <p class="si-quotations__state-text">
        A consulta pode ter expirado. Tente novamente.
      </p>
      <SiButton
        :prepend-icon="'refresh'"
        @click="refresh"
      >
        Tentar novamente
      </SiButton>
    </SiCard>

    <!-- Estado: vazio — primeiro uso (base vazia): sem filtros, com CTA. -->
    <SiCard
      v-else-if="isEmptyFirstUse"
      variant="outlined"
      class="si-quotations__state"
    >
      <SiIcon
        icon="fileText"
        :size="40"
        class="si-quotations__state-icon"
      />
      <h2 class="text-subtitle-1">
        Você ainda não tem cotações
      </h2>
      <p class="si-quotations__state-text">
        Quando você cotar uma oferta, cada retorno das seguradoras aparece aqui.
      </p>
      <SiButton
        to="/ofertas/nova"
        :prepend-icon="'plus'"
      >
        Nova oferta
      </SiButton>
    </SiCard>

    <!-- Estado: vazio — filtro sem resultado. -->
    <SiCard
      v-else-if="!loading && items.length === 0"
      variant="outlined"
      class="si-quotations__state"
    >
      <SiIcon
        icon="search"
        :size="40"
        class="si-quotations__state-icon"
      />
      <h2 class="text-subtitle-1">
        Nenhuma cotação encontrada
      </h2>
      <p class="si-quotations__state-text">
        {{ search ? `Nada corresponde a "${search}".` : 'Nenhuma cotação para os filtros aplicados.' }}
      </p>
      <SiButton
        variant="tonal"
        @click="clearFilters"
      >
        Limpar filtros
      </SiButton>
    </SiCard>

    <!-- Dados (+ carregando inline). -->
    <template v-else>
      <div class="si-quotations__count">
        {{ totalCount }} cotação{{ totalCount === 1 ? '' : 'es' }}
      </div>

      <!-- Desktop: tabela (escondida no mobile por CSS). -->
      <SiCard
        variant="outlined"
        class="si-quotations__table-card"
      >
        <SiDataTable
          :headers="headers"
          :items="items"
          :loading="loading"
          :items-per-page="pageSize"
          hide-default-footer
          class="si-quotations__table"
        >
          <template #[`item.number`]="{ item }">
            <span class="si-quotations__mono">{{ item.number ?? '—' }}</span>
          </template>

          <template #[`item.policyHolderName`]="{ item }">
            <span class="si-cell-strong">{{ item.policyHolderName }}</span>
          </template>

          <template #[`item.insuredName`]="{ item }">
            <span class="si-quotations__muted">{{ item.insuredName }}</span>
          </template>

          <template #[`item.insurerName`]="{ item }">
            {{ item.insurerName }}
          </template>

          <template #[`item.modalityName`]="{ item }">
            <span class="si-quotations__muted">{{ item.modalityName }}</span>
          </template>

          <template #[`item.values`]="{ item }">
            <div class="si-quotations__values">
              <span class="si-quotations__values-label">IS</span>
              <span class="si-quotations__values-is">{{ money(item.insuredAmount) }}</span>
              <span class="si-quotations__values-sub">
                Prêmio {{ money(item.premium) }} · Comissão {{ percent(item.commissionPercentage) }}
              </span>
            </div>
          </template>

          <template #[`item.result`]="{ item }">
            <SiChip
              :color="getQuotationSituationView(item.result).color"
              size="small"
            >
              {{ getQuotationSituationView(item.result).label }}
            </SiChip>
          </template>

          <template #[`item.coverage`]="{ item }">
            <div class="si-quotations__coverage">
              <span>{{ shortDate(item.coverageStartDate) }}</span>
              <span class="si-quotations__muted">até {{ shortDate(item.coverageEndDate) }}</span>
            </div>
          </template>

          <!-- Ações reservadas (fatias futuras: detalhes/continuar/cancelar). -->
          <template #[`item.actions`]>
            <span class="si-quotations__muted">—</span>
          </template>
        </SiDataTable>
      </SiCard>

      <!-- Mobile: cards (escondidos no desktop por CSS). -->
      <div class="si-quotations__cards">
        <SiCard
          v-for="item in items"
          :key="item.quotationId"
          variant="outlined"
          class="si-quotations__card"
        >
          <div class="si-quotations__card-top">
            <span class="si-quotations__mono">{{ item.number ?? '—' }}</span>
            <SiChip
              :color="getQuotationSituationView(item.result).color"
              size="small"
            >
              {{ getQuotationSituationView(item.result).label }}
            </SiChip>
          </div>
          <div class="si-quotations__card-holder">
            {{ item.policyHolderName }}
          </div>
          <div class="si-quotations__muted">
            Segurado · {{ item.insuredName }}
          </div>
          <div class="si-quotations__card-grid">
            <div>
              <span class="si-quotations__card-key">Seguradora</span>
              <span>{{ item.insurerName }}</span>
            </div>
            <div>
              <span class="si-quotations__card-key">Modalidade</span>
              <span>{{ item.modalityName }}</span>
            </div>
            <div>
              <span class="si-quotations__card-key">Imp. segurada</span>
              <span>{{ money(item.insuredAmount) }}</span>
            </div>
            <div>
              <span class="si-quotations__card-key">Prêmio</span>
              <span>{{ money(item.premium) }}</span>
            </div>
          </div>
          <div class="si-quotations__muted">
            Vigência {{ shortDate(item.coverageStartDate) }} até {{ shortDate(item.coverageEndDate) }}
          </div>
        </SiCard>
      </div>

      <SiPagination
        :page="page"
        :items-per-page="pageSize"
        :total="totalCount"
        @update:page="goToPage"
        @update:items-per-page="changePageSize"
      />
    </template>
  </VContainer>
</template>

<style scoped>
.si-quotations {
  max-width: var(--si-container-wide);
}

.si-quotations__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-quotations__title {
  min-width: 0;
}

.si-quotations__eyebrow {
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  white-space: nowrap;
}

.si-quotations__title h1 {
  margin: 0;
}

.si-quotations__header-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-quotations__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-1);
  border-bottom: 1px solid var(--si-cinza-claro);
  padding-bottom: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-quotations__toolbar {
  margin-bottom: var(--si-space-3);
}

.si-quotations__search {
  max-width: 420px;
}

.si-quotations__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
  margin-bottom: var(--si-space-2);
}

.si-quotations__table-card {
  overflow: hidden;
}

.si-quotations__mono {
  font-family: var(--si-font-mono);
  font-size: var(--si-fs-small);
  white-space: nowrap;
}

.si-quotations__muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-quotations__values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.si-quotations__values-label {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-quotations__values-is {
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-quotations__values-sub {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-quotations__coverage {
  display: flex;
  flex-direction: column;
  font-variant-numeric: tabular-nums;
}

/* Toggle desktop/mobile no breakpoint 1024px (AppShell). */
.si-quotations__cards {
  display: none;
}

@media (max-width: 1023.98px) {
  .si-quotations__table-card {
    display: none;
  }

  .si-quotations__cards {
    display: flex;
    flex-direction: column;
    gap: var(--si-space-3);
  }

  .si-quotations__header,
  .si-quotations__header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

.si-quotations__card {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  padding: var(--si-space-4);
}

.si-quotations__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.si-quotations__card-holder {
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-quotations__card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-2);
  margin-block: var(--si-space-2);
}

.si-quotations__card-grid > div {
  display: flex;
  flex-direction: column;
}

.si-quotations__card-key {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}

.si-quotations__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-2);
  padding: var(--si-space-10) var(--si-space-6);
}

.si-quotations__state-icon {
  color: var(--si-cinza);
}

.si-quotations__state-text {
  margin: 0;
  max-width: 46ch;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}
</style>
