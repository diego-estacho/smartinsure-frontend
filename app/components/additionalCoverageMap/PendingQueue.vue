<script setup lang="ts">
/**
 * Fila de pendências de mapeamento (RN-043): as Coberturas Adicionais Importadas Ativas sem vínculo
 * — evidentes na curadoria. Diferente do Mapa de Modalidades, NÃO há feature-flag ocultando esta
 * fila: o vínculo é manual e as pendências são o fluxo normal. Cada item é uma Cobertura Adicional
 * Importada e o Administrador decide: Vincular (escolher a canônica alvo), Ignorar ou Reativar (desfaz
 * o ignorar). Apresentacional (ADR-018): emite as intenções; a decisão e a chamada ao backend ficam
 * na página/composable. Mobile-first (ADR-017): desktop = tabela densa; mobile = cards.
 */
import type { PendingCoverageItem } from '~/composables/useAdditionalCoverageMap'

defineProps<{
  items: PendingCoverageItem[]
  loading?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  'link': [item: PendingCoverageItem]
  'ignore': [item: PendingCoverageItem]
  'restore': [item: PendingCoverageItem]
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Cobertura de origem', key: 'coverageName' },
  { title: 'Seguradora', key: 'insurerName' },
  { title: 'Modalidade Importada', key: 'modalityName' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
] as const
</script>

<template>
  <!-- Desktop: tabela densa -->
  <SiDataTable
    v-if="!mobile"
    :headers="headers"
    :items="items"
    :loading="loading"
    :items-per-page="20"
    density="compact"
    class="si-coverage-pending-queue"
  >
    <template #[`item.actions`]="{ item }">
      <div class="si-coverage-pending-queue__actions">
        <SiButton
          :prepend-icon="'plus'"
          size="small"
          variant="tonal"
          color="primary"
          :disabled="busy"
          @click="emit('link', item)"
        >
          Vincular
        </SiButton>

        <SiButton
          :prepend-icon="'eyeOff'"
          size="small"
          variant="tonal"
          color="secondary"
          :disabled="busy"
          @click="emit('ignore', item)"
        >
          Ignorar
        </SiButton>

        <SiButton
          :prepend-icon="'eye'"
          size="small"
          variant="tonal"
          color="info"
          :disabled="busy"
          @click="emit('restore', item)"
        >
          Reativar
        </SiButton>
      </div>
    </template>

    <template #no-data>
      Nenhuma Cobertura Adicional Importada pendente de mapeamento.
    </template>
  </SiDataTable>

  <!-- Mobile: cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-coverage-pending-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!items.length && !loading"
      class="si-coverage-pending-cards__empty"
    >
      Nenhuma Cobertura Adicional Importada pendente de mapeamento.
    </p>

    <SiCard
      v-for="item in items"
      :key="item.id"
      variant="outlined"
      class="si-coverage-pending-cards__item"
    >
      <div class="si-coverage-pending-cards__head">
        <span class="si-coverage-pending-cards__name">{{ item.coverageName }}</span>
      </div>

      <dl class="si-coverage-pending-cards__facts">
        <div class="si-coverage-pending-cards__fact">
          <dt>Seguradora</dt>
          <dd>{{ item.insurerName }}</dd>
        </div>
        <div class="si-coverage-pending-cards__fact">
          <dt>Modalidade Importada</dt>
          <dd>{{ item.modalityName }}</dd>
        </div>
      </dl>

      <div class="si-coverage-pending-cards__actions">
        <SiButton
          :prepend-icon="'plus'"
          size="small"
          variant="tonal"
          color="primary"
          :disabled="busy"
          @click="emit('link', item)"
        >
          Vincular
        </SiButton>

        <SiButton
          :prepend-icon="'eyeOff'"
          size="small"
          variant="tonal"
          color="secondary"
          :disabled="busy"
          @click="emit('ignore', item)"
        >
          Ignorar
        </SiButton>

        <SiButton
          :prepend-icon="'eye'"
          size="small"
          variant="tonal"
          color="info"
          :disabled="busy"
          @click="emit('restore', item)"
        >
          Reativar
        </SiButton>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-coverage-pending-queue__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-coverage-pending-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-coverage-pending-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-coverage-pending-cards__item {
  padding: var(--si-space-4);
}

.si-coverage-pending-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-coverage-pending-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-coverage-pending-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-3);
}

.si-coverage-pending-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-coverage-pending-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-coverage-pending-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-coverage-pending-cards__actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-coverage-pending-cards__actions > * {
  flex: 1 1 0;
}
</style>
