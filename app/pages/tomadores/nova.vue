<script setup lang="ts">
import type { CreatePolicyHolderResponse } from '~/composables/usePolicyHolders'
import { formatCnpj } from '~/lib/documents'
import { cnpj, required } from '~/lib/rules'

definePageMeta({ layout: 'shell' })

const { createPolicyHolder } = usePolicyHolders()

const cnpjInput = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const createdPolicyHolder = ref<CreatePolicyHolderResponse | null>(null)

async function submit() {
  error.value = null
  success.value = null
  createdPolicyHolder.value = null
  submitting.value = true

  try {
    const policyHolder = await createPolicyHolder({ cnpj: cnpjInput.value })
    createdPolicyHolder.value = policyHolder
    success.value = 'Dados do tomador importados.'
    cnpjInput.value = ''
  }
  catch (err) {
    error.value = getPolicyHolderCreateErrorMessage(err)
  }
  finally {
    submitting.value = false
  }
}

function getPolicyHolderCreateErrorMessage(err: unknown) {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as {
      data?: {
        detail?: unknown
        message?: unknown
        data?: { detail?: unknown, message?: unknown }
      }
    }).data
    const detail = typeof data?.detail === 'string'
      ? data.detail
      : typeof data?.data?.detail === 'string'
        ? data.data.detail
        : null
    const message = typeof data?.message === 'string' ? data.message : null
    const nestedMessage = typeof data?.data?.message === 'string' ? data.data.message : null
    return detail ?? nestedMessage ?? message ?? 'Não foi possível buscar o CNPJ.'
  }

  return 'Não foi possível buscar o CNPJ.'
}

function sectorLabel(value: boolean | null) {
  if (value === null) return '-'
  return value ? 'Privado' : 'Público'
}

function formatAddress(address: CreatePolicyHolderResponse['mainAddress']) {
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
  <VContainer class="si-policy-holder-create">
    <div class="si-policy-holder-create__header">
      <h1 class="text-h5">
        Novo tomador
      </h1>

      <SiButton
        to="/tomadores"
        variant="outlined"
        color="secondary"
        :prepend-icon="'arrowLeft'"
      >
        Voltar
      </SiButton>
    </div>

    <div class="si-policy-holder-create__layout">
      <SiCard
        class="si-policy-holder-create__form-card pa-5"
        variant="outlined"
      >
        <div class="si-policy-holder-create__form-title">
          <h2 class="text-subtitle-1">
            Buscar dados cadastrais
          </h2>
        </div>

        <SiForm @submit.prevent="submit">
          <div class="si-policy-holder-create__form-row">
            <SiDocField
              v-model="cnpjInput"
              tipo="cnpj"
              label="CNPJ"
              :rules="[required(), cnpj()]"
              density="compact"
              autofocus
              clearable
              validate-on="submit"
              class="si-policy-holder-create__cnpj"
            />

            <SiButton
              type="submit"
              :loading="submitting"
              :prepend-icon="'search'"
              size="small"
              class="si-policy-holder-create__submit"
            >
              Buscar CNPJ
            </SiButton>
          </div>

          <SiAlert
            v-if="error"
            type="error"
            class="mt-1 mb-0"
            :text="error"
          />

          <SiAlert
            v-if="success"
            type="success"
            class="mt-1 mb-0"
            :text="success"
          />
        </SiForm>
      </SiCard>

      <SiCard
        v-if="createdPolicyHolder"
        class="si-policy-holder-create__result-card pa-5"
        variant="outlined"
      >
        <div class="si-policy-holder-create__result-header">
          <h2 class="text-subtitle-1">
            Dados importados
          </h2>
        </div>

        <dl class="si-policy-holder-create__details">
          <div>
            <dt>CNPJ</dt>
            <dd>{{ formatCnpj(createdPolicyHolder.documentNumber) }}</dd>
          </div>
          <div>
            <dt>Razão social</dt>
            <dd>{{ createdPolicyHolder.name }}</dd>
          </div>
          <div>
            <dt>Nome fantasia</dt>
            <dd>{{ createdPolicyHolder.socialName ?? '-' }}</dd>
          </div>
          <div>
            <dt>Natureza jurídica</dt>
            <dd>{{ createdPolicyHolder.legalNatureDescription ?? '-' }}</dd>
          </div>
          <div>
            <dt>Código da natureza jurídica</dt>
            <dd>{{ createdPolicyHolder.legalNatureCode ?? '-' }}</dd>
          </div>
          <div>
            <dt>Setor</dt>
            <dd>{{ sectorLabel(createdPolicyHolder.isPrivateSector) }}</dd>
          </div>
          <div class="si-policy-holder-create__address">
            <dt>Endereço principal</dt>
            <dd>{{ formatAddress(createdPolicyHolder.mainAddress) }}</dd>
          </div>
        </dl>

        <div class="si-policy-holder-create__result-actions">
          <SiButton
            :to="`/tomadores/${createdPolicyHolder.id}`"
            :prepend-icon="'eye'"
            color="info"
            size="small"
          >
            Ver detalhes
          </SiButton>
        </div>
      </SiCard>
    </div>
  </VContainer>
</template>

<style scoped>
.si-policy-holder-create {
  max-width: var(--si-container-wide);
}

.si-policy-holder-create__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin-block: var(--si-space-6) var(--si-space-5);
}

.si-policy-holder-create__header h1 {
  margin: 0;
}

.si-policy-holder-create__layout {
  display: grid;
  gap: var(--si-space-4);
  align-items: start;
}

.si-policy-holder-create__form-card,
.si-policy-holder-create__result-card {
  width: 100%;
}

.si-policy-holder-create__form-title {
  margin-bottom: var(--si-space-4);
}

.si-policy-holder-create__form-title h2 {
  margin: 0;
}

.si-policy-holder-create__form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--si-space-3);
  align-items: start;
}

.si-policy-holder-create__submit {
  min-width: 168px;
  min-height: 40px;
}

.si-policy-holder-create__result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  margin-bottom: var(--si-space-4);
}

.si-policy-holder-create__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-4);
  margin: 0;
}

.si-policy-holder-create__details div {
  display: grid;
  gap: var(--si-space-1);
}

.si-policy-holder-create__details dt {
  color: rgba(var(--v-theme-on-surface), 0.64);
  font-size: var(--si-fs-caption);
}

.si-policy-holder-create__details dd {
  margin: 0;
  font-weight: var(--si-font-weight-semibold);
}

.si-policy-holder-create__address {
  grid-column: 1 / -1;
}

.si-policy-holder-create__result-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--si-space-5);
}

@media (max-width: 700px) {
  .si-policy-holder-create__header,
  .si-policy-holder-create__form-row,
  .si-policy-holder-create__details {
    grid-template-columns: 1fr;
  }

  .si-policy-holder-create__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .si-policy-holder-create__submit,
  .si-policy-holder-create__result-actions .si-button {
    width: 100%;
  }
}
</style>
