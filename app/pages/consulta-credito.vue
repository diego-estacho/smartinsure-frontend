<script setup lang="ts">
import type { BrokerageListItem } from '~/composables/useBrokerages'
import type { ExecuteCreditInquiryResponse, CreditInquiryResultResponse } from '~/composables/useCreditInquiries'
import { formatCnpj } from '~/lib/documents'
import { cnpj, required } from '~/lib/rules'
import { getBrokerageStatusView } from '~/lib/status/brokerages'
import { getCreditInquiryInsurerStatusView } from '~/lib/status/creditInquiries'
import { toBrDate, toBrDateTime } from '~/lib/dates'
import { formatCurrencyBRL } from '~/lib/currency'
import { mdiCreditCardOutline, mdiRefresh } from '~/lib/icons'

definePageMeta({ layout: 'shell' })

const { listBrokerages } = useBrokerages()
const { executeCreditInquiry } = useCreditInquiries()

// Form state
const brokerageId = ref<string>('')
const policyHolderCnpj = ref<string>('')
const brokerages = ref<BrokerageListItem[]>([])
const brokeragesLoading = ref(false)

// Recent searches (session-only, no persistence)
const recentCnpjs = ref<string[]>([])

// Query state
const loading = ref(false)
const error = ref<string | null>(null)
const response = ref<ExecuteCreditInquiryResponse | null>(null)

// Table headers
const headers = [
  { title: 'Seguradora', key: 'insurerName', width: '25%' },
  { title: 'Status', key: 'status', width: '15%', align: 'center' },
  { title: 'Tradicional', key: 'traditional', width: '15%', align: 'right' },
  { title: 'Judicial', key: 'judicial', width: '15%', align: 'right' },
  { title: 'Financeiro', key: 'financial', width: '15%', align: 'right' },
  { title: 'Validade', key: 'validity', width: '15%', align: 'right' },
] as const

// Load brokerages on mount
onMounted(async () => {
  brokeragesLoading.value = true
  try {
    const response = await listBrokerages({ pageSize: 100, status: 'Active' })
    brokerages.value = response.items
  }
  catch {
    error.value = 'Não foi possível carregar as corretoras.'
  }
  finally {
    brokeragesLoading.value = false
  }
})

async function executeInquiry() {
  if (!brokerageId.value || !policyHolderCnpj.value) {
    return
  }

  loading.value = true
  error.value = null
  response.value = null

  try {
    const result = await executeCreditInquiry({
      brokerageId: brokerageId.value,
      policyHolderCnpj: policyHolderCnpj.value,
    })
    response.value = result

    // Add to recent searches (last 3, session-only)
    if (!recentCnpjs.value.includes(policyHolderCnpj.value)) {
      recentCnpjs.value.unshift(policyHolderCnpj.value)
      if (recentCnpjs.value.length > 3) {
        recentCnpjs.value.pop()
      }
    }
  }
  catch (e: unknown) {
    // Try to parse ProblemDetails from response
    const err = e as { data?: { title?: string }, message?: string }
    const problemDetails = err.data?.title || err.message || 'Erro ao consultar limites de crédito.'
    error.value = problemDetails
  }
  finally {
    loading.value = false
  }
}

function requery() {
  response.value = null
  executeInquiry()
}

function fillRecentCnpj(document: string) {
  policyHolderCnpj.value = document
}

// Table row data builder
function buildTableRow(result: CreditInquiryResultResponse) {
  return {
    ...result,
    traditional: result.traditionalLimit && result.traditionalRate !== null && result.traditionalRate !== undefined
      ? `${formatCurrencyBRL(result.traditionalLimit)} - ${Number(result.traditionalRate).toFixed(2)}%`
      : '—',
    judicial: (result.judicialLimit || result.judicialRate !== null || result.judicialFiscalRate !== null)
      ? `${result.judicialLimit ? formatCurrencyBRL(result.judicialLimit) : '—'} - ${result.judicialRate ? `${Number(result.judicialRate).toFixed(2)}%` : '—'}${result.judicialFiscalRate ? ` (fiscal: ${Number(result.judicialFiscalRate).toFixed(2)}%)` : ''}`
      : '—',
    financial: result.financialLimit && result.financialRate !== null && result.financialRate !== undefined
      ? `${formatCurrencyBRL(result.financialLimit)} - ${Number(result.financialRate).toFixed(2)}%`
      : '—',
    validity: result.limitValidUntil ? toBrDate(new Date(result.limitValidUntil)) : '—',
  }
}
</script>

