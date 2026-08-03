<script setup lang="ts">
/**
 * SiAutocomplete — wrapper de VAutocomplete (ADR-013). Igual ao SiSelect no visual, mas com busca
 * por digitação: filtra a lista pelo `item-title` conforme o usuário digita — para listas longas
 * (ex.: catálogo de modalidades) em que rolar até a opção é ruim. v-model via defineModel;
 * `items`, `item-title`, `item-value`, `multiple`, `rules` etc. por $attrs.
 *
 * DS: rótulo estático acima (SiFieldShell); o `label` não vai ao VAutocomplete (ver SiTextField).
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
  noDataText?: string
}>(), {
  label: undefined,
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  noDataText: 'Nenhuma opção encontrada',
})
</script>

<template>
  <SiFieldShell
    :label="label"
    :required="required"
  >
    <template #default="{ fieldId }">
      <VAutocomplete
        v-bind="$attrs"
        :id="($attrs.id as string | undefined) ?? fieldId"
        v-model="model"
        class="si-field"
        :variant="variant"
        :density="density"
        :color="color"
        :clearable="clearable"
        :no-data-text="noDataText"
        auto-select-first
      >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </VAutocomplete>
    </template>
  </SiFieldShell>
</template>
