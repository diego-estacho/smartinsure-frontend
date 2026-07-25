<script setup lang="ts">
/**
 * Etapa 2 — Dados do segurado (exec-plan 0015). Busca por CNPJ/razão social (papel `Insured`) +
 * nome fantasia opcional; ao selecionar, mostra o segurado e a lista de endereços (rádio, badge
 * "Principal", excluir) + formulário inline "Novo endereço" com busca por CEP (ViaCEP via BFF).
 * A busca fica SEMPRE visível — trocar é só buscar de novo.
 *
 * Gerenciar endereços é UI-only por ora — não há endpoint de endereço de Pessoa (segurado) no
 * contrato. O endereço selecionado alimenta o resumo. TODO(backend): endpoints de endereço de Pessoa.
 */
import type { PersonAddress, PersonSearchItem } from '~/composables/usePersons'
import type { SelectedInsured } from '~/stores/quotationGroupWizard'
import { formatCnpj } from '~/lib/documents'

interface InsuredAddress {
  id: string
  label: string
  isMain: boolean
}

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const wizard = useQuotationGroupWizardStore()
const { searchPersons } = usePersons()

const query = ref('')
const tradeName = ref('')
const searching = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const results = ref<PersonSearchItem[]>([])
const searched = ref(false)

const addresses = ref<InsuredAddress[]>([])
const selectedAddressId = ref<string | null>(null)
let addressSeq = 0

const addingAddress = ref(false)
const cepLoading = ref(false)
const cepError = ref<string | null>(null)
const formError = ref<string | null>(null)
const newAddress = reactive({
  zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', additionalInfo: '',
})

const selected = computed(() => wizard.insured)

function formatCep(zip: string): string {
  const digits = zip.replace(/\D/g, '')
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : zip
}

function formatAddress(address: PersonAddress | typeof newAddress): string {
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode ? `CEP ${formatCep(address.zipCode)}` : '',
  ].filter(Boolean).join(' · ')
}

function syncSelectedAddress(): void {
  if (!wizard.insured) return
  const chosen = addresses.value.find(address => address.id === selectedAddressId.value)
  wizard.setInsured({ ...wizard.insured, mainAddress: chosen?.label ?? null })
}

async function search(): Promise<void> {
  const term = query.value.trim()
  error.value = null
  notice.value = null
  if (!term) {
    error.value = 'Digite um CNPJ ou razão social para buscar.'
    return
  }
  searching.value = true
  searched.value = true
  try {
    const response = await searchPersons({ term, role: 'Insured' })
    results.value = response.items
    notice.value = response.notice ?? null
  }
  catch {
    error.value = 'Não foi possível buscar o segurado.'
    results.value = []
  }
  finally {
    searching.value = false
  }
}

function select(item: PersonSearchItem): void {
  const chosen: SelectedInsured = {
    id: item.id,
    name: item.name,
    documentNumber: item.documentNumber,
    socialName: item.socialName ?? null,
    mainAddress: item.mainAddress ? formatAddress(item.mainAddress) : null,
  }
  wizard.setInsured(chosen)
  tradeName.value = item.socialName ?? ''
  addresses.value = item.mainAddress
    ? [{ id: `a${addressSeq++}`, label: formatAddress(item.mainAddress), isMain: true }]
    : []
  selectedAddressId.value = addresses.value[0]?.id ?? null
  results.value = []
  closeAddressForm()
}

function selectAddress(id: string): void {
  selectedAddressId.value = id
  syncSelectedAddress()
}

function removeAddress(id: string): void {
  addresses.value = addresses.value.filter(address => address.id !== id)
  if (selectedAddressId.value === id) {
    selectedAddressId.value = addresses.value[0]?.id ?? null
    syncSelectedAddress()
  }
}

// Busca de endereço por CEP (ViaCEP via BFF) — dispara ao completar 8 dígitos.
async function lookupCep(): Promise<void> {
  const digits = newAddress.zipCode.replace(/\D/g, '')
  if (digits.length !== 8) return
  cepLoading.value = true
  cepError.value = null
  try {
    const data = await $fetch<{ street?: string, neighborhood?: string, city?: string, state?: string, error?: string }>(
      `/api/cep/${digits}`,
    )
    if (data.error) {
      cepError.value = data.error
      return
    }
    newAddress.street = data.street || newAddress.street
    newAddress.neighborhood = data.neighborhood || newAddress.neighborhood
    newAddress.city = data.city || newAddress.city
    newAddress.state = data.state || newAddress.state
  }
  catch {
    cepError.value = 'Não foi possível consultar o CEP.'
  }
  finally {
    cepLoading.value = false
  }
}

