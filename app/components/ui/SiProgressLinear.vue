<script setup lang="ts">
/**
 * SiProgressLinear — wrapper de VProgressLinear (ADR-013). Cor curada; `indeterminate`,
 * `model-value`, `height`, `rounded` por $attrs.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  color?: string
  indeterminate?: boolean
  rounded?: boolean | string
}>(), {
  color: 'primary',
  rounded: true,
})
</script>

<template>
  <VProgressLinear v-bind="$attrs" :color="color" :indeterminate="indeterminate" :rounded="rounded">
    <slot />
  </VProgressLinear>
</template>
