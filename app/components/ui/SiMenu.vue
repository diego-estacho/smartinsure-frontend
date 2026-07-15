<script setup lang="ts">
/**
 * SiMenu — wrapper de VMenu (ADR-013). v-model (aberto) via defineModel; `location`,
 * `offset` por $attrs. Slots: activator, default (conteúdo, ex.: SiList).
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>()
</script>

<template>
  <v-menu v-bind="$attrs" v-model="model">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-menu>
</template>
