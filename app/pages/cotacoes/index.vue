<script setup lang="ts">
import type { QuotationBookItem } from '~/composables/useQuotationBook'
import type { QuotationFilters } from '~/components/quotations/FiltersDrawer.vue'
import {
  getQuotationSituationView,
  quotationResults,
  quotationSituationOptions,
} from '~/lib/status/quotations'

/**
 * Listagem de Cotações — o "livro" da Corretora (RN-077/RN-078). Read-only, paginado e filtrado no
 * servidor: cada linha é uma Cotação (uma Seguradora), achatando os Grupos. A situação apresentada
 * (RN-078) vem do resultado por nome estável, relabelada aqui. Mobile é lista de cards (não a tabela
 * rolando). Filtros avançados num drawer (opções = distintos no livro, Q10). Estrutura de tela igual
 * às demais listagens (Corretoras): header + card de filtros (abas/busca) + card da tabela + rodapé.
 */
definePageMeta({ layout: 'shell' })

const { listQuotations } = useQuotationBook()

const items = ref<QuotationBookItem[]>([])
const counts = ref<Record<string, number>>({})
const insurers = ref<{ title: string, value: string }[]>([])
const modalities = ref<{ title: string, value: string }[]>([])
const totalCount = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)

const page = ref(1)
const pageSize = ref(8)
const search = ref('')
const situation = ref<string | null>(null)
const drawerOpen = ref(false)

function emptyFilters(): QuotationFilters {
  return {
    insurerId: null,
    modalityId: null,
    premiumMin: null,
    premiumMax: null,
    insuredAmountMin: null,
    insuredAmountMax: null,
    createdFrom: null,
    createdTo: null,
    coverageStartFrom: null,
    coverageStartTo: null,
  }
}

const filters = ref<QuotationFilters>(emptyFilters())

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Decimais do contrato podem chegar como string ou number (openapi) — coage e valida.
function money(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    return '—'
  }
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isNaN(n) ? '—' : brl.format(n)
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

// Ação primária da linha por resultado (RN-078). Só visual nesta fatia — Emitir/Continuar entram
// com a emissão/seleção (Fatia 2). Seguível apta → "Emitir"; em análise → "Continuar"; demais sem
// ação primária (não há proposta a seguir).
function primaryAction(result: string | null | undefined) {
  if (result === quotationResults.readyForEmission) {
    return { label: 'Emitir', variant: 'flat' as const, color: 'primary' }
  }
  if (result === quotationResults.analysis) {
    return { label: 'Continuar', variant: 'outlined' as const, color: 'secondary' }
  }
  return null
}

// Chips dos filtros avançados ativos (removíveis). Seguradora/Modalidade resolvem o rótulo pelas opções.
const activeFilterChips = computed<{ key: string, label: string }[]>(() => {
  const f = filters.value
  const chips: { key: string, label: string }[] = []
  if (f.insurerId) {
    chips.push({ key: 'insurer', label: `Seguradora: ${insurers.value.find(i => i.value === f.insurerId)?.title ?? '—'}` })
  }
  if (f.modalityId) {
    chips.push({ key: 'modality', label: `Modalidade: ${modalities.value.find(m => m.value === f.modalityId)?.title ?? '—'}` })
  }
  if (f.premiumMin != null || f.premiumMax != null) {
    chips.push({ key: 'premium', label: `Prêmio: ${money(f.premiumMin)} – ${money(f.premiumMax)}` })
  }
  if (f.insuredAmountMin != null || f.insuredAmountMax != null) {
    chips.push({ key: 'insuredAmount', label: `IS: ${money(f.insuredAmountMin)} – ${money(f.insuredAmountMax)}` })
  }
  if (f.createdFrom || f.createdTo) {
    chips.push({ key: 'created', label: `Criação: ${shortDate(f.createdFrom)} – ${shortDate(f.createdTo)}` })
  }
  if (f.coverageStartFrom || f.coverageStartTo) {
    chips.push({ key: 'coverage', label: `Vigência: ${shortDate(f.coverageStartFrom)} – ${shortDate(f.coverageStartTo)}` })
  }
  return chips
})

const hasActiveFilters = computed(
  () => !!search.value || situation.value !== null || activeFilterChips.value.length > 0,
)
const isEmptyFirstUse = computed(
  () => !loading.value && !error.value && items.value.length === 0 && !hasActiveFilters.value,
)

