<script setup lang="ts">
import type { GetPolicyHolderResponse } from '~/composables/usePolicyHolders'
import { formatCnpj } from '~/lib/documents'

definePageMeta({ layout: 'shell' })

const route = useRoute()
const { getPolicyHolder } = usePolicyHolders()

const policyHolder = ref<GetPolicyHolderResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const tab = ref('visao-geral')

const addressesPanelRef = ref<{ openCreateDialog: () => void } | null>(null)
const appointmentsPanelRef = ref<{ openCreateDialog: () => void } | null>(null)

/** Quick facts for the hero section. */
const quickFacts = computed(() => {
  if (!policyHolder.value) return []

  return [
    `CNPJ ${formatCnpj(policyHolder.value.documentNumber)}`,
    policyHolder.value.socialName || null,
  ].filter((fact): fact is string => Boolean(fact))
})

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    policyHolder.value = await getPolicyHolder(String(route.params.id))
  }
  catch {
    error.value = 'Não foi possível carregar o tomador.'
  }
  finally {
    loading.value = false
  }
}

function openAppointmentDialog() {
  tab.value = 'nomeacoes'
  appointmentsPanelRef.value?.openCreateDialog()
}
</script>

<template>
  <div class="si-policy-holder-detail">
    <header class="si-policy-holder-detail__hero">
      <VContainer class="si-policy-holder-detail__hero-inner">
        <nav
          class="si-policy-holder-detail__breadcrumb"
          aria-label="Trilha de navegação"
        >
          <NuxtLink to="/tomadores">
            Tomadores
          </NuxtLink>
          <span aria-hidden="true">/</span>
          <span>Detalhe</span>
        </nav>

        <div class="si-policy-holder-detail__hero-row">
          <div class="si-policy-holder-detail__identity">
            <div class="si-policy-holder-detail__title">
              <h1 class="text-h5">
                {{ policyHolder?.name ?? 'Tomador' }}
              </h1>
            </div>

            <p
              v-if="quickFacts.length"
              class="si-policy-holder-detail__facts"
            >
              <template
                v-for="(fact, index) in quickFacts"
                :key="fact"
              >
                <span
                  v-if="index > 0"
                  aria-hidden="true"
                  class="si-policy-holder-detail__facts-separator"
                >·</span>
                <span>{{ fact }}</span>
              </template>
            </p>
          </div>

          <div class="si-policy-holder-detail__hero-actions">
            <SiButton
              :prepend-icon="'plus'"
              @click="openAppointmentDialog"
            >
              Nova nomeação
            </SiButton>
          </div>
        </div>

        <SiTabs
          v-model="tab"
          class="si-policy-holder-detail__tabs"
        >
          <SiTab
            value="visao-geral"
            text="Visão geral"
          />
          <SiTab
            value="enderecos"
            text="Endereços"
          />
          <SiTab
            value="nomeacoes"
            text="Nomeações"
          />
        </SiTabs>
      </VContainer>
    </header>

    <VContainer class="si-policy-holder-detail__content">
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
        <!-- Visão geral tab -->
        <VTabsWindowItem value="visao-geral">
          <SiCard
            v-if="policyHolder"
            class="pa-5"
          >
            <dl class="si-policy-holder-detail__grid">
              <div>
                <dt>CNPJ</dt>
                <dd>{{ formatCnpj(policyHolder.documentNumber) }}</dd>
              </div>
              <div>
                <dt>Razão social</dt>
                <dd>{{ policyHolder.name }}</dd>
              </div>
              <div>
                <dt>Nome fantasia</dt>
                <dd>{{ policyHolder.socialName ?? '-' }}</dd>
              </div>
              <div>
                <dt>Natureza jurídica</dt>
                <dd>{{ policyHolder.legalNatureDescription ?? '-' }}</dd>
              </div>
              <div>
                <dt>Código da natureza jurídica</dt>
                <dd>{{ policyHolder.legalNatureCode ?? '-' }}</dd>
              </div>
              <div>
                <dt>Setor</dt>
                <dd>{{ policyHolder.isPrivateSector ? 'Privado' : 'Público' }}</dd>
              </div>
            </dl>
          </SiCard>
        </VTabsWindowItem>

        <!-- Endereços tab -->
        <VTabsWindowItem value="enderecos">
          <div class="si-policy-holder-detail__tab-actions">
            <SiButton
              :prepend-icon="'plus'"
              @click="addressesPanelRef?.openCreateDialog()"
            >
              Novo endereço
            </SiButton>
          </div>
          <PolicyHoldersAddressesPanel
            v-if="policyHolder"
            ref="addressesPanelRef"
            :policy-holder-id="policyHolder.id"
            :addresses="policyHolder.addresses"
            hide-toolbar
            @changed="refresh"
          />
        </VTabsWindowItem>

        <!-- Nomeações tab -->
        <VTabsWindowItem value="nomeacoes">
          <PolicyHoldersAppointmentsPanel
            v-if="policyHolder"
            ref="appointmentsPanelRef"
            :policy-holder-id="policyHolder.id"
            :appointments="policyHolder.appointments"
            hide-toolbar
            @changed="refresh"
          />
        </VTabsWindowItem>
      </VTabsWindow>
    </VContainer>
  </div>
</template>

<style scoped>
/* Faixa de contexto (direção C): fundo de superfície + hairline inferior. */
.si-policy-holder-detail__hero {
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-policy-holder-detail__hero-inner,
.si-policy-holder-detail__content {
  max-width: var(--si-container-wide);
}

.si-policy-holder-detail__hero-inner {
  padding-block: var(--si-space-4) 0;
}

.si-policy-holder-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-caption);
  color: var(--si-cinza);
  margin-bottom: var(--si-space-3);
}

.si-policy-holder-detail__breadcrumb a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.si-policy-holder-detail__breadcrumb a:hover {
  text-decoration: underline;
}

.si-policy-holder-detail__hero-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-policy-holder-detail__title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-3);
}

.si-policy-holder-detail__title h1 {
  margin: 0;
}

.si-policy-holder-detail__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  margin: var(--si-space-2) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-body-2);
}

.si-policy-holder-detail__facts-separator {
  color: var(--si-cinza-claro);
}

.si-policy-holder-detail__hero-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
}

.si-policy-holder-detail__tabs {
  margin-top: var(--si-space-4);
}

.si-policy-holder-detail__tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--si-space-3);
}

.si-policy-holder-detail__content {
  padding-block: var(--si-space-5);
}

.si-policy-holder-detail__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--si-space-4);
  margin: 0;
}

.si-policy-holder-detail__grid div {
  display: grid;
  gap: var(--si-space-1);
}

.si-policy-holder-detail__grid dt {
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: var(--si-fs-caption);
}

.si-policy-holder-detail__grid dd {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
}

/* Mobile: hero empilha, ações viram linha própria, grid vira coluna única. */
@media (max-width: 900px) {
  .si-policy-holder-detail__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .si-policy-holder-detail__hero-row {
    flex-direction: column;
    align-items: stretch;
  }

  .si-policy-holder-detail__hero-actions {
    justify-content: stretch;
  }

  .si-policy-holder-detail__hero-actions > :first-child {
    flex: 1;
  }

  .si-policy-holder-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
