<script setup lang="ts">
/**
 * Grade de KPIs do painel (ADR-018) — reproduz os cards de métrica do design system:
 * hairline no claro, um card de destaque em superfície carvão. Só tokens (ADR-006).
 */
import type { KpiCard } from '~/composables/useDashboardMock'
import { mdiTrendingUp, mdiTrendingDown } from '~/lib/icons'

defineProps<{ items: KpiCard[] }>()
</script>

<template>
  <section class="si-dash-kpis">
    <SiCard
      v-for="kpi in items"
      :key="kpi.label"
      class="si-dash-kpi"
      :class="{ 'si-dash-kpi--dark': kpi.highlight }"
      :variant="kpi.highlight ? 'flat' : 'outlined'"
      :color="kpi.highlight ? 'charcoal' : undefined"
    >
      <span class="si-dash-kpi__label">{{ kpi.label }}</span>
      <span class="si-dash-kpi__value">{{ kpi.value }}</span>
      <span
        class="si-dash-kpi__delta"
        :class="[
          kpi.trend === 'up' ? 'si-dash-kpi__delta--up' : '',
          kpi.trend === 'down' ? 'si-dash-kpi__delta--down' : '',
        ]"
      >
        <SiIcon
          v-if="kpi.trend"
          :icon="kpi.trend === 'up' ? mdiTrendingUp : mdiTrendingDown"
          size="x-small"
        />
        {{ kpi.hint }}
      </span>
    </SiCard>
  </section>
</template>

<style scoped>
.si-dash-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--si-space-4);
}

.si-dash-kpi {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  padding: var(--si-space-4) var(--si-space-5);
}

.si-dash-kpi__label {
  font-size: var(--si-fs-eyebrow);
  line-height: var(--si-lh-eyebrow);
  letter-spacing: var(--si-ls-eyebrow);
  text-transform: uppercase;
  font-weight: var(--si-font-weight-semibold);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-dash-kpi__value {
  font-size: var(--si-fs-h2);
  line-height: var(--si-lh-h2);
  letter-spacing: var(--si-ls-h2);
  font-weight: var(--si-font-weight-semibold);
}

.si-dash-kpi__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--si-space-1);
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-dash-kpi__delta--up {
  color: rgb(var(--v-theme-success));
}

.si-dash-kpi__delta--down {
  color: rgb(var(--v-theme-error));
}

/* Card de destaque — superfície carvão de marca; valor em verde (acento), conforme o DS. */
.si-dash-kpi--dark .si-dash-kpi__label {
  color: rgba(var(--v-theme-on-charcoal), 0.6);
}

.si-dash-kpi--dark .si-dash-kpi__value {
  color: rgb(var(--v-theme-primary));
}

.si-dash-kpi--dark .si-dash-kpi__delta {
  color: rgba(var(--v-theme-on-charcoal), 0.75);
}

@media (max-width: 1100px) {
  .si-dash-kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .si-dash-kpis {
    grid-template-columns: 1fr;
  }
}
</style>