watch(() => newAddress.zipCode, (value) => {
  if (value.replace(/\D/g, '').length === 8) lookupCep()
})

function closeAddressForm(): void {
  addingAddress.value = false
  formError.value = null
  cepError.value = null
  Object.assign(newAddress, {
    zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', additionalInfo: '',
  })
}

function addAddress(): void {
  formError.value = null
  const requiredFilled = [
    newAddress.zipCode, newAddress.street, newAddress.number,
    newAddress.neighborhood, newAddress.city, newAddress.state,
  ].every(value => value.trim())
  if (!requiredFilled) {
    formError.value = 'Preencha os campos obrigatórios do endereço.'
    return
  }
  const id = `a${addressSeq++}`
  addresses.value.push({ id, label: formatAddress(newAddress), isMain: addresses.value.length === 0 })
  selectedAddressId.value = id
  syncSelectedAddress()
  closeAddressForm()
}
</script>

<template>
  <div class="si-qg-step2">
    <SiForm @submit.prevent="search">
      <div class="si-qg-step2__search-grid">
        <SiTextField
          v-model="query"
          label="CNPJ ou razão social do segurado"
          required
          placeholder="00.000.000/0000-00"
          density="comfortable"
          clearable
          hide-details
        />
        <SiTextField
          v-model="tradeName"
          label="Nome fantasia"
          placeholder="Opcional"
          density="comfortable"
          clearable
          hide-details
        />
      </div>
      <SiButton
        type="submit"
        :loading="searching"
        :prepend-icon="'search'"
        class="si-qg-step2__search-btn"
      >
        Buscar segurado
      </SiButton>
    </SiForm>

    <SiAlert
      v-if="error"
      type="error"
      class="mt-2 mb-0"
      :text="error"
    />
    <SiAlert
      v-else-if="notice"
      type="info"
      class="mt-2 mb-0"
      :text="notice"
    />

    <SiList
      v-if="results.length"
      class="si-qg-step2__results"
    >
      <SiListItem
        v-for="item in results"
        :key="item.id"
        :title="item.name"
        :subtitle="`CNPJ ${formatCnpj(item.documentNumber)}`"
        prepend-icon="building"
        @click="select(item)"
      />
    </SiList>

    <p
      v-else-if="searched && !searching && !error && !selected"
      class="si-qg-step2__empty"
    >
      Nenhum segurado encontrado para "{{ query }}".
    </p>

    <div
      v-if="selected"
      class="si-qg-step2__selected"
    >
      <span class="si-qg-step2__eyebrow">Segurado</span>
      <span class="si-qg-step2__name">{{ selected.name }}</span>
      <span class="si-qg-step2__doc">CNPJ {{ formatCnpj(selected.documentNumber) }}</span>

      <div class="si-qg-step2__addresses">
        <span class="si-qg-step2__addresses-label">Endereços</span>

        <SiRadioGroup
          v-if="addresses.length"
          :model-value="selectedAddressId"
          hide-details
          @update:model-value="selectAddress($event as string)"
        >
          <div
            v-for="address in addresses"
            :key="address.id"
            class="si-qg-step2__address"
            :class="{ 'si-qg-step2__address--selected': address.id === selectedAddressId }"
          >
            <SiRadio
              :value="address.id"
              :label="address.label"
              hide-details
              class="si-qg-step2__address-radio"
            />
            <span
              v-if="address.isMain"
              class="si-qg-step2__badge"
            >
              Principal
            </span>
            <SiButton
              v-if="!address.isMain"
              icon
              variant="text"
              color="secondary"
              size="small"
              class="si-qg-step2__address-remove"
              @click.stop="removeAddress(address.id)"
            >
              <SiIcon
                icon="trash"
                :size="18"
              />
            </SiButton>
          </div>
        </SiRadioGroup>

        <p
          v-else
          class="si-qg-step2__empty"
        >
          Nenhum endereço cadastrado para este segurado.
        </p>

        <!-- Formulário inline "Novo endereço" (UI-only por ora). -->
        <div
          v-if="addingAddress"
          class="si-qg-step2__new-address"
        >
          <span class="si-qg-step2__new-address-title">Novo endereço</span>
          <div class="si-qg-step2__address-grid">
            <SiTextField
              v-model="newAddress.zipCode"
              label="CEP"
              required
              placeholder="00000-000"
              density="comfortable"
              :loading="cepLoading"
              @blur="lookupCep"
            />
            <SiTextField
              v-model="newAddress.city"
              label="Cidade"
              required
              density="comfortable"
            />
            <SiSelect
              v-model="newAddress.state"
              label="Estado"
              required
              :items="UFS"
              placeholder="UF"
              density="comfortable"
            />
            <SiTextField
              v-model="newAddress.street"
              label="Endereço"
              required
              density="comfortable"
            />
            <SiTextField
              v-model="newAddress.number"
              label="Número"
              required
              density="comfortable"
            />
            <SiTextField
              v-model="newAddress.neighborhood"
              label="Bairro"
              required
              density="comfortable"
            />
            <SiTextField
              v-model="newAddress.complement"
              label="Complemento"
              placeholder="Opcional"
              density="comfortable"
            />
            <SiTextField
              v-model="newAddress.additionalInfo"
              label="Informações adicionais"
              placeholder="Opcional"
              density="comfortable"
              class="si-qg-step2__address-span2"
            />
          </div>

          <SiAlert
            v-if="cepError"
            type="warning"
            class="mt-2 mb-0"
            :text="cepError"
          />
          <SiAlert
            v-if="formError"
            type="error"
            class="mt-2 mb-0"
            :text="formError"
          />

          <div class="si-qg-step2__new-address-actions">
            <SiButton @click="addAddress">
              Salvar endereço
            </SiButton>
            <SiButton
              variant="text"
              color="secondary"
              @click="closeAddressForm"
            >
              Cancelar
            </SiButton>
          </div>
        </div>

        <SiButton
          v-else
          variant="outlined"
          color="secondary"
          :prepend-icon="'plus'"
          class="si-qg-step2__add-address"
          @click="addingAddress = true"
        >
          Adicionar novo endereço
        </SiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.si-qg-step2__search-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-4);
}

