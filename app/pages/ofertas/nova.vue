<script setup lang="ts">
/**
 * Nova oferta (QuotationGroup) — página orquestradora fina (ADR-018). O fluxo (tela de entrada +
 * 5 etapas + resumo lateral) vive no componente de domínio QuotationGroupsWizard; a página só
 * define o layout e o monta. Rota provisória `/ofertas/nova` (exec-plan 0015).
 *
 * Fluxo FOCADO: usa o layout `default` (sem o menu de navegação da app) — a lateral é ocupada
 * pelo resumo da oferta, conforme o protótipo. O cabeçalho próprio vive no QuotationGroupsWizard.
 */
definePageMeta({ layout: 'default' })
</script>

<template>
  <QuotationGroupsWizard />
</template>
