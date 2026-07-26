<script setup lang="ts">
/**
 * Detalhe da Corretora (RN-020). Página fina (ADR-018): hero com identidade + situação + ações,
 * alerta de cadastro incompleto (RN-053) e abas Visão geral / Habilitações / Produção / Histórico.
 * Produção fica em estado vazio honesto (TD-006); Histórico é real (RN-055).
 */
import type { GetBrokerageResponse } from '~/composables/useBrokerages'
import { formatCnpj } from '~/lib/documents'
import { getBrokerageSituationAction, getBrokerageSituationView } from '~/lib/status/brokerages'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getBrokerage, changeBrokerageStatus } = useBrokerages()

const brokerage = ref<GetBrokerageResponse | null>(null)
const error = ref<string | null>(null)
const tab = ref('visao-geral')
const editOpen = ref(false)
const inactivateOpen = ref(false)
const busy = ref(false)
const toast = ref('')
const enablementsPanel = ref<{ openCreateDialog: () => void } | null>(null)

const situation = computed(() => brokerage.value?.situation ?? '')
const situationView = computed(() => getBrokerageSituationView(situation.value))
const situationAction = computed(() => getBrokerageSituationAction(situation.value))
const isIncomplete = computed(() => situation.value === 'Incomplete')

const meta = computed(() => {
  if (!brokerage.value) return []
  return [
    `CNPJ ${formatCnpj(brokerage.value.documentNumber)}`,
    sectorLabel(brokerage.value.isPrivateSector) !== '—'
      ? `Setor ${sectorLabel(brokerage.value.isPrivateSector).toLowerCase()}`
      : null,
    brokerage.value.legalNatureName,
  ].filter((v): v is string => Boolean(v))
})

const productionMetrics = [
  { label: 'Taxa de conversão' },
  { label: 'Prêmio médio' },
  { label: 'Tempo médio' },
  { label: 'Sinistros abertos' },
]

await refresh()

async function refresh() {
  error.value = null
  try {
    brokerage.value = await getBrokerage(String(route.params.id))
  }
  catch {
    error.value = 'Não foi possível carregar a corretora.'
  }
}

function initials() {
  const source = brokerage.value?.name ?? ''
  return source.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function openHabilitar() {
  tab.value = 'habilitacoes'
  nextTick(() => enablementsPanel.value?.openCreateDialog())
}

function onEdited(updated: GetBrokerageResponse) {
  brokerage.value = updated
  toast.value = 'Dados atualizados.'
}

function exportBrokerage() {
  // TODO(AB#): exportação de dados da corretora ainda sem endpoint (RN a definir).
  toast.value = 'Exportação disponível em breve.'
}

async function confirmInactivate() {
  if (!brokerage.value) return
  busy.value = true
  try {
    await changeBrokerageStatus(brokerage.value.id, situationAction.value.targetStatus)
    toast.value = situationAction.value.successMessage
    inactivateOpen.value = false
    await refresh()
  }
  catch {
    toast.value = 'Não foi possível alterar a situação da corretora.'
  }
  finally {
    busy.value = false
  }
}

function sectorLabel(value: boolean | null) {
  if (value === null) return '—'
  return value ? 'Privado' : 'Público'
}

function dash(value: string | null | undefined) {
  return value || '—'
}

function formatAddress(address: GetBrokerageResponse['mainAddress']) {
  if (!address) return '—'
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode,
  ].filter(Boolean).join(' · ') || '—'
}
</script>

