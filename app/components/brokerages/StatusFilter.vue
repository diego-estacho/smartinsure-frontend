<script setup lang="ts">
/**
 * Filtro por situação da corretora (ADR-018: componente de domínio, apresentacional).
 * Contrato: v-model da situação selecionada; a página reage à mudança e recarrega a lista.
 */
import type { BrokerageStatus } from '~/lib/status/brokerages'
import { brokerageStatusOptions } from '~/lib/status/brokerages'

const model = defineModel<BrokerageStatus | null>()
</script>

<template>
  <SiSelect
    v-model="model"
    label="Situação"
    :items="brokerageStatusOptions"
    item-title="title"
    item-value="value"
    density="compact"
    class="si-brokerages-filter"
  />
</template>

<style scoped>
/* Mobile-first (ADR-017): largura cheia por padrão; fixa 220px a partir de sm (>= 600px). */
.si-brokerages-filter {
  width: 100%;
}

@media (min-width: 600px) {
  .si-brokerages-filter {
    flex: 0 0 220px;
    max-width: 220px;
  }
}
</style>
