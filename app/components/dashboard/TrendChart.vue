<script setup lang="ts">
/**
 * Painel de tendência do dashboard (ADR-018) — área + linha das apólices emitidas.
 * SVG estilizado 100% por design token (stroke/fill via `var(--…)`), sem cor hex
 * (ADR-006/019). Séries em coordenadas y do viewBox 600×200; x = índice × 50.
 */
const props = defineProps<{
  title: string
  updatedAt: string
  current: number[]
  previous: number[]
}>()

const STEP = 50
const BASE = 200

function toPoints(series: number[]): string {
  return series.map((y, i) => `${i * STEP},${y}`).join(' ')
}

const currentPoints = computed(() => toPoints(props.current))
const previousPoints = computed(() => toPoints(props.previous))

const areaPath = computed(() => {
  const top = props.current.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * STEP},${y}`).join(' ')
  const lastX = (props.current.length - 1) * STEP
  return `${top} L${lastX},${BASE} L0,${BASE} Z`
})

const dotX = computed(() => (props.current.length - 1) * STEP)
const dotY = computed(() => props.current[props.current.length - 1] ?? 0)
</script>

<template>
  <SiCard
    variant="outlined"
    class="si-dash-panel"
  >
    <header class="si-dash-panel__head">
      <h3 class="si-dash-panel__title">
        {{ title }}
      </h3>
      <span class="si-dash-panel__meta">{{ updatedAt }}</span>
    </header>

    <div class="si-dash-panel__body">
      <div class="si-dash-chart">
        <svg
          viewBox="0 0 600 200"
          preserveAspectRatio="none"
          role="img"
          :aria-label="title"
        >
          <defs>
            <linearGradient
              id="si-dash-area"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                class="si-dash-chart__area-top"
                offset="0%"
              />
              <stop
                class="si-dash-chart__area-bottom"
                offset="100%"
              />
            </linearGradient>
          </defs>

          <g class="si-dash-chart__grid">
            <line x1="0" y1="40" x2="600" y2="40" />
            <line x1="0" y1="90" x2="600" y2="90" />
            <line x1="0" y1="140" x2="600" y2="140" />
            <line x1="0" y1="180" x2="600" y2="180" />
          </g>

          <polyline
            class="si-dash-chart__line-prev"
            fill="none"
            :points="previousPoints"
          />
          <path
            class="si-dash-chart__area"
            :d="areaPath"
          />
          <polyline
            class="si-dash-chart__line"
            fill="none"
            :points="currentPoints"
          />
          <circle
            class="si-dash-chart__dot"
            :cx="dotX"
            :cy="dotY"
            r="4"
          />
        </svg>
      </div>

      <div class="si-dash-chart__legend">
        <span><i class="si-dash-chart__key si-dash-chart__key--current" /> Mês atual</span>
        <span><i class="si-dash-chart__key si-dash-chart__key--prev" /> Mesmo período · ano anterior</span>
      </div>
    </div>
  </SiCard>
</template>

<style scoped>
.si-dash-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-dash-panel__title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-dash-panel__meta {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-dash-panel__body {
  padding: var(--si-space-4) var(--si-space-5);
}

.si-dash-chart {
  height: 200px;
}

.si-dash-chart svg {
  width: 100%;
  height: 100%;
}

.si-dash-chart__grid line {
  stroke: var(--si-cinza-claro);
  stroke-width: 1;
}

.si-dash-chart__line-prev {
  stroke: rgba(var(--v-theme-on-surface), 0.22);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.si-dash-chart__line {
  stroke: rgb(var(--v-theme-primary));
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.si-dash-chart__area {
  fill: url('#si-dash-area');
  stroke: none;
}

.si-dash-chart__area-top {
  stop-color: rgb(var(--v-theme-primary));
  stop-opacity: 0.28;
}

.si-dash-chart__area-bottom {
  stop-color: rgb(var(--v-theme-primary));
  stop-opacity: 0;
}

.si-dash-chart__dot {
  fill: rgb(var(--v-theme-primary));
  stroke: rgb(var(--v-theme-surface));
  stroke-width: 2;
}

.si-dash-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-4);
  margin-top: var(--si-space-3);
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-dash-chart__legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-dash-chart__key {
  width: var(--si-space-2);
  height: var(--si-space-2);
  border-radius: var(--si-radius-pill);
  display: inline-block;
}

.si-dash-chart__key--current {
  background: rgb(var(--v-theme-primary));
}

.si-dash-chart__key--prev {
  background: rgba(var(--v-theme-on-surface), 0.28);
}
</style>
