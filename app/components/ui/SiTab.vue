<script setup lang="ts">
/**
 * SiTab — wrapper de VTab (ADR-013). Item de SiTabs. `value`, `text`, `prepend-icon` por $attrs.
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <v-tab v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-tab>
</template>
