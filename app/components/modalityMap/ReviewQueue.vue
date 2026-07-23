<script setup lang="ts">
/**
 * Fila de Revisão (RN-037): o recorte de exceções e curadoria evidenciado dentro do Mapa de
 * Modalidades — não é tela separada. Como o vínculo Importada→Modalidade vem pronto pela
 * Modalidade Global (ADR-061), a Fila trata só de curadoria: cada item é uma Modalidade Importada
 * sem Modalidade vinculada (exceção) e a equipe decide: Reatribuir (override manual para uma
 * Modalidade), Ignorar ou Reativar. Apresentacional (ADR-018): emite as intenções; a decisão e a
 * chamada ao backend ficam na página/composable. Ramo por nome estável (ADR-004).
 * Mobile-first (ADR-017): desktop = tabela densa; mobile = cards.
 */
import type { PendingImportedModality } from '~/composables/useModalityMap'
import { getSuretyBranchView } from '~/lib/status/suretyBranches'

defineProps<{
  items: PendingImportedModality[]
  loading?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  'reassign': [item: PendingImportedModality]
  'ignore': [item: PendingImportedModality]
  'restore': [item: PendingImportedModality]
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Nome de origem', key: 'originName' },
  { title: 'Seguradora', key: 'insurerName' },
  { title: 'Grupo importado', key: 'groupName' },
  { title: 'Ramo', key: 'branch', align: 'center' },
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
    class="si-review-queue"
  >
    <template #[`item.branch`]="{ item }">
      <div class="si-review-queue__center">
        <SiChip
          :color="getSuretyBranchView(item.branch).color"
          size="small"
          variant="tonal"
        >
          {{ getSuretyBranchView(item.branch).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="si-review-queue__actions">
        <SiButton
          :prepend-icon="'repeat'"
          size="small"
          variant="tonal"
          color="primary"
          :disabled="busy"
          @click="emit('reassign', item)"
        >
          Reatribuir
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
      Nenhuma pendência na Fila de Revisão.
    </template>
  </SiDataTable>

  <!-- Mobile: cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-review-queue-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!items.length && !loading"
      class="si-review-queue-cards__empty"
    >
      Nenhuma pendência na Fila de Revisão.
    </p>

    <SiCard
      v-for="item in items"
      :key="item.importedModalityId"
      variant="outlined"
      class="si-review-queue-cards__item"
    >
      <div class="si-review-queue-cards__head">
        <span class="si-review-queue-cards__name">{{ item.originName }}</span>
        <SiChip
          :color="getSuretyBranchView(item.branch).color"
          size="small"
          variant="tonal"
        >
          {{ getSuretyBranchView(item.branch).label }}
        </SiChip>
      </div>

      <dl class="si-review-queue-cards__facts">
        <div class="si-review-queue-cards__fact">
          <dt>Seguradora</dt>
          <dd>{{ item.insurerName }}</dd>
        </div>
        <div class="si-review-queue-cards__fact">
          <dt>Grupo importado</dt>
          <dd>{{ item.groupName }}</dd>
        </div>
      </dl>

      <div class="si-review-queue-cards__actions">
        <SiButton
          :prepend-icon="'repeat'"
          size="small"
          variant="tonal"
          color="primary"
          :disabled="busy"
          @click="emit('reassign', item)"
        >
          Reatribuir
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
.si-review-queue__center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-review-queue__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-review-queue-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-review-queue-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-review-queue-cards__item {
  padding: var(--si-space-4);
}

.si-review-queue-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-review-queue-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-review-queue-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-3);
}

.si-review-queue-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-review-queue-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-review-queue-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-review-queue-cards__actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-review-queue-cards__actions > * {
  flex: 1 1 0;
}
</style>
