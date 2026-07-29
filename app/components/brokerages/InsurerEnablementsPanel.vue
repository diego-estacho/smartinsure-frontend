<script setup lang="ts">
import type { EnablementListItemResponse, CalculationEngineListItemResponse } from '~/composables/useInsurerEnablements'
import type { InsurerListItemResponse } from '~/composables/useInsurers'
import { maxLength, required, url } from '~/lib/rules'
import { getEnablementStatusAction, getEnablementStatusView } from '~/lib/status/insurer-enablements'
import { extractApiErrorMessage } from '~/lib/apiError'

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

const { isMobile } = useIsMobile()

// Larguras curadas na mesma linguagem da listagem de Corretoras (DS): a Seguradora domina e as
// demais colunas ficam compactas; `table-layout: fixed` (skin abaixo) trunca nome longo com elipse.
const headers = [
  { title: 'Seguradora', key: 'insurerCorporateName', width: '52%' },
  { title: 'Motor de cálculo', key: 'calculationEngine', width: '18%' },
  { title: 'Situação', key: 'status', width: '15%' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const, width: '15%' },
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

// RN-022 / README §5: no cadastro só aparecem Seguradoras ainda não habilitadas. Na edição, a
// lista completa (o select fica desabilitado mostrando a atual).
const availableInsurers = computed(() =>
  insurers.value.filter(insurer => !enablements.value.some(item => item.insurerId === insurer.id)))
const insurerOptions = computed(() => (isEditing.value ? insurers.value : availableInsurers.value))
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
  catch (err) {
    error.value = extractApiErrorMessage(err, 'Não foi possível carregar as habilitações da corretora.')
  }
  finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingId.value = null
  form.insurerId = null
  // Default do motor = PlugV2 (glossário: único motor desta fase), robusto a corrida de carga
  // dos engines. Garante que Base URL + Key apareçam já na abertura (RN-022, todos obrigatórios).
  form.calculationEngine = engines.value[0]?.name ?? 'PlugV2'
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
  catch (err) {
    error.value = extractApiErrorMessage(err, 'Não foi possível carregar os parâmetros da habilitação.')
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
  catch (err) {
    error.value = extractApiErrorMessage(err, isEditing.value
      ? 'Não foi possível atualizar a habilitação.'
      : 'Não foi possível habilitar a seguradora.')
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
  catch (err) {
    error.value = extractApiErrorMessage(err, 'Não foi possível alterar a situação da habilitação.')
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
        :prepend-icon="'plus'"
        @click="openCreateDialog"
      >
        Habilitar seguradora
      </SiButton>
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

    <!-- Mobile (< 1024px): cards, mesma linguagem da listagem de Corretoras; a tabela é desktop-only. -->
    <template v-if="isMobile">
      <SiProgressLinear
        v-if="loading"
        indeterminate
        class="si-enablements-cards__progress"
      />
      <ul
        v-if="enablements.length"
        class="si-enablements-cards"
      >
        <li
          v-for="item in enablements"
          :key="item.id"
          class="si-enablements-cards__item"
        >
          <div class="si-enablements-cards__main">
            <SiAvatar
              size="sm"
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
            </SiAvatar>
            <div class="si-enablements-cards__identity">
              <span class="si-cell-strong">{{ item.insurerCorporateName }}</span>
              <span class="si-enablements__meta">{{ item.calculationEngine }}</span>
            </div>
            <SiChip
              :color="getEnablementStatusView(item.status).color"
              size="small"
            >
              {{ getEnablementStatusView(item.status).label }}
            </SiChip>
          </div>
          <div class="si-enablements-cards__actions">
            <SiButton
              variant="text"
              size="small"
              :prepend-icon="'pencil'"
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
        </li>
      </ul>
      <div
        v-else-if="!loading"
        class="si-enablements__empty"
      >
        Nenhuma seguradora habilitada para esta corretora.
      </div>
    </template>

    <div
      v-else
      class="si-enablements__table"
    >
      <SiDataTable
        :headers="headers"
        :items="enablements"
        :loading="loading"
      >
      <template #[`item.insurerCorporateName`]="{ item }">
        <div class="si-enablements__insurer">
          <SiAvatar
            size="sm"
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
          </SiAvatar>
          <span class="si-cell-strong">{{ item.insurerCorporateName }}</span>
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
          <SiTooltip text="Editar habilitação">
            <template #activator="{ props: tip }">
              <SiIconButton
                v-bind="tip"
                icon="pencil"
                aria-label="Editar habilitação"
                @click="openEditDialog(item)"
              />
            </template>
          </SiTooltip>

          <SiMenu location="bottom end">
            <template #activator="{ props: menu }">
              <SiIconButton
                v-bind="menu"
                icon="dotsHorizontal"
                aria-label="Mais ações"
              />
            </template>
            <SiList
              density="compact"
              class="si-rowmenu"
            >
              <SiListItem
                title="Editar habilitação"
                @click="openEditDialog(item)"
              />
              <SiListItem
                :title="getEnablementStatusAction(item.status).label"
                :disabled="getEnablementStatusAction(item.status).disabled"
                :class="getEnablementStatusAction(item.status).color === 'error' ? 'si-rowmenu__danger' : undefined"
                @click="openStatusDialog(item)"
              />
            </SiList>
          </SiMenu>
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
            :items="insurerOptions"
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

/* ─── Desktop: tabela DS (mesma linguagem da listagem de Corretoras) ───────── */
.si-enablements__table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.si-enablements__table :deep(td),
.si-enablements__table :deep(th) {
  overflow: hidden;
}

.si-enablements__insurer {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  min-width: 0;
}

.si-enablements__insurer .si-cell-strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.si-enablements__insurer-logo {
  border: 1px solid var(--si-cinza-claro);
  background: rgb(var(--v-theme-surface));
  flex-shrink: 0;
}

.si-enablements__insurer-logo :deep(.v-img__img) {
  object-fit: contain;
  padding: var(--si-space-1);
}

.si-enablements__insurer-initials {
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-enablements__meta {
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.si-enablements__row-actions,
.si-enablements__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-rowmenu__danger :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-error));
}

/* ─── Mobile: cards (mesma primitiva visual da listagem de Corretoras) ─────── */
.si-enablements-cards__progress {
  margin-bottom: var(--si-space-2);
}

.si-enablements-cards {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-enablements-cards__item {
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-lg);
  padding: var(--si-space-3) var(--si-space-4);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
}

.si-enablements-cards__main {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-enablements-cards__identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.si-enablements-cards__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  border-top: 1px solid var(--si-cinza-claro);
  padding-top: var(--si-space-2);
}

.si-enablements__empty {
  padding: var(--si-space-8) var(--si-space-4);
  text-align: center;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}
</style>
