<script setup lang="ts">
import type { EnablementListItemResponse, CalculationEngineListItemResponse } from '~/composables/useInsurerEnablements'
import type { InsurerListItemResponse } from '~/composables/useInsurers'
import { mdiPencilOutline, mdiPlus } from '~/lib/icons'
import { maxLength, required, url } from '~/lib/rules'
import { getEnablementStatusAction, getEnablementStatusView } from '~/lib/status/insurer-enablements'

const props = withDefaults(defineProps<{ brokerageId: string, hideToolbar?: boolean }>(), {
  hideToolbar: false,
})

const {
  listEnablements,
  getEnablement,
  createEnablement,
  updateEnablement,
  changeEnablementStatus,
  listCalculationEngines,
} = useInsurerEnablements()
const { listInsurers } = useInsurers()

const enablements = ref<EnablementListItemResponse[]>([])
const insurers = ref<InsurerListItemResponse[]>([])
const engines = ref<CalculationEngineListItemResponse[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const headers = [
  { title: 'Seguradora', key: 'insurerCorporateName' },
  { title: 'Motor de cálculo', key: 'calculationEngine' },
  { title: 'Situação', key: 'status' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

/** Formulário do dialog (criar/editar). Campos do PlugV2 viram JSON só no envio. */
const formOpen = ref(false)
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const editingId = ref<string | null>(null)
const form = reactive({
  insurerId: null as string | null,
  calculationEngine: null as string | null,
  plugV2BaseUrl: '',
  plugV2Key: '',
})

const isEditing = computed(() => editingId.value !== null)

/** Resumo com dados reais da listagem (direção C aprovada). */
const summary = computed(() => {
  const active = enablements.value.filter(item => item.status === 'Active').length
  const distinctEngines = [...new Set(enablements.value.map(item => item.calculationEngine))]

  return {
    total: enablements.value.length,
    active,
    engines: distinctEngines.length ? distinctEngines.join(', ') : '—',
  }
})
const isPlugV2 = computed(() => form.calculationEngine === 'PlugV2')
const formTitle = computed(() => (isEditing.value ? 'Editar habilitação' : 'Habilitar seguradora'))

/** Confirmação de ativar/inativar. */
const confirmOpen = ref(false)
const selectedEnablement = ref<EnablementListItemResponse | null>(null)
const statusAction = computed(() =>
  selectedEnablement.value ? getEnablementStatusAction(selectedEnablement.value.status) : null,
)

defineExpose({ openCreateDialog })

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const [enablementsPage, insurersPage, engineList] = await Promise.all([
      listEnablements({ brokerageId: props.brokerageId, pageSize: 100 }),
      listInsurers({ pageSize: 100 }),
      listCalculationEngines(),
    ])
    enablements.value = [...enablementsPage.items]
    insurers.value = [...insurersPage.items]
    engines.value = engineList
  }
  catch {
    error.value = 'Não foi possível carregar as habilitações da corretora.'
  }
  finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingId.value = null
  form.insurerId = null
  form.calculationEngine = engines.value.length === 1 ? (engines.value[0]?.name ?? null) : null
  form.plugV2BaseUrl = ''
  form.plugV2Key = ''
  success.value = null
  formOpen.value = true
}

async function openEditDialog(item: EnablementListItemResponse) {
  editingId.value = item.id
  form.insurerId = item.insurerId
  form.calculationEngine = item.calculationEngine
  form.plugV2BaseUrl = ''
  form.plugV2Key = ''
  success.value = null
  formOpen.value = true

  try {
    const details = await getEnablement(item.id)
    applyConnectionParameters(details.connectionParameters)
  }
  catch {
    error.value = 'Não foi possível carregar os parâmetros da habilitação.'
    formOpen.value = false
  }
}

function applyConnectionParameters(connectionParameters: string | null) {
  if (!connectionParameters) return

  try {
    const parsed: unknown = JSON.parse(connectionParameters)
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      form.plugV2BaseUrl = typeof record.baseUrl === 'string' ? record.baseUrl : ''
      form.plugV2Key = typeof record.key === 'string' ? record.key : ''
    }
  }
  catch {
    // JSON ilegível: campos ficam vazios e o usuário reinforma.
  }
}

function serializeConnectionParameters(): string | null {
  if (isPlugV2.value) {
    return JSON.stringify({ baseUrl: form.plugV2BaseUrl.trim(), key: form.plugV2Key.trim() })
  }

  return null
}

async function submitForm() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid || !form.calculationEngine) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    if (isEditing.value && editingId.value) {
      await updateEnablement(editingId.value, {
        calculationEngine: form.calculationEngine,
        connectionParameters: serializeConnectionParameters(),
      })
      success.value = 'Habilitação atualizada.'
    }
    else {
      if (!form.insurerId) return
      await createEnablement({
        brokerageId: props.brokerageId,
        insurerId: form.insurerId,
        calculationEngine: form.calculationEngine,
        connectionParameters: serializeConnectionParameters(),
      })
      success.value = 'Seguradora habilitada.'
    }

    formOpen.value = false
    await refresh()
  }
  catch {
    error.value = isEditing.value
      ? 'Não foi possível atualizar a habilitação.'
      : 'Não foi possível habilitar a seguradora.'
  }
  finally {
    saving.value = false
  }
}

function insurerInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
}

function openStatusDialog(item: EnablementListItemResponse) {
  selectedEnablement.value = item
  success.value = null
  confirmOpen.value = true
}

