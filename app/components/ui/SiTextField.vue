<script setup lang="ts">
/**
 * SiTextField — wrapper de VTextField (ADR-013). v-model via defineModel; variante/
 * densidade/cor curadas com defaults do DS; resto (`label`, `rules`, `type`, `prepend-inner-icon`…)
 * por $attrs. Slots livres.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<string | number | null>()

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
  <v-text-field
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
  </v-text-field>
</template>
