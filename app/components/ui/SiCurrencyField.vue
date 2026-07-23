<script setup lang="ts">
/**
 * SiCurrencyField — campo de moeda BRL (ADR-013 §6). VTextField + vue-currency-input
 * (o VNumberInput nativo não formata BRL com milhar/vírgula — decisão registrada no
 * exec-plan 0002). Formata "R$ 1.234,56"; v-model = number (pronto pra cálculo/envio).
 * `rules`/`disabled` por $attrs; `label`/`required` viram rótulo estático (SiFieldShell).
 */
import { useCurrencyInput } from 'vue-currency-input'

defineOptions({ inheritAttrs: false })

const model = defineModel<number | null>()

const props = withDefaults(defineProps<{
  label?: string
  required?: boolean
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  precision?: number
}>(), {
  label: undefined,
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  precision: 2,
})

// autoEmit=false: sincronizamos com o defineModel na mão (nos dois sentidos).
const { inputRef, numberValue, setValue } = useCurrencyInput({
  currency: 'BRL',
  locale: 'pt-BR',
  precision: props.precision,
}, false)

// vue-currency-input espera o <input> DOM em inputRef; o `ref` de um componente Vuetify
// entrega a instância, então extraímos o input interno via function-ref.
function bindCurrencyInput(comp: unknown) {
  const el = (comp as { $el?: HTMLElement } | null)?.$el
  inputRef.value = el?.querySelector('input') ?? null
}

watch(model, (v) => {
  if (v !== numberValue.value) setValue(v ?? null)
}, { immediate: true })

watch(numberValue, (v) => {
  model.value = v
})
</script>

<template>
  <SiFieldShell
    :label="label"
    :required="required"
  >
    <template #default="{ fieldId }">
      <VTextField
        v-bind="$attrs"
        :id="($attrs.id as string | undefined) ?? fieldId"
        :ref="bindCurrencyInput"
        class="si-field"
        :variant="variant"
        :density="density"
        :color="color"
        inputmode="decimal"
      >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </VTextField>
    </template>
  </SiFieldShell>
</template>
