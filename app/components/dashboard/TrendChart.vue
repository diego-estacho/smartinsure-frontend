<script setup lang="ts">
/**
 * Painel de tendência do dashboard (ADR-018) — área + linha das apólices emitidas,
 * pela lib de gráficos unovis (ADR-020). Cores 100% por design token (ADR-006/019):
 * as séries recebem `rgb(var(--v-theme-*))`, sem hex. O gráfico é montado client-side
 * (`<ClientOnly>`, os componentes tocam o DOM); o fallback tem a mesma altura (sem layout shift).
 */
import { VisXYContainer, VisArea, VisLine, VisAxis } from '@unovis/vue'
import { CurveType } from '@unovis/ts'

interface Point {
  index: number
  current: number
  previous: number
}

const props = defineProps<{
  title: string
  updatedAt: string
  current: number[]
  previous: number[]
}>()

const data = computed<Point[]>(() =>
  props.current.map((value, index) => ({
    index,
    current: value,
    previous: props.previous[index] ?? 0,
  })),
)

const x = (d: Point) => d.index
const yCurrent = (d: Point) => d.current
const yPrevious = (d: Point) => d.previous

const CHART_HEIGHT = 200
const margin = { top: 8, right: 8, bottom: 8, left: 8 }
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
        <ClientOnly>
          <VisXYContainer
            :data="data"
            :height="CHART_HEIGHT"
            :margin="margin"
          >
            <VisAxis
              type="y"
              :num-ticks="4"
              :grid-line="true"
              :domain-line="false"
              :tick-line="false"
              :tick-format="() => ''"
            />
            <VisArea
              :x="x"
              :y="yCurrent"
              color="rgb(var(--v-theme-primary))"
              :opacity="0.16"
              :curve-type="CurveType.Linear"
            />
            <VisLine
              :x="x"
              :y="yPrevious"
              color="rgba(var(--v-theme-on-surface), 0.28)"
              :line-width="2"
              :curve-type="CurveType.Linear"
            />
            <VisLine
              :x="x"
              :y="yCurrent"
              color="rgb(var(--v-theme-primary))"
              :line-width="2.5"
              :curve-type="CurveType.Linear"
            />
          </VisXYContainer>

          <template #fallback>
            <div class="si-dash-chart__fallback" />
          </template>
        </ClientOnly>
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

/* Tema do unovis por token (ADR-006/020): CSS custom properties herdam por cascata, então
 * setar as `--vis-*` aqui no pai já alcança o SVG do unovis dentro. Grade pela cor de hairline
 * da marca, fonte pela família do DS. Sem cor hex — só token. */
.si-dash-chart {
  height: 200px;
  --vis-axis-grid-color: var(--si-cinza-claro);
  --vis-axis-tick-color: var(--si-cinza-claro);
  --vis-font-family: var(--si-font-family);
}

.si-dash-chart__fallback {
  height: 200px;
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
