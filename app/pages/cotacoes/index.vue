<script setup lang="ts">
/**
 * Cotações — placeholder "em construção" (exec-plan 0015). A listagem real de cotações está
 * fora de escopo nesta fase; por ora esta página só dá acesso à criação de uma nova oferta
 * (QuotationGroup) pelo botão "Nova oferta".
 */
definePageMeta({ layout: 'shell' })
</script>

<template>
  <VContainer class="si-quotations">
    <header class="si-quotations__header">
      <h1 class="text-h5">
        Cotações
      </h1>

      <SiButton
        to="/ofertas/nova"
        :prepend-icon="'plus'"
      >
        Nova oferta
      </SiButton>
    </header>

    <SiCard
      variant="outlined"
      class="si-quotations__empty"
    >
      <SiIcon
        icon="fileText"
        :size="40"
        class="si-quotations__empty-icon"
      />
      <h2 class="text-subtitle-1 si-quotations__empty-title">
        Em construção
      </h2>
      <p class="si-quotations__empty-text">
        A listagem de cotações ainda está em construção. Use "Nova oferta" para iniciar uma cotação.
      </p>
    </SiCard>
  </VContainer>
</template>

<style scoped>
.si-quotations {
  max-width: var(--si-container-wide);
}

.si-quotations__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-quotations__header h1 {
  margin: 0;
}

.si-quotations__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-2);
  padding: var(--si-space-10) var(--si-space-6);
}

.si-quotations__empty-icon {
  color: var(--si-cinza);
}

.si-quotations__empty-title {
  margin: 0;
}

.si-quotations__empty-text {
  margin: 0;
  max-width: 42ch;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

@media (max-width: 599.98px) {
  .si-quotations__header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
