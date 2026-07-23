<script setup lang="ts">
/**
 * SiSnackbar — wrapper de VSnackbar (ADR-013). Toast transitório em superfície carvão
 * (DS: components/Snackbar.jsx), ação em verde, auto-dismiss ~4s, bottom-center (padrão do
 * VSnackbar). Para mensagem persistente use SiAlert. v-model (aberto) via defineModel; a
 * mensagem vai no slot default; ações no slot `actions`. Acabamento no skin (`.si-snackbar`).
 */
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>()

withDefaults(defineProps<{
  timeout?: number | string
}>(), {
  timeout: 4000,
})
</script>

<template>
  <VSnackbar v-bind="$attrs" v-model="model" class="si-snackbar" :timeout="timeout">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </VSnackbar>
</template>
