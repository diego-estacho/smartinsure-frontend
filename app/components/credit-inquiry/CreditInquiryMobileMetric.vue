<script setup lang="ts">
import type { CreditLimitCell } from '~/lib/creditInquiry'
import { formatCurrencyBRL } from '~/lib/currency'

withDefaults(defineProps<{
  label: string
  cell: CreditLimitCell | null
  judicial?: boolean
}>(), {
  judicial: false,
})

function formatRate(rate: number): string {
  return `${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
</script>

<template>
  <div class="si-ci-card__metric">
    <span class="si-ci-card__metric-label">{{ label }}</span>
    <template v-if="cell && cell.available > 0">
      <span class="si-ci-card__metric-value">{{ formatCurrencyBRL(cell.available) }}</span>
      <span class="si-ci-card__metric-rate">
        {{ formatRate(cell.rate) }}<template v-if="judicial && cell.fiscalRate != null"> · fiscal {{ formatRate(cell.fiscalRate) }}</template>
      </span>
    </template>
    <span v-else class="si-ci-card__metric-value si-ci-empty">—</span>
  </div>
</template>

<style scoped>
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

.si-ci-card__metric-rate {
  font-size: 11.5px;
  color: var(--si-cinza);
}

.si-ci-empty {
  color: var(--si-border-strong);
}
</style>