const rangeLabel = computed(() => {
  if (totalCount.value === 0) {
    return 'Nenhum resultado'
  }
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, totalCount.value)
  return `Exibindo ${start}–${end} de ${totalCount.value}`
})

// Larguras com table-layout:fixed (no <style>): as colunas de texto (Tomador/Segurado/Seguradora)
// truncam com reticências e cedem espaço para Modalidade e Status respirarem; a tabela preenche
// a largura do card, então o que importa é a proporção.
const headers = [
  { title: 'Cotação', key: 'number', sortable: false, width: 112 },
  { title: 'Tomador / Segurado', key: 'policyHolderName', sortable: false, width: 238 },
  { title: 'Seguradora / Modalidade', key: 'insurerName', sortable: false, width: 232 },
  { title: 'Valores', key: 'values', sortable: false, align: 'start', width: 140 },
  { title: 'Status', key: 'result', sortable: false, width: 150 },
  { title: 'Vigência', key: 'coverage', sortable: false, width: 110 },
  { title: 'Ações', key: 'actions', sortable: false, align: 'start', width: 126 },
] as const

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
      ...filters.value,
    })
    items.value = response.items ?? []
    totalCount.value = Number(response.totalCount ?? 0)
    counts.value = Object.fromEntries(
      (response.counts ?? []).map(count => [count.result, Number(count.count)]),
    )
    insurers.value = (response.insurers ?? []).map(option => ({ title: option.name, value: option.id }))
    modalities.value = (response.modalities ?? []).map(option => ({ title: option.name, value: option.id }))
  }
  catch {
    error.value = 'Não foi possível carregar as cotações.'
  }
  finally {
    loading.value = false
  }
}

// Qualquer novo recorte volta à página 1 e refaz (server-side).
function reload() {
  page.value = 1
  refresh()
}

watch(search, reload)
watch(situation, reload)

function applyFilters(next: QuotationFilters) {
  filters.value = next
  reload()
}

function clearDrawerFilters() {
  filters.value = emptyFilters()
  reload()
}

function removeFilterChip(key: string) {
  const f = { ...filters.value }
  if (key === 'insurer') {
    f.insurerId = null
  }
  else if (key === 'modality') {
    f.modalityId = null
  }
  else if (key === 'premium') {
    f.premiumMin = null
    f.premiumMax = null
  }
  else if (key === 'insuredAmount') {
    f.insuredAmountMin = null
    f.insuredAmountMax = null
  }
  else if (key === 'created') {
    f.createdFrom = null
    f.createdTo = null
  }
  else if (key === 'coverage') {
    f.coverageStartFrom = null
    f.coverageStartTo = null
  }
  filters.value = f
  reload()
}

