<script setup lang="ts">
/**
 * Listagem de corretoras (ADR-018: componente de domínio, apresentacional).
 * Mobile-first (ADR-017): no desktop renderiza a tabela densa (SiDataTable); no mobile,
 * uma lista de cards empilhados — sem scroll horizontal. Recebe os dados por prop e emite
 * `change-status`; a orquestração (dados, decisão) fica na página.
 */
import type { BrokerageListItem } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { mdiEyeOutline } from '~/lib/icons'
import { getBrokerageStatusAction, getBrokerageStatusView } from '~/lib/status/brokerages'

defineProps<{
  items: BrokerageListItem[]
  loading?: boolean
}>()

const emit = defineEmits<{ 'change-status': [item: BrokerageListItem] }>()

const { mobile } = useDisplay()

const headers = [
  { title: 'CNPJ', key: 'documentNumber' },
  { title: 'Razão social', key: 'name' },
  { title: 'Nome fantasia', key: 'socialName' },
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
    class="si-brokerages-table"
  >
    <template #[`item.documentNumber`]="{ item }">
      {{ formatCnpj(item.documentNumber) }}
    </template>

    <template #[`item.socialName`]="{ item }">
      {{ item.socialName ?? '-' }}
    </template>

    <template #[`item.status`]="{ item }">
      <div class="si-brokerages-table__center">
        <SiChip
          :color="getBrokerageStatusView(item.status).color"
          size="small"
        >
          {{ getBrokerageStatusView(item.status).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="si-brokerages-table__center">
        <SiButton
          :to="`/corretoras/${item.id}`"
          :prepend-icon="mdiEyeOutline"
          size="small"
          variant="tonal"
          color="info"
        >
          Detalhes
        </SiButton>

        <SiButton
          :prepend-icon="getBrokerageStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getBrokerageStatusAction(item.status).color"
          :disabled="getBrokerageStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getBrokerageStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </template>
  </SiDataTable>

  <!-- Mobile: lista de cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-brokerages-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!items.length && !loading"
      class="si-brokerages-cards__empty"
    >
      Nenhuma corretora encontrada.
    </p>

    <SiCard
      v-for="item in items"
      :key="item.id"
      variant="outlined"
      class="si-brokerages-cards__item"
    >
      <div class="si-brokerages-cards__head">
        <span class="si-brokerages-cards__name">{{ item.name }}</span>
        <SiChip
          :color="getBrokerageStatusView(item.status).color"
          size="small"
        >
          {{ getBrokerageStatusView(item.status).label }}
        </SiChip>
      </div>

      <dl class="si-brokerages-cards__facts">
        <div class="si-brokerages-cards__fact">
          <dt>CNPJ</dt>
          <dd>{{ formatCnpj(item.documentNumber) }}</dd>
        </div>
        <div class="si-brokerages-cards__fact">
          <dt>Nome fantasia</dt>
          <dd>{{ item.socialName ?? '-' }}</dd>
        </div>
      </dl>

      <div class="si-brokerages-cards__actions">
        <SiButton
          :to="`/corretoras/${item.id}`"
          :prepend-icon="mdiEyeOutline"
          size="small"
          variant="tonal"
          color="info"
        >
          Detalhes
        </SiButton>

        <SiButton
          :prepend-icon="getBrokerageStatusAction(item.status).icon"
          size="small"
          variant="tonal"
          :color="getBrokerageStatusAction(item.status).color"
          :disabled="getBrokerageStatusAction(item.status).disabled"
          @click="emit('change-status', item)"
        >
          {{ getBrokerageStatusAction(item.status).shortLabel }}
        </SiButton>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-brokerages-table__center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-2);
}

.si-brokerages-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-brokerages-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-brokerages-cards__item {
  padding: var(--si-space-4);
}

.si-brokerages-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-brokerages-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-brokerages-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-4);
}

.si-brokerages-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-brokerages-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-brokerages-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-brokerages-cards__actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-brokerages-cards__actions > * {
  flex: 1 1 0;
}
</style>
