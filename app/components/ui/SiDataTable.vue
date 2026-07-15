<script setup lang="ts">
/**
 * SiDataTable — wrapper de VDataTable (ADR-013). `headers`, `items`, `search`, `loading`
 * por $attrs. Densidade curada; slots livres (item.<col>, top, no-data…).
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  density?: 'default' | 'comfortable' | 'compact'
  hover?: boolean
}>(), {
  density: 'comfortable',
  hover: true,
})
</script>

<template>
  <v-data-table v-bind="$attrs" :density="density" :hover="hover">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-data-table>
</template>
