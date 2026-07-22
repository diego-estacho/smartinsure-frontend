<script setup lang="ts">
/**
 * Filtro de situação da Modalidade (ADR-018: componente de domínio, apresentacional).
 * O contrato expõe includeInactive (boolean), não um filtro por situação (ADR-004); o v-model
 * é esse booleano. A página reage à mudança e recarrega a lista.
 */
import { modalityFilterOptions } from '~/lib/status/modalities'

const model = defineModel<boolean>()
</script>

<template>
  <SiSelect
    v-model="model"
    label="Situação"
    :items="modalityFilterOptions"
    item-title="title"
    item-value="value"
    density="compact"
    class="si-modalities-filter"
  />
</template>

<style scoped>
/* Mobile-first (ADR-017): largura cheia por padrão; fixa 220px a partir de sm (>= 600px). */
.si-modalities-filter {
  width: 100%;
}

@media (min-width: 600px) {
  .si-modalities-filter {
    flex: 0 0 220px;
    max-width: 220px;
  }
}
</style>
