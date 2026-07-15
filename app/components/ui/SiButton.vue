<script setup lang="ts">
/**
 * SiButton — wrapper de VBtn (ADR-013). API curada em variante/tamanho/cor/estado;
 * o resto (eventos, `href`, `to`, `prepend-icon`…) passa por $attrs. Slots livres.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
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
</script>

<template>
  <v-btn
    v-bind="$attrs"
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
  </v-btn>
</template>