<template>
  <VContainer class="si-credit-inquiries">
    <div class="si-credit-inquiries__header">
      <h1 class="text-h5">
        Consulta de Crédito
      </h1>
    </div>

    <!-- Query Card -->
    <SiCard
      class="si-credit-inquiries__query-card"
      variant="outlined"
    >
      <div class="si-credit-inquiries__form">
        <SiSelect
          v-model="brokerageId"
          label="Corretora"
          :items="brokerages.filter(b => getBrokerageStatusView(b.status).known)"
          item-title="name"
          item-value="id"
          :rules="[required()]"
          :loading="brokeragesLoading"
          class="si-credit-inquiries__field"
        />

        <SiDocField
          v-model="policyHolderCnpj"
          label="CNPJ do Tomador"
          type="cnpj"
          :rules="[required(), cnpj()]"
          class="si-credit-inquiries__field"
        />

        <SiButton
          :prepend-icon="mdiCreditCardOutline"
          :loading="loading"
          :disabled="!brokerageId || !policyHolderCnpj"
          @click="executeInquiry"
        >
          Consultar
        </SiButton>
      </div>
    </SiCard>

    <!-- Recent Searches -->
    <div
      v-if="recentCnpjs.length > 0"
      class="si-credit-inquiries__recent"
    >
      <div class="si-credit-inquiries__recent-label">
        Pesquisados recentemente
      </div>
      <div class="si-credit-inquiries__recent-chips">
        <SiChip
          v-for="document in recentCnpjs"
          :key="document"
          @click="fillRecentCnpj(document)"
        >
          {{ formatCnpj(document) }}
        </SiChip>
      </div>
    </div>

    <!-- Error Alert -->
    <SiAlert
      v-if="error"
      type="error"
      class="si-credit-inquiries__alert"
      :text="error"
    />

    <!-- Summary Cards -->
    <div
      v-if="response"
      class="si-credit-inquiries__summary"
    >
      <SiCard
        variant="outlined"
        class="si-credit-inquiries__summary-card"
      >
        <div class="si-credit-inquiries__summary-content">
          <div class="si-credit-inquiries__summary-item">
            <div class="si-credit-inquiries__summary-label">Seguradoras consultadas</div>
            <div class="si-credit-inquiries__summary-value">
              {{ response.summary.insurersQueried }}
            </div>
          </div>

          <div class="si-credit-inquiries__summary-item">
            <div class="si-credit-inquiries__summary-label">Aprovadas</div>
            <div class="si-credit-inquiries__summary-value">
              {{ response.summary.insurersAvailable }}
            </div>
          </div>

          <div class="si-credit-inquiries__summary-item">
            <div class="si-credit-inquiries__summary-label">Limite consolidado</div>
            <div class="si-credit-inquiries__summary-value">
              {{ formatCurrencyBRL(response.summary.consolidatedLimit) }}
            </div>
          </div>

          <div class="si-credit-inquiries__summary-item">
            <div class="si-credit-inquiries__summary-label">Data/hora da consulta</div>
            <div class="si-credit-inquiries__summary-value">
              {{ toBrDateTime(response.queriedAt) }}
            </div>
          </div>
        </div>
      </SiCard>
    </div>

    <!-- Results Table -->
    <div v-if="response" class="si-credit-inquiries__results">
      <SiCard
        variant="outlined"
        class="si-credit-inquiries__table-card"
      >
        <div class="si-credit-inquiries__table-header">
          <h3 class="text-subtitle-1">Quadro consolidado de limites</h3>
          <SiButton
            :prepend-icon="mdiRefresh"
            variant="tonal"
            size="small"
            :loading="loading"
            @click="requery"
          >
            Reconsultar
          </SiButton>
        </div>

        <SiDataTable
          :headers="headers"
          :items="response.results.map(buildTableRow)"
          density="compact"
          class="si-credit-inquiries__table"
        >
          <template #[`item.status`]="{ item }">
            <div class="si-credit-inquiries__status-cell">
              <SiChip
                :color="getCreditInquiryInsurerStatusView(item.status).color"
                label
                size="small"
                :title="item.failureReason || undefined"
              >
                {{ getCreditInquiryInsurerStatusView(item.status).label }}
              </SiChip>
              <div
                v-if="item.failureReason"
                class="si-credit-inquiries__failure-reason"
              >
                {{ item.failureReason }}
              </div>
            </div>
          </template>

          <template #[`item.traditional`]="{ item }">
            <span
              :class="{ 'si-credit-inquiries__unavailable': item.traditional === '—' }"
            >
              {{ item.traditional }}
            </span>
          </template>

          <template #[`item.judicial`]="{ item }">
            <span
              :class="{ 'si-credit-inquiries__unavailable': item.judicial === '—' }"
            >
              {{ item.judicial }}
            </span>
          </template>

          <template #[`item.financial`]="{ item }">
            <span
              :class="{ 'si-credit-inquiries__unavailable': item.financial === '—' }"
            >
              {{ item.financial }}
            </span>
          </template>

          <template #[`item.validity`]="{ item }">
            <span
              :class="{ 'si-credit-inquiries__unavailable': item.validity === '—' }"
            >
              {{ item.validity }}
            </span>
          </template>
        </SiDataTable>
      </SiCard>
    </div>

    <!-- Empty State -->
    <div
      v-if="!response && !loading && !error"
      class="si-credit-inquiries__empty"
    >
      <p>Preencha os campos acima e clique em "Consultar" para exibir os limites de crédito.</p>
    </div>
  </VContainer>
