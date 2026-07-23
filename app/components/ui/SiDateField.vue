<script setup lang="ts">
/**
 * SiDateField — campo de data (ADR-013 §6). VDateInput nativo (labs; habilitado no
 * nuxt.config) + calendário. Exibição pt-BR (dd/MM/yyyy) e v-model no padrão do backend.
 *
 * v-model: string padronizada por `valueFormat` — 'iso' (2026-07-15, padrão), 'br'
 * (15-07-2026) ou 'date' (objeto Date). Internamente o VDateInput opera com Date; a
 * conversão fica escondida aqui, então a tela só vê o valor pronto pro backend.
 */
import { toBrDate, toIsoDate, toBrDashDate, fromIsoDate, fromBrDashDate } from '~/lib/dates'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | Date | null>()

const props = withDefaults(defineProps<{
  label?: string
  required?: boolean
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
  valueFormat?: 'iso' | 'br' | 'date'
}>(), {
  label: undefined,
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
  valueFormat: 'iso',
})

// Ponte string(backend) <-> Date(VDateInput). Getter e setter escondem a conversão.
const inner = computed<Date | null>({
  get() {
    const v = model.value
    if (v == null || v === '') return null
    if (v instanceof Date) return v
    return props.valueFormat === 'br' ? fromBrDashDate(v) : fromIsoDate(v)
  },
  set(d) {
    if (!d) {
      model.value = null
      return
    }
    model.value = props.valueFormat === 'date'
      ? d
      : props.valueFormat === 'br' ? toBrDashDate(d) : toIsoDate(d)
  },
})

// Exibição determinística pt-BR (dd/MM/yyyy), independente do locale do adapter.
function displayBr(value: unknown): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value as string)
  return Number.isNaN(d.getTime()) ? '' : toBrDate(d)
}
</script>

<template>
  <SiFieldShell
    :label="label"
    :required="required"
  >
    <template #default="{ fieldId }">
      <VDateInput
        v-bind="$attrs"
        :id="($attrs.id as string | undefined) ?? fieldId"
        v-model="inner"
        class="si-field"
        :variant="variant"
        :density="density"
        :color="color"
        :display-format="displayBr"
        :menu-props="{ contentClass: 'si-datepicker' }"
      >
        <template v-for="(_, name) in $slots" #[name]="slotProps">
          <slot :name="name" v-bind="slotProps ?? {}" />
        </template>
      </VDateInput>
    </template>
  </SiFieldShell>
</template>
