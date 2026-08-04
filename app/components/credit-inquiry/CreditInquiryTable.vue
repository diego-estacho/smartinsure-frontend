<script setup lang="ts">
import type { CreditInquiryRow } from '~/lib/creditInquiry'
import { formatResponseTime, usedBarColor } from '~/lib/creditInquiry'
import { formatCurrencyBRL } from '~/lib/currency'
import { getCreditInquiryInsurerStatusView } from '~/lib/status/creditInquiries'

const props = withDefaults(defineProps<{
  rows: CreditInquiryRow[]
  /** `page` = 7 colunas (com Utilizado e Validade); `embed` = 5 colunas. */
  mode?: 'page' | 'embed'
}>(), {
  mode: 'page',
})

type Filter = 'todas' | 'aprovadas' | 'indisponiveis'
const filter = ref<Filter>('todas')

const availableCount = computed(() => props.rows.filter(row => row.status === 'Available').length)
const unavailableCount = computed(() => props.rows.length - availableCount.value)

const filteredRows = computed<CreditInquiryRow[]>(() => {
  if (filter.value === 'aprovadas') {
    return props.rows.filter(row => row.status === 'Available')
  }
  if (filter.value === 'indisponiveis') {
    return props.rows.filter(row => row.status !== 'Available')
  }
  return props.rows
})

// Larguras fixas do design (o SiDataTable recorta o excedente; table-layout: fixed é obrigatório).
interface TableHeader {
  title: string
  key: string
  sortable: boolean
  align?: 'start' | 'end' | 'center'
  width: number
}

const headers = computed<TableHeader[]>(() => {
  const base: TableHeader[] = [
    { title: 'Seguradora', key: 'insurer', sortable: false, width: props.mode === 'embed' ? 190 : 196 },
    { title: 'Status', key: 'status', sortable: false, width: props.mode === 'embed' ? 150 : 164 },
    { title: 'Tradicional', key: 'traditional', sortable: false, align: 'end', width: props.mode === 'embed' ? 124 : 128 },
    { title: 'Judicial', key: 'judicial', sortable: false, align: 'end', width: props.mode === 'embed' ? 136 : 142 },
    { title: 'Financeira', key: 'financial', sortable: false, align: 'end', width: props.mode === 'embed' ? 120 : 124 },
  ]
  if (props.mode === 'page') {
    base.push({ title: 'Utilizado', key: 'used', sortable: false, align: 'end', width: 140 })
    base.push({ title: 'Validade', key: 'validity', sortable: false, align: 'start', width: 108 })
  }
  return base
})

const footerNote = computed(() =>
  props.mode === 'embed'
    ? `Exibindo ${filteredRows.value.length} de ${props.rows.length} seguradoras vinculadas · utilizado e validade na consulta de crédito completa`
    : `Exibindo ${filteredRows.value.length} de ${props.rows.length} seguradoras vinculadas`,
)

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}
</script>

