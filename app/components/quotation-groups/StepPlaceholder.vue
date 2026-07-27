<script setup lang="ts">
/**
 * Placeholder de etapa do wizard — moldura temporária (exec-plan 0015, incremento 1). Cada etapa
 * real (tomador, segurado, dados de risco, cotações, emissão) substitui este bloco nos incrementos
 * seguintes.
 */
defineProps<{ stepNumber: number, title: string }>()
</script>

<template>
  <SiCard
    variant="outlined"
    class="si-qg-step-ph"
  >
    <SiIcon
      icon="clock"
      :size="28"
      class="si-qg-step-ph__icon"
    />
    <h2 class="text-subtitle-1 si-qg-step-ph__title">
      Etapa {{ stepNumber }} — {{ title }}
    </h2>
    <p class="si-qg-step-ph__text">
      Em construção. Esta etapa será implementada em breve.
    </p>
  </SiCard>
</template>

<style scoped>
.si-qg-step-ph {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--si-space-2);
  min-height: 240px;
  padding: var(--si-space-6);
}

.si-qg-step-ph__icon {
  color: var(--si-cinza);
}

.si-qg-step-ph__title {
  margin: 0;
}

.si-qg-step-ph__text {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}
</style>
