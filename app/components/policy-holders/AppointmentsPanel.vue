<script setup lang="ts">
import type { BrokerageListItem } from '~/composables/useBrokerages'
import type { InsurerListItemResponse } from '~/composables/useInsurers'
import type { PolicyHolderAppointment } from '~/composables/usePolicyHolders'
import { required } from '~/lib/rules'
import { getPolicyHolderAppointmentStatusView, canEndPolicyHolderAppointment } from '~/lib/status/policyHolderAppointments'

const props = withDefaults(defineProps<{ policyHolderId: string, appointments: PolicyHolderAppointment[], hideToolbar?: boolean }>(), {
  hideToolbar: false,
})

const emit = defineEmits<{ changed: [] }>()

const {
  createAppointment,
  endAppointment,
} = usePolicyHolders()
const { listBrokerages } = useBrokerages()
const { listInsurers } = useInsurers()

const brokerages = ref<BrokerageListItem[]>([])
const insurers = ref<InsurerListItemResponse[]>([])
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const headers = [
  { title: 'Corretora', key: 'brokerageName' },
  { title: 'Seguradora', key: 'insurerName' },
  { title: 'Status', key: 'status' },
  { title: 'Período', key: 'period' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
]

/** Formulário do dialog (criar). */
const formOpen = ref(false)
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const form = reactive({
  brokerageId: null as string | null,
  insurerId: null as string | null,
})

/** Confirmação de substituir nomeação. */
const confirmOpen = ref(false)
const existingAppointment = ref<PolicyHolderAppointment | null>(null)
const confirmSubmitting = ref(false)

/** Confirmação de encerrar nomeação. */
const endConfirmOpen = ref(false)
const appointmentToEnd = ref<PolicyHolderAppointment | null>(null)

defineExpose({ openCreateDialog })

function openCreateDialog() {
  form.brokerageId = null
  form.insurerId = null
  success.value = null
  formOpen.value = true

  // Load brokerages and insurers
  loadFormData()
}

async function loadFormData() {
  try {
    const [brokeragesPage, insurersPage] = await Promise.all([
      listBrokerages({ status: 'Active', pageSize: 100 }),
      listInsurers({ status: 'Active', pageSize: 100 }),
    ])
    brokerages.value = brokeragesPage.items
    insurers.value = insurersPage.items
  }
  catch {
    error.value = 'Não foi possível carregar dados para a nomeação.'
  }
}

async function submitForm() {
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return

  if (!form.brokerageId || !form.insurerId) return

  // Check if there's already an active appointment for this insurer WITH A DIFFERENT BROKERAGE (RN-028)
  const existing = props.appointments.find(
    a => a.insurerId === form.insurerId && a.status === 'Active' && a.brokerageId !== form.brokerageId,
  )

  if (existing) {
    // Show confirmation dialog for replacement
    existingAppointment.value = existing
    confirmOpen.value = true
    return
  }

  // No existing appointment with different brokerage, create directly
  await createNewAppointment()
}

async function createNewAppointment() {
  if (!form.brokerageId || !form.insurerId) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await createAppointment(props.policyHolderId, {
      brokerageId: form.brokerageId,
      insurerId: form.insurerId,
    })
    success.value = 'Nomeação criada.'
    formOpen.value = false
    emit('changed')
  }
  catch (err) {
    // Check if it's a 409 conflict (same broker already appointed)
    const errorObj = err as { status?: number, data?: { detail?: string } }
    if (typeof err === 'object' && err !== null && 'status' in err && errorObj.status === 409) {
      // Show message from ProblemDetails
      error.value = errorObj.data?.detail || 'Esta corretora já possui uma nomeação vigente para esta seguradora.'
    }
    else {
      error.value = 'Não foi possível criar a nomeação.'
    }
  }
  finally {
    saving.value = false
  }
}

async function confirmReplaceAppointment() {
  // Just create the new appointment - backend handles replacement atomically (RN-028)
  confirmSubmitting.value = true
  error.value = null
  success.value = null

  try {
    confirmOpen.value = false
    existingAppointment.value = null
    await createNewAppointment()
  }
  catch {
    error.value = 'Não foi possível executar a ação.'
  }
  finally {
    confirmSubmitting.value = false
  }
}

function endAppointmentAction(appointment: PolicyHolderAppointment) {
  if (!canEndPolicyHolderAppointment(appointment.status)) return

  appointmentToEnd.value = appointment
  endConfirmOpen.value = true
}