.si-qg-step2__search-btn {
  height: 48px;
  margin-top: var(--si-space-4);
}

.si-qg-step2__results {
  margin-top: var(--si-space-2);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  overflow: hidden;
}

.si-qg-step2__empty {
  margin: var(--si-space-3) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-qg-step2__selected {
  margin-top: var(--si-space-5);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.si-qg-step2__eyebrow {
  font-size: var(--si-fs-caption, 0.75rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-qg-step2__name {
  font-size: var(--si-fs-h4, 1.125rem);
  font-weight: var(--si-font-weight-semibold);
  line-height: 1.3;
}

.si-qg-step2__doc {
  font-size: var(--si-fs-small);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-qg-step2__addresses {
  margin-top: var(--si-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
}

.si-qg-step2__addresses-label {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step2__address {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-1) var(--si-space-3);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
}

.si-qg-step2__address--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.si-qg-step2__address-radio {
  flex: 1 1 auto;
  min-width: 0;
}

.si-qg-step2__badge {
  flex: 0 0 auto;
  font-size: var(--si-fs-caption, 0.75rem);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: var(--si-radius-pill, 999px);
  padding: 2px var(--si-space-2);
}

.si-qg-step2__address-remove {
  flex: 0 0 auto;
}

.si-qg-step2__add-address {
  align-self: flex-start;
  margin-top: var(--si-space-1);
}

.si-qg-step2__new-address {
  margin-top: var(--si-space-2);
  padding: var(--si-space-4);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
}

.si-qg-step2__new-address-title {
  display: block;
  font-size: var(--si-fs-body);
  font-weight: var(--si-font-weight-semibold);
  margin-bottom: var(--si-space-3);
}

.si-qg-step2__address-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--si-space-3);
}

.si-qg-step2__address-span2 {
  grid-column: span 2;
}

.si-qg-step2__new-address-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  margin-top: var(--si-space-4);
}

@media (max-width: 599.98px) {
  .si-qg-step2__search-grid,
  .si-qg-step2__address-grid {
    grid-template-columns: 1fr;
  }

  .si-qg-step2__address-span2 {
    grid-column: auto;
  }

  .si-qg-step2__search-btn {
    width: 100%;
  }
}
</style>
