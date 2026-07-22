<script setup lang="ts">
/**
 * Listagem de Grupos de Modalidade (ADR-018: componente de domínio, apresentacional).
 * Mobile-first (ADR-017): desktop renderiza a tabela densa (SiDataTable); mobile, uma lista
 * de cards empilhados. Recebe os dados por prop e emite `edit`/`change-status`; a orquestração
 * (dados, decisão) fica na página. Situação por nome estável (ADR-004), nunca por posição.
 */
import type { ModalityGroupListItem } from '~/composables/useModalityGroups'
import { mdiPencilOutline } from '~/lib/icons'
import { getModalityGroupStatusAction, getModalityGroupStatusView } from '~/lib/status/modality-groups'

defineProps<{
  items: ModalityGroupListItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'edit': [item: ModalityGroupListItem]
  'change-status': [item: ModalityGroupListItem]
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Nome', key: 'name' },
  { title: 'Descrição', key: 'description' },
  { title: 'Ordem de exibição', key: 'displayOrder', align: 'center' },
  { title: 'Situação', key: 'status', align: 'center' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
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
    class="si-modality-groups-table"
  >
    <template #[`item.description`]="{ item }">
      {{ item.description ?? '-' }}
    </template>

    <template #[`item.displayOrder`]="{ item }">
      <div class="si-modality-groups-table__center">
        {{ item.displayOrder }}
      </div>
    </template>

    <template #[`item.status`]="{ item }">
      <div class="si-modality-groups-table__center">
        <SiChip
          :color="getModalityGroupStatusView(item.status).color"
          size="small"
        >
          {{ getModalityGroupStatusView(item.status).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="si-modality-groups-table__center">
        <SiButton
          :prepend-icon="mdiPencilOutline"
          size="small"
          variant="tonal"
          color="info"
          @click="emit('edit', item)"
        >
          Editar
        </SiButton>

        <SiButton
          :prepend-icon="getModalityGroupStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getModalityGroupStatusAction(item.status).color"
          :disabled="getModalityGroupStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getModalityGroupStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </template>

    <template #no-data>
      Nenhum Grupo de Modalidade encontrado.
    </template>
  </SiDataTable>

  <!-- Mobile: lista de cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-modality-groups-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!items.length && !loading"
      class="si-modality-groups-cards__empty"
    >
      Nenhum Grupo de Modalidade encontrado.
    </p>

    <SiCard
      v-for="item in items"
      :key="item.id"
      variant="outlined"
      class="si-modality-groups-cards__item"
    >
      <div class="si-modality-groups-cards__head">
        <span class="si-modality-groups-cards__name">{{ item.name }}</span>
        <SiChip
          :color="getModalityGroupStatusView(item.status).color"
          size="small"
        >
          {{ getModalityGroupStatusView(item.status).label }}
        </SiChip>
      </div>

      <dl class="si-modality-groups-cards__facts">
        <div class="si-modality-groups-cards__fact">
          <dt>Descrição</dt>
          <dd>{{ item.description ?? '-' }}</dd>
        </div>
        <div class="si-modality-groups-cards__fact">
          <dt>Ordem de exibição</dt>
          <dd>{{ item.displayOrder }}</dd>
        </div>
      </dl>

      <div class="si-modality-groups-cards__actions">
        <SiButton
          :prepend-icon="mdiPencilOutline"
          size="small"
          variant="tonal"
          color="info"
          @click="emit('edit', item)"
        >
          Editar
        </SiButton>

        <SiButton
          :prepend-icon="getModalityGroupStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getModalityGroupStatusAction(item.status).color"
          :disabled="getModalityGroupStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getModalityGroupStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-modality-groups-table__center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-2);
}

.si-modality-groups-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-modality-groups-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-modality-groups-cards__item {
  padding: var(--si-space-4);
}

.si-modality-groups-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-modality-groups-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-modality-groups-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-4);
}

.si-modality-groups-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-modality-groups-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-modality-groups-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-modality-groups-cards__actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-modality-groups-cards__actions > * {
  flex: 1 1 0;
}
</style>
