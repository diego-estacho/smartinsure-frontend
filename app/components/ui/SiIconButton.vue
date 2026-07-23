<script setup lang="ts">
/**
 * SiIconButton — botão-ícone discreto do DS (Table.card.html `.iconbtn`): quadrado arredondado,
 * transparente, ícone em **cinza neutro** (NÃO verde), faixa clara no hover. Padrão das colunas
 * de ações das listas e ativador de SiMenu/SiTooltip (ADR-013).
 *
 * `tone="view"` = hover verde (ação de ver/detalhe, positiva). `icon` é a chave Lucide do
 * registry (`lib/icons.ts`). `to`, `aria-label`, `@click` e os `props` de ativador
 * (SiMenu/SiTooltip) seguem por $attrs. O acabamento vive no skin (`.si-icon-button`, ADR-014),
 * onde vence o default global `VBtn { color: 'primary' }`.
 */
import type { AppIconName } from '~/lib/icons'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  icon: AppIconName
  tone?: 'neutral' | 'view'
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large' | number | string
}>(), {
  tone: 'neutral',
  size: 'small',
})
</script>

<template>
  <VBtn
    v-bind="$attrs"
    :icon="icon"
    variant="text"
    :size="size"
    :class="['si-icon-button', tone === 'view' ? 'si-icon-button--view' : undefined]"
  />
</template>