<template>
  <SiCard variant="outlined" class="si-ci-table">
    <div class="si-ci-table__head">
      <div class="si-ci-table__head-text">
        <h3 class="si-ci-table__title">
          Quadro consolidado de limites
        </h3>
        <span class="si-ci-table__subtitle">Ordenado por maior limite disponível</span>
      </div>

      <SiTabs v-model="filter" class="si-ci-table__tabs" density="compact">
        <SiTab value="todas" text="Todas" :count="rows.length" />
        <SiTab value="aprovadas" text="Com limite" :count="availableCount" />
        <SiTab value="indisponiveis" text="Sem limite" :count="unavailableCount" />
      </SiTabs>
    </div>

    <!-- Filtro mobile (chips) — substitui as Tabs em telas pequenas. -->
    <div class="si-ci-table__chips">
      <button
        type="button"
        class="si-ci-filter"
        :class="{ 'si-ci-filter--active': filter === 'todas' }"
        @click="filter = 'todas'"
      >
        Todas ({{ rows.length }})
      </button>
      <button
        type="button"
        class="si-ci-filter"
        :class="{ 'si-ci-filter--active': filter === 'aprovadas' }"
        @click="filter = 'aprovadas'"
      >
        Com limite ({{ availableCount }})
      </button>
      <button
        type="button"
        class="si-ci-filter"
        :class="{ 'si-ci-filter--active': filter === 'indisponiveis' }"
        @click="filter = 'indisponiveis'"
      >
        Sem limite ({{ unavailableCount }})
      </button>
    </div>

    <!-- Desktop: tabela com table-layout: fixed. -->
    <div class="si-ci-table__desktop">
      <SiDataTable
        :headers="headers"
        :items="filteredRows"
        item-value="insurerId"
        density="compact"
        hide-default-footer
        class="si-ci-table__grid"
      >
        <template #[`item.insurer`]="{ item }">
          <div class="si-ci-insurer">
            <SiAvatar :size="34" color="charcoal" rounded="10">
              <span class="si-ci-insurer__initials">{{ initials(item.insurerName) }}</span>
            </SiAvatar>
            <div class="si-ci-insurer__text">
              <span class="si-ci-insurer__name" :title="item.insurerName">{{ item.insurerName }}</span>
              <span class="si-ci-insurer__time">
                {{ formatResponseTime(item.responseTimeMs) ?? 'sem resposta' }}
              </span>
            </div>
          </div>
        </template>

        <template #[`item.status`]="{ item }">
          <div class="si-ci-status">
            <SiChip
              :color="getCreditInquiryInsurerStatusView(item.status).color"
              size="small"
              variant="tonal"
            >
              {{ getCreditInquiryInsurerStatusView(item.status).label }}
            </SiChip>
            <span
              v-if="item.failureReason"
              class="si-ci-status__reason"
              :title="item.failureReason"
            >{{ item.failureReason }}</span>
          </div>
        </template>

        <template #[`item.traditional`]="{ item }">
          <CreditInquiryLimitCellContent :cell="item.traditional" />
        </template>

        <template #[`item.judicial`]="{ item }">
          <CreditInquiryLimitCellContent :cell="item.judicial" judicial />
        </template>

        <template #[`item.financial`]="{ item }">
          <CreditInquiryLimitCellContent :cell="item.financial" />
        </template>

        <template v-if="mode === 'page'" #[`item.used`]="{ item }">
          <div v-if="item.used && item.used.value > 0" class="si-ci-used">
            <span class="si-ci-used__value">{{ formatCurrencyBRL(item.used.value) }}</span>
            <span class="si-ci-used__pct">{{ item.used.percent }}%</span>
            <SiProgressLinear
              :model-value="item.used.percent"
              :color="usedBarColor(item.used.percent)"
              height="4"
              rounded
            />
          </div>
          <span v-else class="si-ci-empty">—</span>
        </template>

        <template v-if="mode === 'page'" #[`item.validity`]>
          <!-- OPEN-08: validade sem fonte no motor — apresentada como ausente, nunca inventada. -->
          <span class="si-ci-empty">—</span>
        </template>
      </SiDataTable>
    </div>

    <!-- Mobile: lista de cards (uma por seguradora). -->
    <ul class="si-ci-table__mobile">
      <li v-for="item in filteredRows" :key="`m-${item.insurerId}`" class="si-ci-card">
        <div class="si-ci-card__head">
          <SiAvatar :size="32" color="charcoal" rounded="10">
            <span class="si-ci-insurer__initials">{{ initials(item.insurerName) }}</span>
          </SiAvatar>
          <span class="si-ci-card__name">{{ item.insurerName }}</span>
          <SiChip
            :color="getCreditInquiryInsurerStatusView(item.status).color"
            size="small"
            variant="tonal"
          >
            {{ getCreditInquiryInsurerStatusView(item.status).label }}
          </SiChip>
        </div>

        <template v-if="item.status === 'Available'">
          <div class="si-ci-card__grid">
            <CreditInquiryMobileMetric label="Tradicional" :cell="item.traditional" />
            <CreditInquiryMobileMetric label="Judicial" :cell="item.judicial" judicial />
            <CreditInquiryMobileMetric label="Financeira" :cell="item.financial" />
            <div v-if="mode === 'page'" class="si-ci-card__metric">
              <span class="si-ci-card__metric-label">Validade</span>
              <span class="si-ci-card__metric-value si-ci-empty">—</span>
            </div>
          </div>

          <div v-if="mode === 'page' && item.used && item.used.value > 0" class="si-ci-card__used">
            <span class="si-ci-card__metric-label">Utilizado</span>
            <div class="si-ci-used">
              <span class="si-ci-used__value">{{ formatCurrencyBRL(item.used.value) }} · {{ item.used.percent }}%</span>
              <SiProgressLinear
                :model-value="item.used.percent"
                :color="usedBarColor(item.used.percent)"
                height="4"
                rounded
              />
            </div>
          </div>
        </template>

        <p v-else-if="item.failureReason" class="si-ci-card__reason">
          {{ item.failureReason }}
        </p>
      </li>
    </ul>

    <div class="si-ci-table__foot">
      <span>{{ footerNote }}</span>
      <span class="si-ci-table__foot-note">
        Os limites refletem a última resposta de cada seguradora e podem mudar sem aviso.
      </span>
    </div>
  </SiCard>
