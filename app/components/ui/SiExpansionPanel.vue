<script setup lang="ts">
/**
 * SiExpansionPanel — wrapper de VExpansionPanel (ADR-013). Item de SiExpansionPanels.
 * `title`, `value` por $attrs. Slots: default (conteúdo), title.
 */
defineOptions({ inheritAttrs: false })
</script>

<template>
  <VExpansionPanel class="si-expansion-panel" v-bind="$attrs">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VExpansionPanel>
</template>
