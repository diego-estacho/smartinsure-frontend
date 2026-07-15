<script setup lang="ts">
/**
 * SiCheckbox — wrapper de VCheckbox (ADR-013). v-model via defineModel; `label`, `value`,
 * `rules` por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean | unknown[] | null>()

withDefaults(defineProps<{
  color?: string
  density?: 'default' | 'comfortable' | 'compact'
}>(), {
  color: 'primary',
  density: 'comfortable',
})
</script>

<template>
  <v-checkbox v-bind="$attrs" v-model="model" :color="color" :density="density">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-checkbox>
</template>
