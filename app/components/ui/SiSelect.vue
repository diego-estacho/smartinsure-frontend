<script setup lang="ts">
/**
 * SiSelect — wrapper de VSelect (ADR-013). v-model via defineModel; `items`, `item-title`,
 * `item-value`, `multiple`, `rules` etc. por $attrs. Mesmo visual dos demais campos.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<unknown>()

withDefaults(defineProps<{
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  clearable?: boolean
}>(), {
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
})
</script>

<template>
  <VSelect
    v-bind="$attrs"
    v-model="model"
    :variant="variant"
    :density="density"
    :color="color"
    :clearable="clearable"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VSelect>
</template>