</template>

<style scoped>
.si-ci-table {
  overflow: hidden;
}

.si-ci-table__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  flex-wrap: wrap;
  padding: var(--si-space-4) var(--si-space-5);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-ci-table__title {
  margin: 0;
  font-size: 15px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-table__subtitle {
  font-size: 12.5px;
  color: var(--si-cinza);
}

/* Densidade do design: colunas cabem só com largura fixa; o padding padrão do Vuetify não cabe. */
.si-ci-table__grid :deep(table) {
  table-layout: fixed;
}

.si-ci-table__grid :deep(th),
.si-ci-table__grid :deep(td) {
  padding-inline: 10px !important;
  overflow: hidden;
}

.si-ci-insurer {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  min-width: 0;
}

.si-ci-insurer__initials {
  font-size: 12px;
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-primary));
}

.si-ci-insurer__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.si-ci-insurer__name {
  font-size: 13.5px;
  font-weight: var(--si-font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si-ci-insurer__time {
  font-size: 11.5px;
  color: var(--si-cinza);
}

.si-ci-status {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  min-width: 0;
}

.si-ci-status__reason {
  font-size: 11.5px;
  color: var(--si-cinza);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.si-ci-used {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.si-ci-used__value {
  font-size: 13.5px;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-ci-used__pct {
  font-size: 11.5px;
  color: var(--si-cinza);
}

.si-ci-empty {
  color: var(--si-border-strong);
}

.si-ci-table__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  flex-wrap: wrap;
  padding: var(--si-space-4) var(--si-space-5);
  background: rgb(var(--v-theme-background));
  font-size: 12.5px;
  color: var(--si-cinza);
}

.si-ci-table__foot-note {
  color: var(--si-cinza);
}

/* Filtro mobile (chips) — escondido no desktop. */
.si-ci-table__chips {
  display: none;
  gap: var(--si-space-2);
  flex-wrap: wrap;
  padding: var(--si-space-3) var(--si-space-4);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-ci-filter {
  min-height: 36px;
  padding-inline: var(--si-space-4);
  border-radius: var(--si-radius-pill);
  border: 1px solid var(--si-cinza-claro);
  background: rgb(var(--v-theme-surface));
  font-size: 12.5px;
  font-weight: var(--si-font-weight-medium);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
}

.si-ci-filter--active {
  border-color: rgb(var(--v-theme-primary));
  background: var(--si-verde-100);
  color: var(--si-verde-800);
}

.si-ci-table__mobile {
  display: none;
  list-style: none;
  margin: 0;
  padding: var(--si-space-4);
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-ci-card {
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  padding: var(--si-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-ci-card__head {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-ci-card__name {
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-card__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-3);
}

.si-ci-card__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-ci-card__metric-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--si-cinza);
}

.si-ci-card__metric-value {
  font-size: 14px;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-ci-card__used {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
}

.si-ci-card__used .si-ci-used {
  align-items: stretch;
}

.si-ci-card__reason {
  margin: 0;
  font-size: 12.5px;
  color: var(--si-cinza);
}

@media (max-width: 1024px) {
  .si-ci-table__desktop {
    display: none;
  }

  .si-ci-table__tabs {
    display: none;
  }

  .si-ci-table__chips {
    display: flex;
  }

  .si-ci-table__mobile {
    display: flex;
  }
}
</style>
