<script setup lang="ts">
/**
 * Cadastro de corretora agora é um modal na listagem (RN-052/RN-019): consulta somente leitura →
 * revisar → confirmar. Esta rota antiga (página que persistia na busca) redireciona para a lista.
 */
definePageMeta({ layout: 'shell' })

await navigateTo('/corretoras', { replace: true })
</script>

<template>
  <div />
</template>
