<script setup lang="ts">
/**
 * SiNavigationDrawer — wrapper de VNavigationDrawer (ADR-013). Menu lateral do shell.
 * v-model (aberto/fechado) via defineModel; `rail`, `permanent`, `location` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>()

withDefaults(defineProps<{
  color?: string
  width?: number | string
}>(), {
  color: 'surface',
  width: undefined,
})
</script>

<template>
  <VNavigationDrawer v-bind="$attrs" v-model="model" :color="color" :width="width">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VNavigationDrawer>
</template>