</template>

<style scoped>
.si-credit-inquiries {
  max-width: var(--si-container-wide);
}

.si-credit-inquiries__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-credit-inquiries__header h1 {
  margin: 0;
}

.si-credit-inquiries__query-card {
  margin-bottom: var(--si-space-4);
}

.si-credit-inquiries__form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: var(--si-space-4);
  align-items: flex-end;
  padding: var(--si-space-4);
}

.si-credit-inquiries__field {
  flex: 1;
}

.si-credit-inquiries__recent {
  margin-block: var(--si-space-4);
  padding: var(--si-space-4);
  background-color: rgba(var(--v-theme-surface), 0.5);
  border-radius: var(--si-radius-md);
}

.si-credit-inquiries__recent-label {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: var(--si-space-2);
}

.si-credit-inquiries__recent-chips {
  display: flex;
  gap: var(--si-space-2);
  flex-wrap: wrap;
}

.si-credit-inquiries__alert {
  margin-block: var(--si-space-4);
}

.si-credit-inquiries__summary {
  margin-block: var(--si-space-4);
}

.si-credit-inquiries__summary-card {
  overflow: hidden;
}

.si-credit-inquiries__summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--si-space-4);
  padding: var(--si-space-4);
}

.si-credit-inquiries__summary-item {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
}

.si-credit-inquiries__summary-label {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-credit-inquiries__summary-value {
  font-size: var(--si-fs-base);
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

.si-credit-inquiries__results {
  margin-block: var(--si-space-4);
}

.si-credit-inquiries__table-card {
  overflow: hidden;
}

.si-credit-inquiries__table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  padding: var(--si-space-4);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.si-credit-inquiries__table-header h3 {
  margin: 0;
}

.si-credit-inquiries__table {
  width: 100%;
}

.si-credit-inquiries__unavailable {
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.si-credit-inquiries__status-cell {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
}

.si-credit-inquiries__failure-reason {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.3;
}

.si-credit-inquiries__empty {
  text-align: center;
  padding: var(--si-space-8);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

@media (max-width: 1024px) {
  .si-credit-inquiries__form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .si-credit-inquiries__summary-content {
    grid-template-columns: 1fr;
  }

  .si-credit-inquiries__table-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