// "Limpar filtros": zera tudo (busca, aba e drawer).
function clearFilters() {
  situation.value = null
  filters.value = emptyFilters()
  if (search.value) {
    search.value = ''
  }
  else {
    reload()
  }
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
</script>

<template>
  <VContainer class="si-quotations">
    <!-- Cabeçalho: eyebrow + título + CTA (o CTA some no vazio-primeiro-uso, que já traz o seu próprio). -->
    <div class="si-quotations__header">
      <div class="si-quotations__title">
        <h1 class="si-quotations__h1">
          Cotações
        </h1>
      </div>

      <div
        v-if="!isEmptyFirstUse"
        class="si-quotations__actions"
      >
        <SiButton
          to="/ofertas/nova"
          :prepend-icon="'plus'"
        >
          Nova oferta
        </SiButton>
      </div>
    </div>

    <!-- Card de filtros: abas de situação + busca + filtros avançados + chips (some no vazio-primeiro-uso). -->
    <SiCard
      v-if="!isEmptyFirstUse"
      variant="flat"
      class="si-quotations__filters"
    >
      <SiTabs
        v-model="situation"
        class="si-quotations__tabs"
      >
        <SiTab
          v-for="option in quotationSituationOptions"
          :key="String(option.value)"
          :value="option.value"
          :text="option.title"
          :count="situationCount(option.value)"
        />
      </SiTabs>

      <div class="si-quotations__search-row">
        <div class="si-quotations__search">
          <SiTextField
            v-model="search"
            placeholder="Buscar por tomador, segurado ou nº da cotação"
            :prepend-inner-icon="'search'"
            clearable
            hide-details
          />
        </div>
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'sliders'"
          class="si-quotations__filters-btn"
          @click="drawerOpen = true"
        >
          Filtros avançados
          <SiChip
            v-if="activeFilterChips.length"
            size="x-small"
            color="success"
            class="ml-2"
          >
            {{ activeFilterChips.length }}
          </SiChip>
        </SiButton>
      </div>

      <div
        v-if="activeFilterChips.length"
        class="si-quotations__chips"
      >
        <SiChip
          v-for="chip in activeFilterChips"
          :key="chip.key"
          size="small"
          closable
          @click:close="removeFilterChip(chip.key)"
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

    <!-- Card da tabela: estados (erro / vazios) OU tabela + rodapé (range + paginação). -->
    <SiCard
      variant="flat"
      class="si-quotations__table-card"
    >
      <!-- Estado: erro (com retry). -->
      <div
        v-if="error"
        class="si-quotations__state"
      >
        <div class="si-quotations__state-icon si-quotations__state-icon--danger">
          <SiIcon icon="alertTriangle" />
        </div>
        <h2 class="si-quotations__state-title">
          Não foi possível carregar as cotações
        </h2>
        <p class="si-quotations__state-text">
          A consulta expirou. Isso costuma ser instabilidade momentânea do serviço de cotação.
        </p>
        <SiButton
          :prepend-icon="'refresh'"
          @click="refresh"
        >
          Tentar novamente
        </SiButton>
      </div>

      <!-- Estado: vazio — primeiro uso (base vazia), com CTA. -->
      <div
        v-else-if="isEmptyFirstUse"
        class="si-quotations__state"
      >
        <div class="si-quotations__state-icon">
          <SiIcon icon="fileText" />
        </div>
        <h2 class="si-quotations__state-title">
          Você ainda não tem cotações
        </h2>
        <p class="si-quotations__state-text">
          Comece uma oferta para cotar com as seguradoras habilitadas. As cotações geradas aparecem
          aqui para você acompanhar até a emissão.
        </p>
        <SiButton
          to="/ofertas/nova"
          :prepend-icon="'plus'"
        >
          Nova oferta
        </SiButton>
      </div>

      <!-- Estado: vazio — filtro sem resultado. -->
      <div
        v-else-if="!loading && items.length === 0"
        class="si-quotations__state"
      >
        <div class="si-quotations__state-icon">
          <SiIcon icon="search" />
        </div>
        <h2 class="si-quotations__state-title">
          Nenhuma cotação encontrada
        </h2>
        <p class="si-quotations__state-text">
          {{ search ? `Nada corresponde a "${search}". Revise o termo ou remova os filtros aplicados.` : 'Nenhuma cotação atende aos filtros aplicados. Remova algum deles para ampliar o resultado.' }}
        </p>
        <SiButton
          variant="outlined"
          color="secondary"
          @click="clearFilters"
        >
          Limpar filtros
        </SiButton>
      </div>

      <!-- Dados (+ carregando inline). -->
      <template v-else>
        <!-- Desktop: tabela (escondida no mobile por CSS). -->
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

          <!-- Tomador (forte) + Segurado (cinza) empilhados, alinhados com IS/Prêmio. -->
          <template #[`item.policyHolderName`]="{ item }">
            <div class="si-quotations__stack">
              <span
                class="si-cell-strong si-quotations__truncate"
                :title="item.policyHolderName"
              >{{ item.policyHolderName }}</span>
              <span
                class="si-quotations__muted si-quotations__truncate"
                :title="item.insuredName"
              >{{ item.insuredName }}</span>
            </div>
          </template>

          <!-- Seguradora + Modalidade (cinza) empilhados. -->
          <template #[`item.insurerName`]="{ item }">
            <div class="si-quotations__stack">
              <span
                class="si-quotations__truncate"
                :title="item.insurerName"
              >{{ item.insurerName }}</span>
              <span
                class="si-quotations__muted si-quotations__truncate"
                :title="item.modalityName"
              >{{ item.modalityName }}</span>
            </div>
          </template>

          <template #[`item.values`]="{ item }">
            <div class="si-quotations__values">
              <span class="si-quotations__values-is">
                <span class="si-quotations__values-label">IS</span>{{ money(item.insuredAmount) }}
              </span>
              <span class="si-quotations__values-sub">Prêmio {{ money(item.premium) }}</span>
            </div>
          </template>

          <template #[`item.result`]="{ item }">
            <div class="si-quotations__status">
              <SiChip
                :color="getQuotationSituationView(item.result).color"
                size="small"
              >
                {{ getQuotationSituationView(item.result).label }}
              </SiChip>
              <!-- CCG é flag ORTOGONAL (RN-058/059), não status: badge outline distinto da pill preenchida. -->
              <SiChip
                v-if="item.requiresCcg"
                variant="outlined"
                color="warning"
                size="x-small"
                class="si-quotations__ccg"
                title="Exige contragarantia (CCG)"
              >
                CCG
              </SiChip>
            </div>
          </template>

          <template #[`item.coverage`]="{ item }">
            <div class="si-quotations__coverage">
              <span>{{ shortDate(item.coverageStartDate) }}</span>
              <span class="si-quotations__muted">até {{ shortDate(item.coverageEndDate) }}</span>
            </div>
          </template>

          <!-- Ações (RN-077): botão primário por situação + kebab. Só visual nesta fatia; detalhes,
               emissão e cancelamento entram na Fatia 2 (sem efeito por ora). -->
          <template #[`item.actions`]="{ item }">
            <div
              class="si-quotations__row-actions"
              @click.stop
            >
              <SiButton
                v-if="primaryAction(item.result)"
                :variant="primaryAction(item.result)!.variant"
                :color="primaryAction(item.result)!.color"
                size="small"
                class="si-quotations__row-btn"
              >
                {{ primaryAction(item.result)!.label }}
              </SiButton>
              <SiMenu location="bottom end">
                <template #activator="{ props }">
                  <SiIconButton
                    v-bind="props"
                    icon="dotsHorizontal"
                    aria-label="Mais ações"
                  />
                </template>
                <SiList
                  density="compact"
                  class="si-rowmenu"
                >
                  <SiListItem
                    title="Ver detalhes"
                    prepend-icon="eye"
                  />
                  <SiListItem
                    title="Cancelar cotação"
                    prepend-icon="circleX"
                    class="si-rowmenu__danger"
                  />
                </SiList>
              </SiMenu>
            </div>
          </template>
        </SiDataTable>

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
              <div class="si-quotations__status-inline">
                <SiChip
                  :color="getQuotationSituationView(item.result).color"
                  size="small"
                >
                  {{ getQuotationSituationView(item.result).label }}
                </SiChip>
                <SiChip
                  v-if="item.requiresCcg"
                  variant="outlined"
                  color="warning"
                  size="x-small"
                  class="si-quotations__ccg"
                  title="Exige contragarantia (CCG)"
                >
                  CCG
                </SiChip>
              </div>
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

        <div class="si-quotations__footer">
          <span class="si-quotations__range">{{ rangeLabel }}</span>
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

    <!-- ClientOnly: o drawer temporário não é renderizado no SSR, evitando o "flash" meio-aberto
         antes da hidratação (só monta no cliente, já fechado). -->
    <ClientOnly>
      <QuotationsFiltersDrawer
        v-model="drawerOpen"
        :filters="filters"
        :result-count="totalCount"
        :insurers="insurers"
        :modalities="modalities"
        @apply="applyFilters"
        @clear="clearDrawerFilters"
      />
    </ClientOnly>
  </VContainer>
</template>

<style scoped>
.si-quotations {
  max-width: var(--si-container-wide);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
}

.si-quotations__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-top: var(--si-space-6);
}

