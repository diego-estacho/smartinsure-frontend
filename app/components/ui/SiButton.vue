<script setup lang="ts">
/**
 * SiButton — wrapper de VBtn (ADR-013). API curada em variante/tamanho/cor/estado;
 * o resto (eventos, `href`, `to`, `prepend-icon`…) passa por $attrs. Slots livres.
 *
 * Variantes DS (components-buttons): só o **primário** é preenchido (verde). `secondary` e
 * `error` (danger) são **sutis** (fundo branco, borda, texto colorido), acabados no `skin.css`
 * (`.si-button--secondary/danger`), que usa `!important` para vencer o utilitário `.bg-*` do
 * Vuetify (também `!important`) — única forma de sobrepô-lo.
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'plain' | 'elevated'
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  rounded?: boolean | string
}>(), {
  variant: 'flat',
  color: 'primary',
  size: 'default',
  rounded: 'md',
})

const rootClass = computed(() => [
  'si-button',
  props.color === 'secondary' ? 'si-button--secondary' : props.color === 'error' ? 'si-button--danger' : undefined,
])
</script>

<template>
  <VBtn
    v-bind="$attrs"
    :class="rootClass"
    :variant="variant"
    :color="color"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled"
    :rounded="rounded"
  >
    <slot name="prepend" />
    <slot />
    <slot name="append" />
  </VBtn>
</template>
