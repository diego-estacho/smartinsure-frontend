<script setup lang="ts">
/**
 * Filtros de período do painel (ADR-018) — chips pill: ativo em superfície carvão,
 * inativos com hairline. Só tokens (ADR-006). O botão "Filtros" é ilustrativo (mock).
 */

const period = defineModel<string>({ default: 'month' })

const periods = [
  { key: 'month', label: 'Mês atual' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year', label: 'Ano' },
]
</script>

<template>
  <div class="si-dash-filters">
    <button
      v-for="option in periods"
      :key="option.key"
      type="button"
      class="si-dash-filter"
      :class="{ 'si-dash-filter--active': period === option.key }"
      @click="period = option.key"
    >
      {{ option.label }}
    </button>

    <button
      type="button"
      class="si-dash-filter si-dash-filter--icon"
    >
      <SiIcon
        :icon="'filter'"
        size="x-small"
      />
      Filtros
    </button>
  </div>
</template>

<style scoped>
.si-dash-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
}

.si-dash-filter {
  display: inline-flex;
  align-items: center;
  gap: var(--si-space-1);
  padding: var(--si-space-2) var(--si-space-3);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-pill);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-medium);
  cursor: pointer;
  transition: background-color var(--si-dur-fast) var(--si-ease-out),
    border-color var(--si-dur-fast) var(--si-ease-out);
}

.si-dash-filter:hover {
  border-color: var(--si-cinza);
}

.si-dash-filter--active {
  background: rgb(var(--v-theme-charcoal));
  border-color: rgb(var(--v-theme-charcoal));
  color: rgb(var(--v-theme-on-charcoal));
}
</style>
