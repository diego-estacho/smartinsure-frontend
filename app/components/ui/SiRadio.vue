<script setup lang="ts">
/**
 * SiRadio — wrapper de VRadio (ADR-013). Usar dentro de SiRadioGroup. `label`, `value`
 * por $attrs.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  color?: string
}>(), {
  color: 'primary',
})
</script>

<template>
  <VRadio v-bind="$attrs" :color="color">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VRadio>
</template>
