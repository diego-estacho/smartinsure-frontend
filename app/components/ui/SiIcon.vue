<script setup lang="ts">
/**
 * SiIcon — wrapper de VIcon (ADR-013). Ícones mdi-svg centralizados em lib/icons.ts
 * (ADR-003): passe o path importado de lá em `icon`. Cor/tamanho curados; resto por $attrs.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  icon: string
  color?: string
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large' | number | string
}>(), {
  color: undefined,
  size: 'default',
})
</script>

<template>
  <v-icon v-bind="$attrs" :icon="icon" :color="color" :size="size" />
</template>
