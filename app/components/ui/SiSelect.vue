<script setup lang="ts">
/**
 * SiSelect — wrapper de VSelect (ADR-013). v-model via defineModel; `items`, `item-title`,
 * `item-value`, `multiple`, `rules` etc. por $attrs. Mesmo visual dos demais campos.
 *
 * DS: rótulo estático acima (SiFieldShell); o `label` não vai ao VSelect (ver SiTextField).
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<unknown>()

withDefaults(defineProps<{
  label?: string
  required?: boolean
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  clearable?: boolean
}>(), {
  label: undefined,
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
})
</script>

<template>
  <SiFieldShell
    :label="label"
    :required="required"
  >
    <template #default="{ fieldId }">
      <VSelect
        v-bind="$attrs"
        :id="($attrs.id as string | undefined) ?? fieldId"
        v-model="model"
        class="si-field"
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
  </SiFieldShell>
</template>
