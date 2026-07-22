<script setup lang="ts">
/**
 * Grupos de Modalidade — cadastro (RN-029: catálogo curado, escrita restrita ao Administrador;
 * RN-036: nunca exclui, só alterna Ativa/Inativa). Página orquestradora fina (ADR-018): mantém
 * o estado de tela, chama o composable de dados e compõe os componentes de domínio (filtro,
 * tabela responsiva, dialog de formulário, dialog de situação). Sem markup denso aqui.
 */
import type { ModalityGroupListItem } from '~/composables/useModalityGroups'
import { mdiPlus, mdiRefresh } from '~/lib/icons'
import { getModalityGroupStatusAction } from '~/lib/status/modality-groups'

definePageMeta({ layout: 'shell' })

const {
  listModalityGroups,
  createModalityGroup,
  updateModalityGroup,
  changeModalityGroupStatus,
} = useModalityGroups()

const items = ref<ModalityGroupListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const saving = ref(false)
const includeInactive = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formOpen = ref(false)
const editingGroup = ref<ModalityGroupListItem | null>(null)

const statusDialogOpen = ref(false)
const selectedGroup = ref<ModalityGroupListItem | null>(null)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listModalityGroups({ includeInactive: includeInactive.value })
    items.value = [...response.items]
    totalCount.value = Number(response.totalCount)
  }
  catch {
    error.value = 'Não foi possível carregar os Grupos de Modalidade.'
  }
  finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingGroup.value = null
  success.value = null
  formOpen.value = true
}

function openEditDialog(group: ModalityGroupListItem) {
  editingGroup.value = group
  success.value = null
  formOpen.value = true
}

async function submitForm(payload: { name: string, description: string | null, displayOrder: number }) {
  saving.value = true
  error.value = null
  success.value = null

  const editing = editingGroup.value

  try {
    if (editing) {
      await updateModalityGroup(editing.id, payload)
      success.value = 'Grupo de Modalidade atualizado.'
    }
    else {
      await createModalityGroup(payload)
      success.value = 'Grupo de Modalidade cadastrado.'
    }

    formOpen.value = false
    await refresh()
  }
  catch {
    error.value = editing
      ? 'Não foi possível atualizar o Grupo de Modalidade.'
      : 'Não foi possível cadastrar o Grupo de Modalidade.'
  }
  finally {
    saving.value = false
  }
}

function openStatusDialog(group: ModalityGroupListItem) {
  if (getModalityGroupStatusAction(group.status).disabled) return

  selectedGroup.value = group
  success.value = null
  statusDialogOpen.value = true
}

async function confirmStatusChange() {
  const group = selectedGroup.value
  const action = group ? getModalityGroupStatusAction(group.status) : null
  if (!group || !action?.targetStatus) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await changeModalityGroupStatus(group.id, action.targetStatus)
    success.value = action.successMessage
    statusDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível alterar a situação do Grupo de Modalidade.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <VContainer class="si-modality-groups">
    <div class="si-modality-groups__header">
      <h1 class="text-h5">
        Grupos de Modalidade
      </h1>

      <div class="si-modality-groups__header-actions">
        <SiButton
          :prepend-icon="mdiRefresh"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>

        <SiButton
          :prepend-icon="mdiPlus"
          @click="openCreateDialog"
        >
          Novo Grupo de Modalidade
        </SiButton>
      </div>
    </div>

    <SiCard
      class="si-modality-groups__card"
      variant="outlined"
    >
      <div class="si-modality-groups__toolbar">
        <div class="si-modality-groups__count">
          {{ totalCount }} Grupo{{ totalCount === 1 ? '' : 's' }} de Modalidade
        </div>

        <ModalityGroupsStatusFilter
          v-model="includeInactive"
          @update:model-value="refresh"
        />
      </div>

      <SiAlert
        v-if="error"
        type="error"
        class="mx-4 mb-4"
        :text="error"
      />

      <SiAlert
        v-if="success"
        type="success"
        class="mx-4 mb-4"
        :text="success"
      />

      <ModalityGroupsTable
        :items="items"
        :loading="loading"
        @edit="openEditDialog"
        @change-status="openStatusDialog"
      />
    </SiCard>

    <ModalityGroupsFormDialog
      v-model="formOpen"
      :group="editingGroup"
      :saving="saving"
      @submit="submitForm"
    />

    <ModalityGroupsStatusChangeDialog
      v-model="statusDialogOpen"
      :group="selectedGroup"
      :loading="saving"
      @confirm="confirmStatusChange"
    />
  </VContainer>
</template>

<style scoped>
.si-modality-groups {
  max-width: var(--si-container-wide);
}

.si-modality-groups__header,
.si-modality-groups__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-modality-groups__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-modality-groups__header h1 {
  margin: 0;
}

.si-modality-groups__header-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-modality-groups__card {
  overflow: hidden;
}

.si-modality-groups__toolbar {
  padding: var(--si-space-4);
}

.si-modality-groups__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

/* Mobile-first (ADR-017): header e toolbar empilham no xs; ficam em linha a partir de sm. */
@media (max-width: 599.98px) {
  .si-modality-groups__header,
  .si-modality-groups__toolbar,
  .si-modality-groups__header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
