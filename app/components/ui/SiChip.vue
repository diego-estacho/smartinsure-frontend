<script setup lang="ts">
/**
 * SiChip — wrapper de VChip (ADR-013). Cor/variante/tamanho curados; resto por $attrs.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'plain'
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  label?: boolean
  /** Ponto 6px à esquerda (DS status pill); herda a cor do texto do chip. */
  dot?: boolean
}>(), {
  variant: 'tonal',
  color: 'primary',
  size: 'small',
  dot: false,
})
</script>

<template>
  <VChip
    class="si-chip"
    :class="{ 'si-chip--dot': dot }"
    v-bind="$attrs"
    :variant="variant"
    :color="color"
    :size="size"
    :label="label"
  >
    <span
      v-if="dot"
      class="si-chip__dot"
      aria-hidden="true"
    />
    <slot name="prepend" />
    <slot />
    <slot name="append" />
  </VChip>
</template>
