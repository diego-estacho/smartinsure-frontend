<script setup lang="ts">
/**
 * SiProgressCircular — wrapper de VProgressCircular (ADR-013). Cor curada; `indeterminate`,
 * `model-value`, `size`, `width` por $attrs.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  color?: string
  indeterminate?: boolean
}>(), {
  color: 'primary',
})
</script>

<template>
  <VProgressCircular v-bind="$attrs" :color="color" :indeterminate="indeterminate">
    <slot />
  </VProgressCircular>
</template>
