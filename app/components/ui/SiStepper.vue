<script setup lang="ts">
/**
 * SiStepper — indicador de progresso de um fluxo linear (emissão, sinistro, onboarding),
 * conforme o DS (components/Stepper.jsx). NÃO é o VStepper do Vuetify (aquele é um assistente
 * com painéis de conteúdo): aqui é só a trilha de etapas — bolinha + conector + rótulo — que o
 * DS desenha. Componente apresentacional próprio (o Vuetify não tem primitivo equivalente);
 * tudo por token (ADR-006) e escopado sob `.si-stepper*` (ADR-015).
 *
 * Estados por índice vs. `current` (v-model): concluída (i < current) = verde preenchida com
 * check; atual (i === current) = anel verde; futura (i > current) = neutra. Conectores ficam
 * verdes conforme o fluxo avança. `clickable` permite voltar a etapas já alcançadas (i <= current).
 */
export interface SiStep {
  label: string
  description?: string
}

const current = defineModel<number>('current', { default: 0 })

const props = withDefaults(defineProps<{
  steps: SiStep[]
  orientation?: 'horizontal' | 'vertical'
  clickable?: boolean
}>(), {
  orientation: 'horizontal',
  clickable: false,
})

type StepState = 'done' | 'current' | 'todo'

function stateOf(index: number): StepState {
  if (index < current.value) return 'done'
  if (index === current.value) return 'current'
  return 'todo'
}

function isClickable(index: number): boolean {
  return props.clickable && index <= current.value
}

function goTo(index: number): void {
  if (isClickable(index)) current.value = index
}
</script>

<template>
  <div
    class="si-stepper"
    :class="`si-stepper--${orientation}`"
  >
    <div
      v-for="(step, i) in steps"
      :key="i"
      class="si-stepper__step"
      :class="`si-stepper__step--${stateOf(i)}`"
    >
      <div class="si-stepper__track">
        <span
          class="si-stepper__dot"
          :aria-current="stateOf(i) === 'current' ? 'step' : undefined"
        >
          <SiIcon
            v-if="stateOf(i) === 'done'"
            icon="check"
            :size="14"
          />
          <template v-else>{{ i + 1 }}</template>
        </span>

        <span
          v-if="i < steps.length - 1"
          class="si-stepper__connector"
          :class="{ 'si-stepper__connector--done': i < current }"
        />
      </div>

      <component
        :is="isClickable(i) ? 'button' : 'div'"
        class="si-stepper__label-block"
        :class="{ 'si-stepper__label-block--clickable': isClickable(i) }"
        :type="isClickable(i) ? 'button' : undefined"
        @click="goTo(i)"
      >
        <span class="si-stepper__label">{{ step.label }}</span>
        <span
          v-if="step.description"
          class="si-stepper__desc"
        >{{ step.description }}</span>
      </component>
    </div>
  </div>
</template>

<style scoped>
.si-stepper {
  display: flex;
  inline-size: 100%;
}

.si-stepper--horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.si-stepper--vertical {
  flex-direction: column;
  align-items: stretch;
}

.si-stepper__step {
  display: flex;
  min-inline-size: 0;
}

.si-stepper--horizontal .si-stepper__step {
  flex: 1;
  flex-direction: column;
  align-items: stretch;
}

.si-stepper--vertical .si-stepper__step {
  flex: initial;
  flex-direction: row;
  align-items: flex-start;
}

/* Trilha (bolinha + conector) */
.si-stepper__track {
  display: flex;
}

.si-stepper--horizontal .si-stepper__track {
  align-items: center;
  inline-size: 100%;
}

.si-stepper--vertical .si-stepper__track {
  flex-direction: column;
  align-items: center;
  align-self: stretch;
}

/* Bolinha 28×28 (DS Stepper.jsx) */
.si-stepper__dot {
  flex-shrink: 0;
  inline-size: 28px;
  block-size: 28px;
  border-radius: var(--si-radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  border: 1px solid var(--si-border-strong);
  background: rgb(var(--v-theme-surface));
  color: var(--si-cinza);
  transition:
    background var(--si-dur-base) var(--si-ease-out),
    border-color var(--si-dur-base) var(--si-ease-out),
    color var(--si-dur-base) var(--si-ease-out),
    box-shadow var(--si-dur-base) var(--si-ease-out);
}

/* traço do check mais grosso que o padrão do set (DS: strokeWidth 3) */
.si-stepper__dot :deep(svg) {
  stroke-width: 3;
}

.si-stepper__step--current .si-stepper__dot {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.18);
}

.si-stepper__step--done .si-stepper__dot {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

/* Conector: cinza; verde quando o trecho já foi concluído */
.si-stepper__connector {
  flex: 1;
  background: var(--si-border-strong);
  transition: background var(--si-dur-base) var(--si-ease-out);
}

.si-stepper--horizontal .si-stepper__connector {
  block-size: 2px;
  margin-inline: var(--si-space-2);
}

.si-stepper--vertical .si-stepper__connector {
  inline-size: 2px;
  min-block-size: 24px;
}

.si-stepper__connector--done {
  background: rgb(var(--v-theme-primary));
}

/* Bloco de rótulo */
.si-stepper__label-block {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  /* reset quando vira <button> */
  border: 0;
  background: none;
  text-align: start;
  font-family: inherit;
}

.si-stepper--horizontal .si-stepper__label-block {
  padding-block-start: var(--si-space-2);
  padding-inline-end: var(--si-space-3);
}

.si-stepper--vertical .si-stepper__label-block {
  padding-block: 2px var(--si-space-5);
  padding-inline-start: var(--si-space-3);
}

.si-stepper__label-block--clickable {
  cursor: pointer;
}

.si-stepper__label {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}

.si-stepper__step--todo .si-stepper__label {
  color: var(--si-cinza);
}

.si-stepper__desc {
  font-size: var(--si-fs-caption);
  line-height: var(--si-lh-caption);
  color: var(--si-cinza);
}
</style>
