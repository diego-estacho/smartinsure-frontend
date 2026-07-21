<script setup lang="ts">
import type { BrokerageListItem } from '~/composables/useBrokerages'
import type { ExecuteCreditInquiryResponse, CreditInquiryResultResponse } from '~/composables/useCreditInquiries'
import { formatCnpj } from '~/lib/documents'
import { cnpj, required } from '~/lib/rules'
import { getBrokerageStatusView } from '~/lib/status/brokerages'
import { getCreditInquiryInsurerStatusView } from '~/lib/status/creditInquiries'
import { toBrDateTime } from '~/lib/dates'
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

// Dynamic column headers computed from results
const dynamicGroupNames = computed(() => {
  if (!response.value?.results || response.value.results.length === 0) {
    return []
  }

  // Collect all unique group names with their max available limit
  const groupLimits = new Map<string, number>()
  response.value.results.forEach((result) => {
    result.limits.forEach((limit) => {
      const current = groupLimits.get(limit.groupName) || 0
      const newValue = Math.max(current, Number(limit.availableLimit))
      groupLimits.set(limit.groupName, newValue)
    })
  })

  // Sort by max available limit descending
  return Array.from(groupLimits.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
})

// Build table rows with proper typing
const tableRows = computed(() => {
  return (response.value?.results.map(buildTableRow) || []) as TableRow[]
})

// Get available insurers with their row data for the availability bar
const availableInsurersWithData = computed(() => {
  return response.value?.results.filter(r => r.status === 'Available').map(r => buildTableRow(r)) || []
})

// Build table headers based on dynamic groups
const headers = computed(() => {
  const baseHeaders = [
    { title: 'Seguradora', key: 'insurerName', width: '15%' },
    { title: 'Status', key: 'status', width: '12%', align: 'center' },
  ]

  // Add dynamic columns for each group
  const groupWidth = Math.max(12, Math.floor((100 - 15 - 12 - 15) / (dynamicGroupNames.value.length || 1)))
  dynamicGroupNames.value.forEach((groupName) => {
    baseHeaders.push({
      title: groupName,
      key: `group_${groupName}`,
      width: `${groupWidth}%`,
      align: 'right',
    })
  })

  // Validade always at the end
  baseHeaders.push({ title: 'Validade', key: 'validity', width: '15%', align: 'right' })

  return baseHeaders
})

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
interface TableRow extends CreditInquiryResultResponse {
  validity: string
  maxAvailableLimit: number
  maxAvailableLimitGroup: string | null
}

function buildTableRow(result: CreditInquiryResultResponse): TableRow {
  // Find the group with highest available limit for the availability bar
  let maxAvailableLimit = 0
  let maxAvailableLimitGroup: string | null = null

  if (result.limits && result.limits.length > 0) {
    result.limits.forEach((limit) => {
      const available = Number(limit.availableLimit)
      if (available > maxAvailableLimit) {
        maxAvailableLimit = available
        maxAvailableLimitGroup = limit.groupName
      }
    })
  }

  return {
    ...result,
    validity: '—', // OPEN-08: Always empty per spec
    maxAvailableLimit,
    maxAvailableLimitGroup,
  }
}

// Helper to get limit group data for a specific group name and result
function getLimitGroupData(result: CreditInquiryResultResponse, groupName: string) {
  return result.limits?.find(l => l.groupName === groupName)
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
        <div class="si-credit-inquiries__summary-header">
          <h3 class="si-credit-inquiries__summary-title">Consulta para {{ formatCnpj(response.policyHolderCnpj) }}</h3>
          <span v-if="response.policyHolderName" class="si-credit-inquiries__summary-subtitle">{{ response.policyHolderName }}</span>
        </div>
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
          :items="tableRows"
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

          <!-- Dynamic group columns -->
          <template
            v-for="groupName in dynamicGroupNames"
            :key="groupName"
            #[`item.group_${groupName}`]="{ item }"
          >
            <div class="si-credit-inquiries__group-cell">
              <template v-if="getLimitGroupData(item, groupName)">
                <div class="si-credit-inquiries__group-limit">
                  {{ formatCurrencyBRL(getLimitGroupData(item, groupName)!.availableLimit) }}
                  <span class="si-credit-inquiries__group-rate">
                    {{ Number(getLimitGroupData(item, groupName)!.rate).toFixed(2) }}%
                  </span>
                </div>
                <div
                  v-if="Number(getLimitGroupData(item, groupName)!.usedLimit) > 0"
                  class="si-credit-inquiries__group-used"
                >
                  Utilizado: {{ formatCurrencyBRL(getLimitGroupData(item, groupName)!.usedLimit) }}
                </div>
              </template>
              <span v-else class="si-credit-inquiries__unavailable">—</span>
            </div>
          </template>

          <template #[`item.validity`]="{ item }">
            <span class="si-credit-inquiries__unavailable">{{ item.validity }}</span>
          </template>

          <!-- Availability bar row (shown after each insurer) -->
          <template v-if="response && availableInsurersWithData.length > 0" #bottom>
            <div class="si-credit-inquiries__availability-bars">
              <h4 class="si-credit-inquiries__availability-title">Disponível vs Utilizado por Seguradora</h4>
              <div class="si-credit-inquiries__bars-grid">
                <div
                  v-for="result in availableInsurersWithData"
                  :key="`bar-${result.insurerId}`"
                  class="si-credit-inquiries__bar-container"
                >
                  <div class="si-credit-inquiries__bar-label">{{ result.insurerName }}</div>
                  <div class="si-credit-inquiries__bar-values">
                    <span v-if="result.maxAvailableLimit > 0" class="si-credit-inquiries__bar-amount">
                      {{ formatCurrencyBRL(result.maxAvailableLimit) }} Disponível
                    </span>
                    <template v-if="result.maxAvailableLimitGroup && getLimitGroupData(result, result.maxAvailableLimitGroup)">
                      <span class="si-credit-inquiries__bar-used">
                        {{ formatCurrencyBRL(getLimitGroupData(result, result.maxAvailableLimitGroup)!.usedLimit) }} Utilizado
                      </span>
                      <span class="si-credit-inquiries__bar-percentage">
                        ({{ Math.round((Number(getLimitGroupData(result, result.maxAvailableLimitGroup)!.usedLimit) / result.maxAvailableLimit) * 100) }}%)
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
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

.si-credit-inquiries__summary-header {
  padding: var(--si-space-4);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
}

.si-credit-inquiries__summary-title {
  margin: 0;
  font-size: var(--si-fs-base);
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

.si-credit-inquiries__summary-subtitle {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
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

.si-credit-inquiries__group-cell {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  text-align: right;
}

.si-credit-inquiries__group-limit {
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

.si-credit-inquiries__group-rate {
  display: block;
  font-size: var(--si-fs-small);
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-credit-inquiries__group-used {
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

.si-credit-inquiries__availability-bars {
  padding: var(--si-space-4);
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgba(var(--v-theme-surface), 0.3);
}

.si-credit-inquiries__availability-title {
  margin: 0 0 var(--si-space-3) 0;
  font-size: var(--si-fs-small);
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

.si-credit-inquiries__bars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--si-space-3);
}

.si-credit-inquiries__bar-container {
  padding: var(--si-space-3);
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: var(--si-radius-sm);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.si-credit-inquiries__bar-label {
  font-size: var(--si-fs-small);
  font-weight: 600;
  color: var(--v-theme-on-surface);
  margin-bottom: var(--si-space-2);
}

.si-credit-inquiries__bar-values {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-credit-inquiries__bar-amount {
  font-weight: 600;
  color: var(--v-theme-on-surface);
}

.si-credit-inquiries__bar-used {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-credit-inquiries__bar-percentage {
  font-weight: 500;
  color: var(--v-theme-on-surface);
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
