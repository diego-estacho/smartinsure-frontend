<script setup lang="ts">
/**
 * SiRadioGroup — wrapper de VRadioGroup (ADR-013). v-model via defineModel; use SiRadio
 * (ou o slot) para as opções. `label`, `inline`, `rules` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<unknown>()

withDefaults(defineProps<{
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
  inline?: boolean
}>(), {
  color: 'primary',
  density: 'comfortable',
})
</script>

<template>
  <v-radio-group v-bind="$attrs" v-model="model" :color="color" :density="density" :inline="inline">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-radio-group>
</template>
