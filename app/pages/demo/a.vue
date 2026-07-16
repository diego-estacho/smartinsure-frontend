<script setup lang="ts">
// Página de demonstração — sem termo de domínio (rota neutra). Existe só para validar
// que o item A do menu navega e renderiza este conteúdo. Sai quando as jornadas reais entrarem.
definePageMeta({ layout: 'shell' })
useHead({ title: 'Página A — SmartInsure' })
</script>

<template>
  <VContainer class="py-8">
    <h1 class="text-h4 mb-2">
      Página A
    </h1>
    <p class="text-body-1 text-medium-emphasis mb-6">
      Conteúdo de demonstração A. Clicar em <strong>Página A</strong> no menu lateral
      renderiza esta tela — prova de que a navegação do shell funciona.
    </p>
    <SiCard
      :elevation="2"
      class="pa-6"
    >
      <SiChip
        color="info"
        size="small"
      >
        rota: /demo/a
      </SiChip>
    </SiCard>
  </VContainer>
</template>
