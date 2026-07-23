<script setup lang="ts">
/**
 * SiIcon — wrapper de VIcon (ADR-013). Ícones **Lucide** centralizados em lib/icons.ts
 * (ADR-003/021): passe a chave estável do registry em `icon` (ex.: "shieldCheck"). O set
 * customizado do Vuetify resolve a chave para o componente Lucide (traço 1.5, currentColor).
 * Cor/tamanho curados; resto por $attrs. Tamanhos do DS: 24 padrão / 20 inline / 16 linha densa.
 */
import type { AppIconName } from '~/lib/icons'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  icon: AppIconName
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large' | number | string
}>(), {
  color: undefined,
  size: 'default',
})
</script>

<template>
  <VIcon class="si-icon" v-bind="$attrs" :icon="icon" :color="color" :size="size" />
</template>
