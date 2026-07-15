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
}>(), {
  variant: 'tonal',
  color: 'primary',
  size: 'small',
})
</script>

<template>
  <VChip v-bind="$attrs" :variant="variant" :color="color" :size="size" :label="label">
    <slot name="prepend" />
    <slot />
    <slot name="append" />
  </VChip>
</template>
