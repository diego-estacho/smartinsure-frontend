<script setup lang="ts">
/**
 * SiDialog — wrapper de VDialog (ADR-013). v-model (aberto) via defineModel; largura curada;
 * `persistent`, `fullscreen` por $attrs. Slots: activator, default (conteúdo, ex.: SiCard).
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>()

withDefaults(defineProps<{
  maxWidth?: number | string
}>(), {
  maxWidth: 560,
})
</script>

<template>
  <VDialog v-bind="$attrs" v-model="model" :max-width="maxWidth">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VDialog>
</template>
