<script setup lang="ts">
/**
 * Cronologia do detalhe da Cotação (RN-081): os marcos que a plataforma conhece do pedido, mais recente
 * primeiro. O backend manda só o **tipo estável** + a data; o rótulo/ícone/tom vêm do view-model. No
 * desktop é aside fixo; no mobile é colapsável (`collapsible`).
 */
import type { QuotationTimelineEvent } from '~/composables/useQuotationDetail'
import { getTimelineEventView } from '~/lib/quotations/detailView'
import { toBrDateTimeAt } from '~/lib/dates'

const props = withDefaults(defineProps<{
  events: QuotationTimelineEvent[]
  collapsible?: boolean
}>(), { collapsible: false })

const open = ref(!props.collapsible)

const countLabel = computed(() =>
  `${props.events.length} ${props.events.length === 1 ? 'evento' : 'eventos'}`)
</script>

<template>
  <SiCard
    variant="outlined"
    class="si-crono"
  >
    <button
      v-if="collapsible"
      type="button"
      class="si-crono__toggle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="si-crono__title">Cronologia</span>
      <span class="si-crono__count">{{ countLabel }}</span>
      <SiIcon
        icon="chevronDown"
        :size="18"
        :class="['si-crono__chevron', { 'si-crono__chevron--open': open }]"
      />
    </button>
    <div
      v-else
      class="si-crono__header"
    >
      <span class="si-crono__title">Cronologia</span>
      <span class="si-crono__count">{{ countLabel }}</span>
    </div>

    <ol
      v-show="open"
      class="si-crono__list"
    >
      <li
        v-for="(event, index) in events"
        :key="`${event.type}-${index}`"
        class="si-crono__item"
      >
        <span
          class="si-crono__icon"
          :class="`si-crono__icon--${getTimelineEventView(event.type).tone}`"
        >
          <SiIcon
            :icon="getTimelineEventView(event.type).icon"
            :size="15"
          />
        </span>
        <span
          v-if="index < events.length - 1"
          class="si-crono__connector"
        />
        <div class="si-crono__body">
          <span class="si-crono__label">{{ getTimelineEventView(event.type).label }}</span>
          <span class="si-crono__meta">{{ toBrDateTimeAt(event.occurredAt) }}</span>
        </div>
      </li>
    </ol>
  </SiCard>
</template>

<style scoped>
.si-crono {
  overflow: hidden;
}

.si-crono__header,
.si-crono__toggle {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-4) var(--si-space-5);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-crono__toggle {
  width: 100%;
  min-height: 52px;
  background: none;
  border-inline: none;
  border-top: none;
  cursor: pointer;
  text-align: left;
}

.si-crono__title {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-crono__count {
  margin-right: auto;
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
  font-variant-numeric: tabular-nums;
}

.si-crono__chevron {
  transition: transform var(--si-dur-base) var(--si-ease-out);
}

.si-crono__chevron--open {
  transform: rotate(180deg);
}

.si-crono__list {
  list-style: none;
  margin: 0;
  padding: var(--si-space-4) var(--si-space-5) var(--si-space-1);
  max-height: 460px;
  overflow-y: auto;
}

.si-crono__item {
  position: relative;
  display: flex;
  gap: var(--si-space-3);
  padding-bottom: var(--si-space-4);
}

.si-crono__icon {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--si-radius-pill);
}

.si-crono__icon--positive {
  background: var(--si-verde-100);
  color: var(--si-verde-800);
}

.si-crono__icon--attention {
  background: var(--si-warning-tint);
  color: var(--si-warning-fg);
}

.si-crono__icon--neutral {
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

/* Linha vertical ligando os marcos, ancorada no centro do ícone (32px → 15px). */
.si-crono__connector {
  position: absolute;
  top: 32px;
  left: 15px;
  bottom: 0;
  width: 1.5px;
  background: var(--si-cinza-claro);
}

.si-crono__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: var(--si-space-1);
}

.si-crono__label {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-crono__meta {
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}
</style>