async function confirmEndAppointment() {
  const appointment = appointmentToEnd.value
  if (!appointment) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await endAppointment(props.policyHolderId, appointment.id)
    success.value = 'Nomeação encerrada.'
    endConfirmOpen.value = false
    appointmentToEnd.value = null
    emit('changed')
  }
  catch {
    error.value = 'Não foi possível encerrar a nomeação.'
  }
  finally {
    saving.value = false
  }
}

function formatDateRange(appointment: PolicyHolderAppointment): string {
  const start = appointment.startedAt.split('T')[0]
  const end = appointment.endedAt ? appointment.endedAt.split('T')[0] : null
  return end ? `${start} a ${end}` : `Desde ${start}`
}
</script>

<template>
  <section class="si-policy-holder-appointments-panel">
    <div
      v-if="!props.hideToolbar"
      class="si-policy-holder-appointments-panel__toolbar"
    >
      <SiButton
        :prepend-icon="'plus'"
        @click="openCreateDialog"
      >
        Nova nomeação
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

    <div class="si-policy-holder-appointments-panel__table">
      <SiDataTable
        :headers="headers"
        :items="props.appointments"
      >
        <template #[`item.status`]="{ item }">
          <SiChip
            :color="getPolicyHolderAppointmentStatusView(item.status).color"
            size="small"
          >
            {{ getPolicyHolderAppointmentStatusView(item.status).label }}
          </SiChip>
        </template>

        <template #[`item.period`]="{ item }">
          {{ formatDateRange(item) }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-policy-holder-appointments-panel__row-actions">
            <SiButton
              v-if="canEndPolicyHolderAppointment(item.status)"
              variant="text"
              size="small"
              color="error"
              :loading="saving"
              @click="endAppointmentAction(item)"
            >
              Encerrar
            </SiButton>
          </div>
        </template>

        <template #no-data>
          Nenhuma nomeação registrada.
        </template>
      </SiDataTable>
    </div>

    <SiDialog v-model="formOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          Nova nomeação
        </h2>

        <SiForm
          ref="formRef"
          @submit.prevent="submitForm"
        >
          <div class="si-policy-holder-appointments-panel__form-grid">
            <SiSelect
              v-model="form.brokerageId"
              label="Corretora"
              :items="brokerages"
              item-title="name"
              item-value="id"
              :rules="[required()]"
              density="compact"
            />

            <SiSelect
              v-model="form.insurerId"
              label="Seguradora"
              :items="insurers"
              item-title="corporateName"
              item-value="id"
              :rules="[required()]"
              density="compact"
            />
          </div>

          <div class="si-policy-holder-appointments-panel__dialog-actions">
            <SiButton
              variant="text"
              @click="formOpen = false"
            >
              Cancelar
            </SiButton>

            <SiButton
              type="submit"
              :loading="saving"
            >
              Salvar
            </SiButton>
          </div>
        </SiForm>
      </SiCard>
    </SiDialog>

    <SiDialog v-model="confirmOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          Substituir nomeação?
        </h2>

        <p class="mb-5">
          Substituirá a nomeação vigente da corretora {{ existingAppointment?.brokerageName }}?
        </p>

        <div class="si-policy-holder-appointments-panel__dialog-actions">
          <SiButton
            variant="text"
            @click="confirmOpen = false"
          >
            Cancelar
          </SiButton>

          <SiButton
            color="error"
            :loading="confirmSubmitting"
            @click="confirmReplaceAppointment"
          >
            Confirmar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>

    <SiDialog v-model="endConfirmOpen">
      <SiCard class="pa-5">
        <h2 class="text-h6 mb-3">
          Encerrar nomeação?
        </h2>

        <p class="mb-5">
          Encerrará a nomeação vigente da corretora {{ appointmentToEnd?.brokerageName }} para a seguradora {{ appointmentToEnd?.insurerName }}. O tomador ficará sem corretora nomeada para essa seguradora.
        </p>

        <div class="si-policy-holder-appointments-panel__dialog-actions">
          <SiButton
            variant="text"
            @click="endConfirmOpen = false"
          >
            Cancelar
          </SiButton>

          <SiButton
            color="error"
            :loading="saving"
            @click="confirmEndAppointment"
          >
            Confirmar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </section>
</template>

<style scoped>
.si-policy-holder-appointments-panel__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--si-space-3);
}

.si-policy-holder-appointments-panel__table {
  overflow-x: auto;
}

.si-policy-holder-appointments-panel__row-actions,
.si-policy-holder-appointments-panel__dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

.si-policy-holder-appointments-panel__form-grid {
  display: grid;
  gap: var(--si-space-3);
  margin-bottom: var(--si-space-4);
}
</style>