<template>
  <div class="si-detail">
    <header class="si-detail__hero">
      <VContainer class="si-detail__hero-inner">
        <SiPageBack
          to="/corretoras"
          parent-label="Corretoras"
          :current="brokerage?.name ?? 'Detalhe'"
          class="mb-3"
        />

        <div class="si-detail__hero-row">
          <div class="si-detail__identity">
            <SiAvatar
              size="lg"
              rounded="lg"
              color="charcoal"
              class="si-detail__avatar"
            >
              {{ initials() }}
            </SiAvatar>
            <div>
              <div class="si-detail__title">
                <h1 class="si-detail__name">
                  {{ brokerage?.name ?? 'Corretora' }}
                </h1>
                <SiChip
                  v-if="brokerage"
                  :color="situationView.color"
                  size="small"
                >
                  {{ situationView.label }}
                </SiChip>
              </div>
              <p
                v-if="meta.length"
                class="si-detail__meta"
              >
                {{ meta.join(' · ') }}
              </p>
            </div>
          </div>

          <div class="si-detail__actions">
            <SiButton
              variant="outlined"
              color="secondary"
              :prepend-icon="'pencil'"
              @click="editOpen = true"
            >
              Editar dados
            </SiButton>
            <SiButton
              :prepend-icon="'plus'"
              @click="openHabilitar"
            >
              Habilitar seguradora
            </SiButton>
            <SiMenu location="bottom end">
              <template #activator="{ props: menuProps }">
                <SiIconButton
                  v-bind="menuProps"
                  icon="dotsVertical"
                  aria-label="Mais ações"
                />
              </template>
              <SiList
                density="compact"
                class="si-rowmenu"
              >
                <SiListItem
                  title="Editar dados cadastrais"
                  @click="editOpen = true"
                />
                <SiListItem
                  title="Exportar dados da corretora"
                  @click="exportBrokerage"
                />
                <SiListItem
                  title="Inativar corretora"
                  class="si-rowmenu__danger"
                  @click="inactivateOpen = true"
                />
              </SiList>
            </SiMenu>
          </div>
        </div>

        <SiTabs
          v-model="tab"
          class="si-detail__tabs"
        >
          <SiTab
            value="visao-geral"
            text="Visão geral"
          />
          <SiTab
            value="habilitacoes"
            text="Habilitações"
            :count="brokerage?.enabledInsurerCount ?? 0"
          />
          <SiTab
            value="producao"
            text="Produção"
          />
          <SiTab
            value="historico"
            text="Histórico"
          />
        </SiTabs>
      </VContainer>
    </header>

    <VContainer class="si-detail__content">
      <SiAlert
        v-if="error"
        type="error"
        class="mb-4"
        :text="error"
      />

      <SiAlert
        v-if="isIncomplete"
        type="warning"
        title="Cadastro incompleto"
        text="Faltam nome fantasia e contato. Complete os dados para liberar a corretora para cotação."
        class="mb-5"
      />

      <VTabsWindow
        v-if="brokerage"
        v-model="tab"
      >
        <!-- Visão geral -->
        <VTabsWindowItem value="visao-geral">
          <div class="si-detail__metrics">
            <SiMetric
              label="Seguradoras"
              :value="brokerage.enabledInsurerCount"
              hint="habilitadas"
            />
            <SiMetric
              label="Cotações (30d)"
              empty
              hint="sem dados ainda"
            />
            <SiMetric
              label="Apólices ativas"
              empty
              hint="sem dados ainda"
            />
            <SiMetric
              label="Prêmio emitido"
              empty
              hint="sem dados ainda"
            />
          </div>

          <div class="si-detail__cards">
            <SiCard variant="outlined">
              <div class="si-detail__card-header">
                Dados cadastrais
              </div>
              <dl class="si-detail__grid">
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
                  <dd>{{ dash(brokerage.socialName) }}</dd>
                </div>
                <div>
                  <dt>Natureza jurídica</dt>
                  <dd>{{ dash(brokerage.legalNatureName) }}</dd>
                </div>
                <div>
                  <dt>Setor</dt>
                  <dd>{{ sectorLabel(brokerage.isPrivateSector) }}</dd>
                </div>
                <div class="si-detail__span-all">
                  <dt>Endereço principal</dt>
                  <dd>{{ formatAddress(brokerage.mainAddress) }}</dd>
                </div>
              </dl>
            </SiCard>

            <SiCard variant="outlined">
              <div class="si-detail__card-header">
                Contato e responsável
              </div>
              <dl class="si-detail__grid si-detail__grid--single">
                <div>
                  <dt>E-mail</dt>
                  <dd>{{ dash(brokerage.contactEmail) }}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{{ dash(brokerage.contactPhone) }}</dd>
                </div>
                <div>
                  <dt>Responsável</dt>
                  <dd>{{ dash(brokerage.responsibleName) }}</dd>
                </div>
              </dl>
            </SiCard>
          </div>
        </VTabsWindowItem>

        <!-- Habilitações -->
        <VTabsWindowItem value="habilitacoes">
          <BrokeragesInsurerEnablementsPanel
            ref="enablementsPanel"
            :brokerage-id="brokerage.id"
            hide-toolbar
          />
        </VTabsWindowItem>

        <!-- Produção: estado vazio honesto (TD-006) -->
        <VTabsWindowItem value="producao">
          <div class="si-detail__metrics">
            <SiMetric
              v-for="metric in productionMetrics"
              :key="metric.label"
              :label="metric.label"
              empty
            />
          </div>
          <SiCard
            variant="outlined"
            class="si-detail__empty-production"
          >
            <div class="si-detail__empty-icon">
              <SiIcon :icon="'barChart'" />
            </div>
            <h2 class="si-detail__empty-title">
              Sem dados de produção ainda
            </h2>
            <p class="si-detail__empty-text">
              Os indicadores de produção aparecem aqui quando a corretora começar a cotar e emitir
              pela plataforma.
            </p>
          </SiCard>
        </VTabsWindowItem>

        <!-- Histórico: real (RN-055) -->
        <VTabsWindowItem value="historico">
          <SiCard
            variant="outlined"
            class="pa-5"
          >
            <BrokeragesHistoryTab :brokerage-id="brokerage.id" />
          </SiCard>
        </VTabsWindowItem>
      </VTabsWindow>
    </VContainer>

    <BrokeragesEditDialog
      v-if="brokerage"
      v-model="editOpen"
      :brokerage="brokerage"
      @updated="onEdited"
    />

    <SiDialog
      v-model="inactivateOpen"
      :max-width="440"
    >
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          {{ situationAction.confirmTitle }}
        </h2>
        <p class="mb-5">
          {{ situationAction.confirmText }}
        </p>
        <div class="si-detail__dialog-actions">
          <SiButton
            variant="text"
            @click="inactivateOpen = false"
          >
            Cancelar
          </SiButton>
          <SiButton
            :color="situationAction.color"
            :loading="busy"
            @click="confirmInactivate"
          >
            {{ situationAction.label.split(' ')[0] }}
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>

    <SiSnackbar
      :model-value="Boolean(toast)"
      @update:model-value="(v) => { if (!v) toast = '' }"
    >
      {{ toast }}
    </SiSnackbar>
  </div>
