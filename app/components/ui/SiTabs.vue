<script setup lang="ts">
/**
 * SiTabs — wrapper de VTabs (ADR-013). Contém SiTab. v-model (aba ativa) via defineModel;
 * cor curada; `grow`, `align-tabs` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<unknown>()

withDefaults(defineProps<{
  color?: string
}>(), {
  color: 'primary',
})
</script>

<template>
  <VTabs v-bind="$attrs" v-model="model" :color="color">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VTabs>
</template>
