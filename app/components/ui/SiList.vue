<script setup lang="ts">
/**
 * SiList — wrapper de VList (ADR-013). Use SiListItem (ou `items`) para o conteúdo.
 * v-model (seleção) via defineModel; `density`, `nav`, `lines` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<unknown>()

withDefaults(defineProps<{
  density?: 'default' | 'comfortable' | 'compact'
  nav?: boolean
}>(), {
  density: 'comfortable',
})
</script>

<template>
  <v-list v-bind="$attrs" v-model:selected="model" :density="density" :nav="nav">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-list>
</template>
