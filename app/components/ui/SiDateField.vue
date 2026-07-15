<script setup lang="ts">
/**
 * SiDateField — campo de data (ADR-013 §6). VDateInput nativo (labs; habilitado no
 * nuxt.config) + calendário. v-model = Date. Formato de exibição pt-BR (dd/mm/aaaa).
 * `rules`, `label` etc. por $attrs.
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<Date | null>()

withDefaults(defineProps<{
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  displayFormat?: string
}>(), {
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  displayFormat: 'dd/MM/yyyy',
})
</script>

<template>
  <VDateInput
    v-model="model"
    v-bind="$attrs"
    :variant="variant"
    :density="density"
    :color="color"
    :display-format="displayFormat"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VDateInput>
</template>
