<script setup lang="ts">
/**
 * SiDivider — wrapper de VDivider (ADR-013). `vertical`, `inset`, `thickness` por $attrs.
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <v-divider v-bind="$attrs">
    <slot />
  </v-divider>
</template>
