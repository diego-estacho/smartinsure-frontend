<script setup lang="ts">
import type { GetBrokerageResponse } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { mdiArrowLeft } from '~/lib/icons'
import { getBrokerageStatusAction, getBrokerageStatusView } from '~/lib/status/brokerages'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getBrokerage, changeBrokerageStatus } = useBrokerages()

const brokerage = ref<GetBrokerageResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const confirmOpen = ref(false)
const statusAction = computed(() =>
  brokerage.value ? getBrokerageStatusAction(brokerage.value.status) : null,
)

const statusActionLabel = computed(() =>
  statusAction.value?.label ?? 'Alterar situação da corretora',
)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    brokerage.value = await getBrokerage(String(route.params.id))
  }
  catch {
    error.value = 'Não foi possível carregar a corretora.'
  }
  finally {
    loading.value = false
  }
}

function openStatusDialog() {
  if (!brokerage.value) return
  if (statusAction.value?.disabled) return

  confirmOpen.value = true
}

async function confirmStatusChange() {
  const action = statusAction.value
  if (!brokerage.value || !action?.targetStatus) return

  loading.value = true
  error.value = null
  success.value = null

  try {
    await changeBrokerageStatus(brokerage.value.id, action.targetStatus)
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

function sectorLabel(value: boolean | null) {
  if (value === null) return '-'
  return value ? 'Privado' : 'Público'
}

function formatAddress(address: GetBrokerageResponse['mainAddress']) {
  if (!address) return '-'
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode,
  ].filter(Boolean).join(' · ')
}
</script>

<template>
  <VContainer class="si-brokerage-detail">
    <div class="si-brokerage-detail__header">
      <h1 class="text-h5">
        {{ brokerage?.name ?? 'Corretora' }}
      </h1>

    </div>

    <div class="si-brokerage-detail__actions-row">
      <div class="si-brokerage-detail__actions">
        <SiButton
          to="/corretoras"
          variant="outlined"
          color="secondary"
          :prepend-icon="mdiArrowLeft"
        >
          Voltar
        </SiButton>

        <SiButton
          v-if="brokerage"
          :prepend-icon="statusAction?.icon"
          :color="statusAction?.color"
          :disabled="statusAction?.disabled"
          @click="openStatusDialog"
        >
          {{ statusAction?.shortLabel }}
        </SiButton>
      </div>
    </div>

    <SiAlert
      v-if="error"
      type="error"
      class="mb-4"
      :text="error"
    />

    <SiAlert
      v-if="success"
      type="success"
      class="mb-4"
      :text="success"
    />

    <SiCard
      v-if="brokerage"
      class="pa-5"
    >
      <dl class="si-brokerage-detail__grid">
        <div>
          <dt>CNPJ</dt>
          <dd>{{ formatCnpj(brokerage.documentNumber) }}</dd>
        </div>
        <div>
          <dt>Razão social</dt>
          <dd>{{ brokerage.name }}</dd>
        </div>
        <div>
          <dt>Nome fantasia</dt>
          <dd>{{ brokerage.socialName ?? '-' }}</dd>
        </div>
        <div>
          <dt>Natureza Jurídica</dt>
          <dd>{{ brokerage.legalNatureName ?? '-' }}</dd>
        </div>
        <div>
          <dt>Código da Natureza Jurídica</dt>
          <dd>{{ brokerage.legalNatureCode ?? '-' }}</dd>
        </div>
        <div>
          <dt>Setor</dt>
          <dd>{{ sectorLabel(brokerage.isPrivateSector) }}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            <SiChip
              :color="getBrokerageStatusView(brokerage.status).color"
              size="small"
            >
              {{ getBrokerageStatusView(brokerage.status).label }}
            </SiChip>
          </dd>
        </div>
        <div class="si-brokerage-detail__address">
          <dt>Endereço principal</dt>
          <dd>{{ formatAddress(brokerage.mainAddress) }}</dd>
        </div>
      </dl>
    </SiCard>

    <SiDialog v-model="confirmOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          {{ statusActionLabel }}
        </h2>

        <p class="mb-5">
          {{ brokerage?.name }}
        </p>

        <div class="si-brokerage-detail__dialog-actions">
          <SiButton
            variant="text"
            @click="confirmOpen = false"
          >
            Cancelar
          </SiButton>

          <SiButton
            :prepend-icon="statusAction?.icon"
            :loading="loading"
            :disabled="statusAction?.disabled"
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
.si-brokerage-detail {
  max-width: var(--si-container-wide);
}

.si-brokerage-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-block: var(--si-space-6) var(--si-space-2);
}

.si-brokerage-detail__header h1 {
  margin: 0;
}

.si-brokerage-detail__actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--si-space-3);
}

.si-brokerage-detail__actions,
.si-brokerage-detail__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-brokerage-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-4);
  margin: 0;
}

.si-brokerage-detail__grid div {
  display: grid;
  gap: var(--si-space-1);
}

.si-brokerage-detail__grid dt {
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: var(--si-fs-caption);
}

.si-brokerage-detail__grid dd {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
}

.si-brokerage-detail__address {
  grid-column: 1 / -1;
}

@media (max-width: 700px) {
  .si-brokerage-detail__header,
  .si-brokerage-detail__actions-row,
  .si-brokerage-detail__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .si-brokerage-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
