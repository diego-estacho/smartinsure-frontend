<script setup lang="ts">
import type { PolicyHolderAddress, AddPolicyHolderAddressBody, UpdatePolicyHolderAddressBody } from '~/composables/usePolicyHolders'
import { MASK_CEP } from '~/lib/masks'
import { mdiPencilOutline, mdiTrashCanOutline } from '~/lib/icons'
import { required } from '~/lib/rules'

const props = withDefaults(defineProps<{ policyHolderId: string, hideToolbar?: boolean }>(), {
  hideToolbar: false,
})

const { addAddress, updateAddress, deleteAddress } = usePolicyHolders()

const addresses = ref<PolicyHolderAddress[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const headers = [
  { title: 'CEP', key: 'zipCode' },
  { title: 'Endereço', key: 'street' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

/** Formulário do dialog (criar/editar). */
const formOpen = ref(false)
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const editingId = ref<string | null>(null)
const form = reactive({
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
})

const isEditing = computed(() => editingId.value !== null)
const formTitle = computed(() => (isEditing.value ? 'Editar endereço' : 'Adicionar endereço'))

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

defineExpose({ openCreateDialog })

async function refresh() {
  // Addresses list will be refreshed from parent context
  // This is called after operations complete
}

function openCreateDialog() {
  editingId.value = null
  form.zipCode = ''
  form.street = ''
  form.number = ''
  form.complement = ''
  form.neighborhood = ''
  form.city = ''
  form.state = ''
  success.value = null
  formOpen.value = true
}

async function openEditDialog(address: PolicyHolderAddress) {
  editingId.value = address.id
  form.zipCode = address.zipCode ?? ''
  form.street = address.street ?? ''
  form.number = address.number ?? ''
  form.complement = address.complement ?? ''
  form.neighborhood = address.neighborhood ?? ''
  form.city = address.city ?? ''
  form.state = address.state ?? ''
  success.value = null
  formOpen.value = true
}

async function submitForm() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  loading.value = true
  error.value = null
  success.value = null

  try {
    if (isEditing.value && editingId.value) {
      const body: UpdatePolicyHolderAddressBody = {
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
      }
      await updateAddress(props.policyHolderId, editingId.value, body)
      success.value = 'Endereço atualizado.'
    }
    else {
      const body: AddPolicyHolderAddressBody = {
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
      }
      await addAddress(props.policyHolderId, body)
      success.value = 'Endereço adicionado.'
    }

    formOpen.value = false
    await refresh()
  }
  catch {
    error.value = isEditing.value
      ? 'Não foi possível atualizar o endereço.'
      : 'Não foi possível adicionar o endereço.'
  }
  finally {
    loading.value = false
  }
}

async function removeAddress(address: PolicyHolderAddress) {
  loading.value = true
  error.value = null
  success.value = null

  try {
    await deleteAddress(props.policyHolderId, address.id)
    success.value = 'Endereço removido.'
    await refresh()
  }
  catch {
    error.value = 'Não foi possível remover o endereço.'
  }
  finally {
    loading.value = false
  }
}

function formatAddressLine(address: PolicyHolderAddress): string {
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
  ].filter(Boolean).join(' - ')
}
</script>

<template>
  <section class="si-policy-holder-addresses-panel">
    <div class="si-policy-holder-addresses-panel__table">
      <SiDataTable
        :headers="headers"
        :items="addresses"
        :loading="loading"
      >
        <template #[`item.street`]="{ item }">
          {{ formatAddressLine(item) }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-policy-holder-addresses-panel__row-actions">
            <SiButton
              variant="text"
              size="small"
              :prepend-icon="mdiPencilOutline"
              @click="openEditDialog(item)"
            >
              Editar
            </SiButton>

            <SiButton
              variant="text"
              size="small"
              color="error"
              :prepend-icon="mdiTrashCanOutline"
              @click="removeAddress(item)"
            >
              Remover
            </SiButton>
          </div>
        </template>

        <template #no-data>
          Nenhum endereço adicional registrado.
        </template>
      </SiDataTable>
    </div>

    <SiDialog v-model="formOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          {{ formTitle }}
        </h2>

        <SiForm
          ref="formRef"
          @submit.prevent="submitForm"
        >
          <div class="si-policy-holder-addresses-panel__form-grid">
            <SiTextField
              v-model="form.zipCode"
              label="CEP"
              placeholder="00000-000"
              :mask="MASK_CEP"
              :rules="[required()]"
              density="compact"
            />

            <SiTextField
              v-model="form.street"
              label="Rua"
              :rules="[required()]"
              density="compact"
            />

            <SiTextField
              v-model="form.number"
              label="Número"
              :rules="[required()]"
              density="compact"
            />

            <SiTextField
              v-model="form.complement"
              label="Complemento"
              density="compact"
            />

            <SiTextField
              v-model="form.neighborhood"
              label="Bairro"
              :rules="[required()]"
              density="compact"
            />

            <SiTextField
              v-model="form.city"
              label="Cidade"
              :rules="[required()]"
              density="compact"
            />

            <SiSelect
              v-model="form.state"
              label="UF"
              :items="brazilianStates"
              :rules="[required()]"
              density="compact"
            />
          </div>

          <div class="si-policy-holder-addresses-panel__dialog-actions">
            <SiButton
              variant="text"
              @click="formOpen = false"
            >
              Cancelar
            </SiButton>

            <SiButton
              type="submit"
              :loading="loading"
            >
              Salvar
            </SiButton>
          </div>
        </SiForm>
      </SiCard>
    </SiDialog>
  </section>
</template>

<style scoped>
.si-policy-holder-addresses-panel__table {
  overflow-x: auto;
}

.si-policy-holder-addresses-panel__row-actions,
.si-policy-holder-addresses-panel__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-policy-holder-addresses-panel__form-grid {
  display: grid;
  gap: var(--si-space-3);
  margin-bottom: var(--si-space-4);
}
</style>