</template>

<style scoped>
.si-detail__hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-detail__hero-inner,
.si-detail__content {
  max-width: var(--si-container-wide);
}

.si-detail__hero-inner {
  padding-block: var(--si-space-4) 0;
}

.si-detail__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-top: var(--si-space-3);
}

.si-detail__identity {
  display: flex;
  gap: var(--si-space-4);
  min-width: 0;
}

.si-detail__avatar {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--si-font-weight-bold);
  flex-shrink: 0;
}

.si-detail__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-detail__name {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.02em;
  font-weight: var(--si-font-weight-semibold);
}

.si-detail__meta {
  margin: var(--si-space-1) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-detail__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-detail__tabs {
  margin-top: var(--si-space-4);
}

.si-detail__content {
  padding-block: var(--si-space-5);
}

.si-detail__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--si-space-4);
  margin-bottom: var(--si-space-4);
}

.si-detail__cards {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: var(--si-space-4);
}

.si-detail__card-header {
  padding: var(--si-space-4) var(--si-space-5);
  border-bottom: 1px solid var(--si-cinza-claro);
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-4);
  margin: 0;
  padding: var(--si-space-5);
}

.si-detail__grid--single {
  grid-template-columns: 1fr;
}

.si-detail__grid div {
  display: grid;
  gap: var(--si-space-1);
}

.si-detail__grid dt {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-detail__grid dd {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
}

.si-detail__span-all {
  grid-column: 1 / -1;
}

.si-detail__empty-production {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-2);
  padding: 48px 24px;
}

.si-detail__empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--si-radius-pill);
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

.si-detail__empty-title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-detail__empty-text {
  margin: 0;
  max-width: 420px;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-detail__dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-rowmenu__danger :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
}

@media (max-width: 900px) {
  .si-detail__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .si-detail__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .si-detail__hero-row {
    flex-direction: column;
    align-items: stretch;
  }

  /* Ações do hero ocupam a largura no mobile; os dois CTAs crescem e o menu "…"
   * mantém o tamanho tátil. */
  .si-detail__actions {
    flex-wrap: wrap;
  }

  .si-detail__actions > .si-button {
    flex: 1 1 0;
  }

  .si-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
