<script setup lang="ts">
import type { GetBrokerageResponse } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { mdiDotsVertical, mdiPlus } from '~/lib/icons'
import { getBrokerageStatusAction, getBrokerageStatusView } from '~/lib/status/brokerages'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getBrokerage, changeBrokerageStatus } = useBrokerages()

const brokerage = ref<GetBrokerageResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const confirmOpen = ref(false)
const tab = ref('habilitacoes')
const enablementsPanel = ref<{ openCreateDialog: () => void } | null>(null)

const statusAction = computed(() =>
  brokerage.value ? getBrokerageStatusAction(brokerage.value.status) : null,
)

const statusActionLabel = computed(() =>
  statusAction.value?.label ?? 'Alterar situação da corretora',
)

/** Fatos rápidos da faixa de contexto — só o que existe no cadastro. */
const quickFacts = computed(() => {
  if (!brokerage.value) return []

  return [
    `CNPJ ${formatCnpj(brokerage.value.documentNumber)}`,
    sectorLabel(brokerage.value.isPrivateSector) !== '-'
      ? `Setor ${sectorLabel(brokerage.value.isPrivateSector).toLowerCase()}`
      : null,
    brokerage.value.legalNatureName,
  ].filter((fact): fact is string => Boolean(fact))
})

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

function openEnablementDialog() {
  tab.value = 'habilitacoes'
  enablementsPanel.value?.openCreateDialog()
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
  <div class="si-brokerage-detail">
    <header class="si-brokerage-detail__hero">
      <VContainer class="si-brokerage-detail__hero-inner">
        <nav
          class="si-brokerage-detail__breadcrumb"
          aria-label="Trilha de navegação"
        >
          <NuxtLink to="/corretoras">
            Corretoras
          </NuxtLink>
          <span aria-hidden="true">/</span>
          <span>Detalhe</span>
        </nav>

        <div class="si-brokerage-detail__hero-row">
          <div class="si-brokerage-detail__identity">
            <div class="si-brokerage-detail__title">
              <h1 class="text-h5">
                {{ brokerage?.name ?? 'Corretora' }}
              </h1>

              <SiChip
                v-if="brokerage"
                :color="getBrokerageStatusView(brokerage.status).color"
                size="small"
              >
                {{ getBrokerageStatusView(brokerage.status).label }}
              </SiChip>
            </div>

            <p
              v-if="quickFacts.length"
              class="si-brokerage-detail__facts"
            >
              <template
                v-for="(fact, index) in quickFacts"
                :key="fact"
              >
                <span
                  v-if="index > 0"
                  aria-hidden="true"
                  class="si-brokerage-detail__facts-separator"
                >·</span>
                <span>{{ fact }}</span>
              </template>
            </p>
          </div>

          <div class="si-brokerage-detail__hero-actions">
            <SiButton
              :prepend-icon="mdiPlus"
              @click="openEnablementDialog"
            >
              Habilitar seguradora
            </SiButton>

            <VMenu>
              <template #activator="{ props: menuProps }">
                <SiButton
                  v-bind="menuProps"
                  variant="outlined"
                  color="secondary"
                  icon
                  aria-label="Mais ações"
                >
                  <SiIcon :icon="mdiDotsVertical" />
                </SiButton>
              </template>

              <VList density="compact">
                <VListItem
                  :disabled="statusAction?.disabled"
                  @click="openStatusDialog"
                >
                  <VListItemTitle>{{ statusAction?.label }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </div>
        </div>

        <SiTabs
          v-model="tab"
          class="si-brokerage-detail__tabs"
        >
          <SiTab
            value="visao-geral"
            text="Visão geral"
          />
          <SiTab
            value="habilitacoes"
            text="Habilitações de Seguradora"
          />
        </SiTabs>
      </VContainer>
    </header>

    <VContainer class="si-brokerage-detail__content">
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

      <VTabsWindow v-model="tab">
        <VTabsWindowItem value="visao-geral">
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
              <div class="si-brokerage-detail__address">
                <dt>Endereço principal</dt>
                <dd>{{ formatAddress(brokerage.mainAddress) }}</dd>
              </div>
            </dl>
          </SiCard>
        </VTabsWindowItem>

        <VTabsWindowItem value="habilitacoes">
          <BrokeragesInsurerEnablementsPanel
            v-if="brokerage"
            ref="enablementsPanel"
            :brokerage-id="brokerage.id"
            hide-toolbar
          />
        </VTabsWindowItem>
      </VTabsWindow>
    </VContainer>

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
            :color="statusAction?.color"
            :loading="loading"
            :disabled="statusAction?.disabled"
            @click="confirmStatusChange"
          >
            Confirmar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </div>
</template>

<style scoped>
/* Faixa de contexto (direção C): fundo de superfície + hairline inferior. */
.si-brokerage-detail__hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-brokerage-detail__hero-inner,
.si-brokerage-detail__content {
  max-width: var(--si-container-wide);
}

.si-brokerage-detail__hero-inner {
  padding-block: var(--si-space-4) 0;
}

.si-brokerage-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  margin-bottom: var(--si-space-3);
}

.si-brokerage-detail__breadcrumb a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.si-brokerage-detail__breadcrumb a:hover {
  text-decoration: underline;
}

.si-brokerage-detail__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-brokerage-detail__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-brokerage-detail__title h1 {
  margin: 0;
}

.si-brokerage-detail__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  margin: var(--si-space-2) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-brokerage-detail__facts-separator {
  color: var(--si-cinza-claro);
}

.si-brokerage-detail__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-brokerage-detail__tabs {
  margin-top: var(--si-space-4);
}

.si-brokerage-detail__content {
  padding-block: var(--si-space-5);
}

.si-brokerage-detail__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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

.si-brokerage-detail__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

/* Mobile: hero empilha, ações viram linha própria, grid vira coluna única. */
@media (max-width: 900px) {
  .si-brokerage-detail__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .si-brokerage-detail__hero-row {
    flex-direction: column;
    align-items: stretch;
  }

  .si-brokerage-detail__hero-actions {
    justify-content: stretch;
  }

  .si-brokerage-detail__hero-actions > :first-child {
    flex: 1;
  }

  .si-brokerage-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
