<script setup lang="ts">
/**
 * SiTextarea — wrapper de VTextarea (ADR-013). Mesmo padrão do SiTextField.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<string | null>()

withDefaults(defineProps<{
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  autoGrow?: boolean
  rows?: number | string
}>(), {
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  rows: 3,
})
</script>

<template>
  <VTextarea
    v-bind="$attrs"
    v-model="model"
    :variant="variant"
    :density="density"
    :color="color"
    :auto-grow="autoGrow"
    :rows="rows"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VTextarea>
</template>
