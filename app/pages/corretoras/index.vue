<script setup lang="ts">
import type { BrokerageListItem } from '~/composables/useBrokerages'
import type { BrokerageStatus } from '~/lib/status/brokerages'
import { formatCnpj } from '~/lib/documents'
import { mdiAccountPlusOutline, mdiEyeOutline, mdiRefresh } from '~/lib/icons'
import { brokerageStatusOptions, getBrokerageStatusAction, getBrokerageStatusView } from '~/lib/status/brokerages'

definePageMeta({ layout: 'shell' })

const { listBrokerages, changeBrokerageStatus } = useBrokerages()

const items = ref<BrokerageListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const status = ref<BrokerageStatus | null>(null)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const confirmOpen = ref(false)
const selectedBrokerage = ref<BrokerageListItem | null>(null)
const selectedStatusAction = computed(() =>
  selectedBrokerage.value ? getBrokerageStatusAction(selectedBrokerage.value.status) : null,
)

const headers = [
  { title: 'CNPJ', key: 'documentNumber' },
  { title: 'Razão social', key: 'name' },
  { title: 'Nome fantasia', key: 'socialName' },
  { title: 'Situação', key: 'status', align: 'center' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
] as const

const statusActionLabel = computed(() =>
  selectedStatusAction.value?.label ?? 'Alterar situação da corretora',
)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listBrokerages({ status: status.value })
    items.value = response.items
    totalCount.value = Number(response.totalCount)
  }
  catch {
    error.value = 'Não foi possível carregar as corretoras.'
  }
  finally {
    loading.value = false
  }
}

function openStatusDialog(item: BrokerageListItem) {
  const action = getBrokerageStatusAction(item.status)
  if (action.disabled) return

  selectedBrokerage.value = item
  confirmOpen.value = true
}

async function confirmStatusChange() {
  const action = selectedStatusAction.value
  if (!selectedBrokerage.value || !action?.targetStatus) return

  loading.value = true
  error.value = null
  success.value = null

  try {
    await changeBrokerageStatus(selectedBrokerage.value.id, action.targetStatus)
    success.value = action.successMessage
    confirmOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível alterar a situação da corretora.'
  }
  finally {
    loading.value = false
  }
}

</script>

<template>
  <VContainer class="si-brokerages">
    <div class="si-brokerages__header">
      <h1 class="text-h5">
        Corretoras
      </h1>

      <div class="si-brokerages__header-actions">
        <SiButton
          :prepend-icon="mdiRefresh"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>

        <SiButton
          to="/corretoras/nova"
          :prepend-icon="mdiAccountPlusOutline"
        >
          Nova corretora
        </SiButton>
      </div>
    </div>

    <SiCard
      class="si-brokerages__table-card"
      variant="outlined"
    >
      <div class="si-brokerages__toolbar">
        <div class="si-brokerages__count">
          {{ totalCount }} corretora{{ totalCount === 1 ? '' : 's' }}
        </div>

        <SiSelect
          v-model="status"
          label="Situação"
          :items="brokerageStatusOptions"
          item-title="title"
          item-value="value"
          density="compact"
          class="si-brokerages__filter"
          @update:model-value="refresh"
        />
      </div>

      <SiAlert
        v-if="error"
        type="error"
        class="mx-4 mb-4"
        :text="error"
      />

      <SiAlert
        v-if="success"
        type="success"
        class="mx-4 mb-4"
        :text="success"
      />

      <SiDataTable
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="20"
        density="compact"
        class="si-brokerages__table"
      >
        <template #[`item.documentNumber`]="{ item }">
          {{ formatCnpj(item.documentNumber) }}
        </template>

        <template #[`item.socialName`]="{ item }">
          {{ item.socialName ?? '-' }}
        </template>

        <template #[`item.status`]="{ item }">
          <div class="si-brokerages__status">
            <SiChip
              :color="getBrokerageStatusView(item.status).color"
              size="small"
            >
              {{ getBrokerageStatusView(item.status).label }}
            </SiChip>
          </div>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-brokerages__actions">
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
              @click="openStatusDialog(item)"
            >
              {{ getBrokerageStatusAction(item.status).shortLabel }}
            </SiButton>
          </div>
        </template>
      </SiDataTable>
    </SiCard>

    <SiDialog v-model="confirmOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          {{ statusActionLabel }}
        </h2>

        <p class="mb-5">
          {{ selectedBrokerage?.name }}
        </p>

        <div class="si-brokerages__dialog-actions">
          <SiButton
            variant="text"
            size="small"
            @click="confirmOpen = false"
          >
            Cancelar
          </SiButton>

          <SiButton
            :prepend-icon="selectedStatusAction?.icon"
            :loading="loading"
            :disabled="selectedStatusAction?.disabled"
            size="small"
            @click="confirmStatusChange"
          >
            Confirmar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </VContainer>
</template>

<style scoped>
.si-brokerages {
  max-width: var(--si-container-wide);
}

.si-brokerages__header,
.si-brokerages__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-brokerages__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-brokerages__header h1 {
  margin: 0;
}

.si-brokerages__header-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-brokerages__table-card {
  overflow: hidden;
}

.si-brokerages__toolbar {
  padding: var(--si-space-4);
}

.si-brokerages__filter {
  flex: 0 0 220px;
  max-width: 220px;
  width: 220px;
}

.si-brokerages__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-brokerages__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-brokerages__status,
.si-brokerages__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-2);
}

@media (max-width: 700px) {
  .si-brokerages__header,
  .si-brokerages__toolbar,
  .si-brokerages__header-actions,
  .si-brokerages__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .si-brokerages__filter {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
  }
}
</style>