.si-quotations__title {
  min-width: 0;
}

/* Título igual às demais listagens (Corretoras): 28px, semibold, tracking apertado. */
.si-quotations__h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: var(--si-font-weight-semibold);
}

.si-quotations__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-quotations__tabs {
  padding: 0 var(--si-space-5);
}

.si-quotations__search-row {
  display: flex;
  align-items: flex-start;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  flex-wrap: wrap;
}

/* Wrapper é o item flex: estica a busca e empurra "Filtros avançados" para a direita
 * (o flex:1 fica aqui, não no VTextField — o SiFieldShell é o filho flex). */
.si-quotations__search {
  flex: 1 1 auto;
  min-width: 280px;
}

/* Busca com fundo cinza (theme background = #f8fafc, o `--si-fundo` do protótipo) sobre o card branco —
   é assim no protótipo; NÃO branco. */
.si-quotations__search :deep(.v-field) {
  min-height: 48px;
  background: rgb(var(--v-theme-background));
}

.si-quotations__filters-btn.v-btn {
  --v-btn-height: 48px;
}

.si-quotations__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  padding: 0 var(--si-space-5) var(--si-space-4);
}

.si-quotations__table-card {
  overflow: hidden;
}

/* Densidade do protótipo (01-cotacoes.md): 9 colunas cabem em ~1090px com largura fixa; o padding
   padrão do Vuetify (16px) não cabe, então 10px. Especificidade via :deep para vencer o skin base. */
