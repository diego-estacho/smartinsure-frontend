<script setup lang="ts">
/**
 * SiDivider — wrapper de VDivider (ADR-013). `vertical`, `inset`, `thickness` por $attrs.
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <VDivider v-bind="$attrs">
    <slot />
  </VDivider>
</template>
