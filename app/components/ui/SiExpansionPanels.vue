<script setup lang="ts">
/**
 * SiExpansionPanels — wrapper de VExpansionPanels (ADR-013). Contém SiExpansionPanel.
 * v-model (abertos) via defineModel; `multiple`, `variant` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<unknown>()
</script>

<template>
  <v-expansion-panels v-bind="$attrs" v-model="model">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-expansion-panels>
</template>
