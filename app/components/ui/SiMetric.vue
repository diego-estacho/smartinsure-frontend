<script setup lang="ts">
/**
 * SiMetric — metric card do DS (eyebrow + valor tabular + hint). Reusado na Visão geral e na
 * Produção da Corretora e em qualquer painel de indicadores. `empty` mostra estado sem dado
 * honesto (traço) quando a fonte ainda não existe. Escopado sob `.si-metric*` (ADR-015).
 */
withDefaults(defineProps<{
  label: string
  value?: string | number
  hint?: string
  empty?: boolean
}>(), { value: '', hint: '', empty: false })
</script>

<template>
  <div class="si-metric">
    <span class="si-metric__label">{{ label }}</span>
    <span
      class="si-metric__value"
      :class="{ 'si-metric__value--empty': empty }"
    >{{ empty ? '—' : value }}</span>
    <span
      v-if="hint"
      class="si-metric__hint"
    >{{ hint }}</span>
  </div>
</template>

<style scoped>
.si-metric {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  padding: var(--si-space-4);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  background: rgb(var(--v-theme-surface));
}

.si-metric__label {
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--si-cinza);
}

.si-metric__value {
  font-size: 26px;
  line-height: 1.1;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}

.si-metric__value--empty {
  color: var(--si-cinza-claro);
}

.si-metric__hint {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
}
</style>
