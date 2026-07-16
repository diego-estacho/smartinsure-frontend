<script setup lang="ts">
/**
 * Layout default — só o shell mínimo do Vuetify (`VApp`), sem menu lateral.
 * É o layout automático das páginas que não pedem outro (login, landing, formulários
 * avulsos). O `VApp` vive aqui (não no `app.vue`) para que cada página tenha exatamente
 * um contexto de layout — o shell com drawer é o layout `shell`.
 */
</script>

<template>
  <VApp>
    <slot />
  </VApp>
</template>
