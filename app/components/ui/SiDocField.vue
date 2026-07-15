<script setup lang="ts">
/**
 * SiDocField — campo de documento mascarado (ADR-013 §6). VTextField + maska.
 * `tipo` escolhe a máscara (cpf/cnpj/auto). Suporta CNPJ alfanumérico (2026) via token `N`.
 * v-model = valor mascarado (o que o usuário vê). `rules`, `label` etc. por $attrs.
 */
import { vMaska } from 'maska/vue'
import { MASK_CPF, MASK_CNPJ, MASK_CPF_CNPJ, maskTokens } from '~/lib/masks'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | null>()

const props = withDefaults(defineProps<{
  tipo?: 'cpf' | 'cnpj' | 'auto'
  variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  density?: 'default' | 'comfortable' | 'compact'
  color?: string
}>(), {
  tipo: 'auto',
  variant: 'outlined',
  density: 'comfortable',
  color: 'primary',
})

const maskOptions = computed(() => ({
  mask: props.tipo === 'cpf' ? MASK_CPF : props.tipo === 'cnpj' ? MASK_CNPJ : [...MASK_CPF_CNPJ],
  tokens: maskTokens,
}))
</script>

<template>
  <v-text-field
    v-model="model"
    v-maska="maskOptions"
    v-bind="$attrs"
    :variant="variant"
    :density="density"
    :color="color"
    inputmode="text"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-text-field>
</template>