.si-quotations__table :deep(table) {
  table-layout: fixed;
}

.si-quotations__table :deep(th),
.si-quotations__table :deep(td) {
  padding-inline: 10px !important;
  overflow: hidden;
}

/* Conteúdo alinhado ao TOPO: a 1ª linha de cada célula (Tomador, Seguradora, IS, número, status,
   início da vigência) fica na mesma linha; a 2ª (Segurado, Modalidade, Prêmio, fim) logo abaixo. */
.si-quotations__table :deep(td) {
  vertical-align: top;
  padding-block: var(--si-space-3) !important;
}

/* Par empilhado: primário (forte) em cima, secundário (cinza) embaixo — espelha o Valores. */
.si-quotations__stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* Nomes longos (Tomador/Segurado/Seguradora/Modalidade) truncam em 1 linha com reticências;
   o texto completo aparece no tooltip nativo (atributo title da célula). */
.si-quotations__truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.si-quotations__mono {
  font-family: var(--si-font-mono);
  font-size: var(--si-fs-caption);
  white-space: nowrap;
}

.si-quotations__muted {
  color: var(--si-cinza);
}

.si-quotations__values {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.si-quotations__values-is {
  display: inline-flex;
  align-items: baseline;
  gap: var(--si-space-1);
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-quotations__values-label {
  font-size: 11px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-quotations__values-sub {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-quotations__coverage {
  display: flex;
  flex-direction: column;
  font-variant-numeric: tabular-nums;
}

/* Status = pill (resultado) em cima; badge CCG (flag ortogonal) embaixo, tratamento distinto. */
.si-quotations__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--si-space-1);
}

.si-quotations__status-inline {
  display: inline-flex;
  align-items: center;
  gap: var(--si-space-1);
}

/* Badge CCG compacto: outline âmbar, sem preenchimento — lê como marcador, não como estado. */
.si-quotations__ccg.v-chip {
  height: 18px;
  font-size: 10.5px;
  font-weight: var(--si-font-weight-semibold);
  letter-spacing: 0.02em;
  padding-inline: var(--si-space-2);
}

.si-quotations__row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--si-space-1);
}

/* Botão de ação da linha compacto (DS compactBtn): fonte menor e caixa justa, como Corretoras.
   `min-width` uniforme para "Emitir" e "Continuar" terem a MESMA largura e alinharem na coluna. */
.si-quotations__row-btn.v-btn {
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  letter-spacing: 0;
  text-transform: none;
  padding-inline: 12px;
  min-width: 88px;
}

/* Kebab menor (34px), proporcional ao botão compacto — evita o ícone dominar a coluna. */
.si-quotations__row-actions :deep(.si-icon-button.v-btn) {
  --v-btn-height: 34px;
  width: 34px;
  min-width: 34px;
  height: 34px;
}

.si-rowmenu__danger :deep(.v-list-item-title),
.si-rowmenu__danger :deep(.v-list-item__prepend .v-icon) {
  color: var(--si-danger-strong);
}

/* Toggle desktop/mobile no breakpoint 1024px (AppShell). */
.si-quotations__cards {
  display: none;
}

@media (max-width: 1023.98px) {
  .si-quotations__table {
    display: none;
  }

  .si-quotations__cards {
    display: flex;
    flex-direction: column;
    gap: var(--si-space-3);
    padding: var(--si-space-4);
  }

  .si-quotations__header,
  .si-quotations__actions,
  .si-quotations__search-row {
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

.si-quotations__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-3) var(--si-space-5);
  background: rgb(var(--v-theme-background));
  flex-wrap: wrap;
}

.si-quotations__range {
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-quotations__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-3);
  padding: 64px 24px;
}

.si-quotations__state-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--si-radius-pill);
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

.si-quotations__state-icon--danger {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.si-quotations__state-title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-quotations__state-text {
  margin: 0;
  max-width: 420px;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}
</style>
