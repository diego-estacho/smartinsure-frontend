<script setup lang="ts">
/**
 * Listagem de Modalidades (ADR-018: componente de domínio, apresentacional).
 * Mobile-first (ADR-017): desktop renderiza a tabela densa (SiDataTable); mobile, uma lista
 * de cards empilhados. Recebe os dados por prop e emite `edit`/`change-status`; a orquestração
 * (dados, decisão) fica na página. Situação por nome estável (ADR-004), nunca por posição.
 */
import type { ModalityListItem } from '~/composables/useModalities'
import { getModalityStatusAction, getModalityStatusView } from '~/lib/status/modalities'

defineProps<{
  items: ModalityListItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'edit': [item: ModalityListItem]
  'change-status': [item: ModalityListItem]
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Nome', key: 'name' },
  { title: 'Descrição', key: 'description' },
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
    class="si-modalities-table"
  >
    <template #[`item.description`]="{ item }">
      {{ item.description ?? '-' }}
    </template>

    <template #[`item.status`]="{ item }">
      <div class="si-modalities-table__center">
        <SiChip
          :color="getModalityStatusView(item.status).color"
          size="small"
        >
          {{ getModalityStatusView(item.status).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="si-modalities-table__center">
        <SiButton
          :prepend-icon="'pencil'"
          size="small"
          variant="tonal"
          color="info"
          @click="emit('edit', item)"
        >
          Editar
        </SiButton>

        <SiButton
          :prepend-icon="getModalityStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getModalityStatusAction(item.status).color"
          :disabled="getModalityStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getModalityStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </template>

    <template #no-data>
      Nenhuma Modalidade encontrada.
    </template>
  </SiDataTable>

  <!-- Mobile: lista de cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-modalities-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!items.length && !loading"
      class="si-modalities-cards__empty"
    >
      Nenhuma Modalidade encontrada.
    </p>

    <SiCard
      v-for="item in items"
      :key="item.id"
      variant="outlined"
      class="si-modalities-cards__item"
    >
      <div class="si-modalities-cards__head">
        <span class="si-modalities-cards__name">{{ item.name }}</span>
        <SiChip
          :color="getModalityStatusView(item.status).color"
          size="small"
        >
          {{ getModalityStatusView(item.status).label }}
        </SiChip>
      </div>

      <dl class="si-modalities-cards__facts">
        <div class="si-modalities-cards__fact">
          <dt>Descrição</dt>
          <dd>{{ item.description ?? '-' }}</dd>
        </div>
      </dl>

      <div class="si-modalities-cards__actions">
        <SiButton
          :prepend-icon="'pencil'"
          size="small"
          variant="tonal"
          color="info"
          @click="emit('edit', item)"
        >
          Editar
        </SiButton>

        <SiButton
          :prepend-icon="getModalityStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getModalityStatusAction(item.status).color"
          :disabled="getModalityStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getModalityStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-modalities-table__center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-2);
}

.si-modalities-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-modalities-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-modalities-cards__item {
  padding: var(--si-space-4);
}

.si-modalities-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-modalities-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-modalities-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-4);
}

.si-modalities-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-modalities-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-modalities-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-modalities-cards__actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-modalities-cards__actions > * {
  flex: 1 1 0;
}
</style>
