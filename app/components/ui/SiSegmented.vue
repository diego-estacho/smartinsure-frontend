<script setup lang="ts">
/**
 * SiSegmented — controle segmentado de N estados (ADR-013/ADR-022). Uma pílula com botões; o botão
 * ativo fica em `--si-carvao-800` com texto claro. Novo no kit (o Vuetify 3 não tem segmented
 * nativo). Usado no editor de permissões (níveis Sem acesso · Consultar · Operar) e reutilizável.
 * `model` pode ser `null` — nenhum botão aceso (ex.: nível "Personalizado" do editor).
 */
defineOptions({ inheritAttrs: false })

export interface SiSegmentedOption {
  value: string
  label: string
}

const model = defineModel<string | null>()

withDefaults(defineProps<{
  options: readonly SiSegmentedOption[]
  ariaLabel?: string
  size?: 'default' | 'compact'
  disabled?: boolean
}>(), {
  size: 'default',
  disabled: false,
})

function select(value: string, disabled: boolean) {
  if (!disabled) {
    model.value = value
  }
}
</script>

<template>
  <div
    class="si-segmented"
    :class="{ 'si-segmented--compact': size === 'compact' }"
    role="group"
    :aria-label="ariaLabel"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="si-segmented__option"
      :class="{ 'si-segmented__option--active': model === option.value }"
      :aria-pressed="model === option.value"
      :disabled="disabled"
      @click="select(option.value, disabled)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.si-segmented {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: rgb(var(--v-theme-background));
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-pill);
}

.si-segmented__option {
  appearance: none;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--si-radius-pill);
  font-family: var(--si-font-family);
  font-size: 12px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
  line-height: 1;
  white-space: nowrap;
  transition:
    background var(--si-dur-fast) var(--si-ease-out),
    color var(--si-dur-fast) var(--si-ease-out);
}

.si-segmented__option:hover:not(.si-segmented__option--active):not(:disabled) {
  color: var(--si-carvao-800);
}

.si-segmented__option--active {
  background: var(--si-carvao-800);
  color: rgb(var(--v-theme-surface));
}

.si-segmented__option:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.si-segmented--compact .si-segmented__option {
  padding: 4px 10px;
}
</style>
