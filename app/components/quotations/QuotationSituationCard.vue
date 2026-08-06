<script setup lang="ts">
/**
 * Card de situação do detalhe da Cotação (RN-081): Stepper + Alert do cenário. Só é renderizado onde há
 * jornada de emissão a mostrar (pronta/ccg) — a página decide pelo `view.hasSituationCard`. Read-only:
 * o Stepper não é clicável. No mobile o Stepper é vertical.
 */
import type { QuotationSituationView } from '~/lib/quotations/detailView'

withDefaults(defineProps<{
  view: QuotationSituationView
  orientation?: 'horizontal' | 'vertical'
}>(), { orientation: 'horizontal' })
</script>

<template>
  <SiCard
    variant="outlined"
    class="si-situation"
  >
    <SiStepper
      v-if="view.stepper"
      :steps="view.stepper.steps"
      :current="view.stepper.current"
      :orientation="orientation"
      class="si-situation__stepper"
    />
    <SiAlert
      v-if="view.alert"
      :type="view.alert.type"
      :title="view.alert.title"
      :text="view.alert.text"
      variant="tonal"
    />
  </SiCard>
</template>

<style scoped>
.si-situation {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  padding: var(--si-space-5);
}
</style>