async function confirmStatusChange() {
  const action = statusAction.value
  if (!selectedEnablement.value || !action?.targetStatus) return

  saving.value = true
  error.value = null

  try {
    await changeEnablementStatus(selectedEnablement.value.id, action.targetStatus)
    success.value = action.successMessage
    confirmOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível alterar a situação da habilitação.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="si-enablements">
    <div
      v-if="!props.hideToolbar"
      class="si-enablements__toolbar"
    >
      <SiButton
        :prepend-icon="mdiPlus"
        @click="openCreateDialog"
      >
        Habilitar seguradora
      </SiButton>
    </div>

    <div class="si-enablements__summary">
      <SiCard class="si-enablements__summary-card pa-4">
        <span class="si-enablements__summary-label">Seguradoras habilitadas</span>
        <strong class="si-enablements__summary-value">{{ summary.total }}</strong>
      </SiCard>

      <SiCard class="si-enablements__summary-card pa-4">
        <span class="si-enablements__summary-label">Habilitações ativas</span>
        <strong class="si-enablements__summary-value">{{ summary.active }}</strong>
      </SiCard>

      <SiCard class="si-enablements__summary-card pa-4">
        <span class="si-enablements__summary-label">Motor de cálculo</span>
        <strong class="si-enablements__summary-value">{{ summary.engines }}</strong>
      </SiCard>
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

    <div class="si-enablements__table">
      <SiDataTable
        :headers="headers"
        :items="enablements"
        :loading="loading"
      >
      <template #[`item.insurerCorporateName`]="{ item }">
        <div class="si-enablements__insurer">
          <VAvatar
            size="32"
            color="surface"
            class="si-enablements__insurer-logo"
          >
            <VImg
              v-if="item.insurerLogoUrl"
              :src="item.insurerLogoUrl"
              :alt="`Logo ${item.insurerCorporateName}`"
              contain
            />
            <span
              v-else
              class="si-enablements__insurer-initials"
            >{{ insurerInitials(item.insurerCorporateName) }}</span>
          </VAvatar>
          <span>{{ item.insurerCorporateName }}</span>
        </div>
      </template>

      <template #[`item.status`]="{ item }">
        <SiChip
          :color="getEnablementStatusView(item.status).color"
          size="small"
        >
          {{ getEnablementStatusView(item.status).label }}
        </SiChip>
      </template>

      <template #[`item.actions`]="{ item }">
        <div class="si-enablements__row-actions">
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
            :color="getEnablementStatusAction(item.status).color"
            :prepend-icon="getEnablementStatusAction(item.status).icon"
            :disabled="getEnablementStatusAction(item.status).disabled"
            @click="openStatusDialog(item)"
          >
            {{ getEnablementStatusAction(item.status).shortLabel }}
          </SiButton>
        </div>
      </template>

      <template #no-data>
        Nenhuma seguradora habilitada para esta corretora.
      </template>
      </SiDataTable>
    </div>

    <SiDialog v-model="formOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-4">
          {{ formTitle }}
        </h2>

        <SiForm ref="formRef">
          <SiSelect
            v-model="form.insurerId"
            label="Seguradora"
            :items="insurers"
            item-title="corporateName"
            item-value="id"
            :rules="[required('Selecione a seguradora')]"
            :disabled="isEditing"
            class="mb-3"
          />

          <SiSelect
            v-model="form.calculationEngine"
            label="Motor de cálculo"
            :items="engines"
            item-title="name"
            item-value="name"
            :rules="[required('Selecione o motor de cálculo')]"
            class="mb-3"
          />

          <template v-if="isPlugV2">
            <SiTextField
              v-model="form.plugV2BaseUrl"
              label="Base URL"
              placeholder="https://"
              :rules="[required('Informe a base URL'), url()]"
              class="mb-3"
            />

            <SiTextField
              v-model="form.plugV2Key"
              label="Key"
              type="password"
              autocomplete="off"
              :rules="[required('Informe a key'), maxLength(200)]"
              class="mb-3"
            />
          </template>
        </SiForm>

        <div class="si-enablements__dialog-actions">
          <SiButton
            variant="text"
            @click="formOpen = false"
          >
            Cancelar
          </SiButton>

          <SiButton
            :loading="saving"
            @click="submitForm"
          >
            Salvar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>

    <SiDialog v-model="confirmOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          {{ statusAction?.label ?? 'Alterar situação da habilitação' }}
        </h2>

        <p class="mb-5">
          {{ selectedEnablement?.insurerCorporateName }}
        </p>

        <div class="si-enablements__dialog-actions">
          <SiButton
            variant="text"
            @click="confirmOpen = false"
          >
            Cancelar
          </SiButton>

          <SiButton
            :prepend-icon="statusAction?.icon"
            :color="statusAction?.color"
            :loading="saving"
            :disabled="statusAction?.disabled"
            @click="confirmStatusChange"
          >
            Confirmar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </section>
</template>

<style scoped>
.si-enablements__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--si-space-3);
}

.si-enablements__insurer {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-enablements__insurer-logo {
  border: 1px solid var(--si-cinza-claro);
  background: rgb(var(--v-theme-surface));
}

.si-enablements__insurer-logo :deep(.v-img__img) {
  object-fit: contain;
  padding: 2px;
}

.si-enablements__insurer-initials {
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-enablements__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--si-space-3);
  margin-bottom: var(--si-space-4);
}

.si-enablements__summary-card {
  display: grid;
  gap: var(--si-space-1);
}

.si-enablements__summary-label {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
}

.si-enablements__summary-value {
  font-size: var(--si-fs-h3);
  font-weight: var(--si-font-weight-bold);
  line-height: 1.2;
}

/* Mobile: tabela rola horizontal dentro do próprio painel. */
.si-enablements__table {
  overflow-x: auto;
}

.si-enablements__row-actions,
.si-enablements__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}
</style>
