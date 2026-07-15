<script setup lang="ts">
/**
 * SiAvatar — wrapper de VAvatar (ADR-013). Tamanho/cor/raio curados; `image`, `icon`,
 * `text` por $attrs. Slot default para conteúdo custom.
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large' | number | string
  color?: string
  rounded?: boolean | string
}>(), {
  size: 'default',
  color: undefined,
  rounded: undefined,
})
</script>

<template>
  <v-avatar v-bind="$attrs" :size="size" :color="color" :rounded="rounded">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-avatar>
</template>
