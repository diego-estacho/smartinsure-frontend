<script setup lang="ts">
/**
 * Corretoras — listagem (RN de corretoras). Página orquestradora fina (ADR-018): mantém o
 * estado de tela, chama o composable de dados e compõe os componentes de domínio
 * (filtro, tabela responsiva, dialog de situação). Sem markup denso aqui.
 */
import type { BrokerageListItem } from '~/composables/useBrokerages'
import type { BrokerageStatus } from '~/lib/status/brokerages'
import { getBrokerageStatusAction } from '~/lib/status/brokerages'

definePageMeta({ layout: 'shell' })

const { listBrokerages, changeBrokerageStatus } = useBrokerages()

const items = ref<BrokerageListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const status = ref<BrokerageStatus | null>(null)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const dialogOpen = ref(false)
const selectedBrokerage = ref<BrokerageListItem | null>(null)

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
  if (getBrokerageStatusAction(item.status).disabled) return

  selectedBrokerage.value = item
  dialogOpen.value = true
}

async function confirmStatusChange() {
  const brokerage = selectedBrokerage.value
  const action = brokerage ? getBrokerageStatusAction(brokerage.status) : null
  if (!brokerage || !action?.targetStatus) return

  loading.value = true
  error.value = null
  success.value = null

  try {
    await changeBrokerageStatus(brokerage.id, action.targetStatus)
    success.value = action.successMessage
    dialogOpen.value = false
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
          :prepend-icon="'refresh'"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>

        <SiButton
          to="/corretoras/nova"
          :prepend-icon="'userPlus'"
        >
          Nova corretora
        </SiButton>
      </div>
    </div>

    <!-- Toolbar (contagem + filtro) fora do card, acima da tabela. O filtro é provisório —
         vira um componente de filtro dedicado depois. -->
    <div class="si-brokerages__toolbar">
      <div class="si-brokerages__count">
        {{ totalCount }} corretora{{ totalCount === 1 ? '' : 's' }}
      </div>

      <BrokeragesStatusFilter
        v-model="status"
        @update:model-value="refresh"
      />
    </div>

    <SiCard
      class="si-brokerages__card"
      variant="outlined"
    >
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

      <BrokeragesTable
        :items="items"
        :loading="loading"
        @change-status="openStatusDialog"
      />
    </SiCard>

    <BrokeragesStatusChangeDialog
      v-model="dialogOpen"
      :brokerage="selectedBrokerage"
      :loading="loading"
      @confirm="confirmStatusChange"
    />
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

.si-brokerages__card {
  overflow: hidden;
}

.si-brokerages__toolbar {
  margin-bottom: var(--si-space-3);
}

.si-brokerages__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

/* Mobile-first (ADR-017): header e toolbar empilham no xs; ficam em linha a partir de sm. */
@media (max-width: 599.98px) {
  .si-brokerages__header,
  .si-brokerages__toolbar,
  .si-brokerages__header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
