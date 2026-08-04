<script setup lang="ts">
/**
 * Modal do passo 1 da cotação: abre a Consulta de Crédito em modo `embed` (só leitura),
 * com Tomador e Corretora já definidos. O modal não seleciona seguradora nem altera a cotação.
 */
const open = defineModel<boolean>({ required: true })

defineProps<{
  brokerageId: string
  brokerageName: string
  policyHolderName: string
  policyHolderCnpj: string
}>()
</script>

<template>
  <SiDialog v-model="open" :max-width="960" scrollable>
    <SiCard class="si-ci-modal">
      <div class="si-ci-modal__head">
        <div class="si-ci-modal__titles">
          <h2 class="si-ci-modal__title">Limites e taxas por seguradora</h2>
          <span class="si-ci-modal__subtitle">Consulta de crédito do tomador selecionado.</span>
        </div>
        <SiIconButton :icon="'close'" aria-label="Fechar" @click="open = false" />
      </div>

      <div class="si-ci-modal__body">
        <CreditInquiryPanel
          v-if="open"
          mode="embed"
          :brokerage-id="brokerageId"
          :brokerage-name="brokerageName"
          :policy-holder-name="policyHolderName"
          :policy-holder-cnpj="policyHolderCnpj"
        />
      </div>

      <div class="si-ci-modal__foot">
        <SiButton variant="outlined" color="secondary" @click="open = false">Fechar</SiButton>
      </div>
    </SiCard>
  </SiDialog>
</template>

<style scoped>
.si-ci-modal {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.si-ci-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
  padding: var(--si-space-5) var(--si-space-5) var(--si-space-3);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-ci-modal__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.si-ci-modal__title {
  margin: 0;
  font-size: 18px;
  font-weight: var(--si-font-weight-semibold);
}

.si-ci-modal__subtitle {
  font-size: 12.5px;
  color: var(--si-cinza);
}

.si-ci-modal__body {
  overflow-y: auto;
  padding: var(--si-space-5);
}

.si-ci-modal__foot {
  display: flex;
  justify-content: flex-end;
  padding: var(--si-space-3) var(--si-space-5) var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
}

@media (max-width: 640px) {
  .si-ci-modal {
    max-height: 100vh;
    min-height: 100vh;
    border-radius: 0;
  }
}
</style>
