<script setup lang="ts">
import type { CreditLimitCell } from '~/lib/creditInquiry'
import { formatCurrencyBRL } from '~/lib/currency'

withDefaults(defineProps<{
  cell: CreditLimitCell | null
  /** No judicial, compõe a taxa fiscal (grupo GARANTIA_JUDICIAL_FISCAL). */
  judicial?: boolean
}>(), {
  judicial: false,
})

function formatRate(rate: number): string {
  return `${rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
</script>

<template>
  <div v-if="cell && cell.available > 0" class="si-ci-limit">
    <span class="si-ci-limit__value">{{ formatCurrencyBRL(cell.available) }}</span>
    <span class="si-ci-limit__rate">
      {{ formatRate(cell.rate) }}<template v-if="judicial && cell.fiscalRate != null"> · fiscal {{ formatRate(cell.fiscalRate) }}</template>
    </span>
  </div>
  <span v-else class="si-ci-limit__empty">—</span>
</template>

<style scoped>
.si-ci-limit {
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: flex-end;
}

.si-ci-limit__value {
  font-size: 13.5px;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-ci-limit__rate {
  font-size: 11.5px;
  color: var(--si-cinza);
}

.si-ci-limit__empty {
  color: var(--si-border-strong);
}
</style>
