<script setup lang="ts">
/**
 * Modalidades — cadastro (RN-029: catálogo importado e curado, escrita restrita ao Administrador;
 * não há Grupo de Modalidade no lado Smart — ADR-061; RN-036: nunca exclui, só alterna
 * Ativa/Inativa). Página orquestradora fina (ADR-018): mantém o estado de tela, chama os
 * composables de dados e compõe os componentes de domínio (filtro, tabela responsiva, dialog de
 * formulário, dialog de situação). Sem markup denso aqui.
 */
import type { ModalityListItem } from '~/composables/useModalities'
import { mdiPlus, mdiRefresh } from '~/lib/icons'
import { getModalityStatusAction } from '~/lib/status/modalities'

definePageMeta({ layout: 'shell' })

const {
  listModalities,
  createModality,
  updateModality,
  changeModalityStatus,
} = useModalities()

const items = ref<ModalityListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const saving = ref(false)
const includeInactive = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formOpen = ref(false)
const editingModality = ref<ModalityListItem | null>(null)

const statusDialogOpen = ref(false)
const selectedModality = ref<ModalityListItem | null>(null)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const modalitiesPage = await listModalities({ includeInactive: includeInactive.value })
    items.value = [...modalitiesPage.items]
    totalCount.value = Number(modalitiesPage.totalCount)
  }
  catch {
    error.value = 'Não foi possível carregar as Modalidades.'
  }
  finally {
    loading.value = false
  }
}

function openCreateDialog() {
  editingModality.value = null
  success.value = null
  formOpen.value = true
}

function openEditDialog(modality: ModalityListItem) {
  editingModality.value = modality
  success.value = null
  formOpen.value = true
}

async function submitForm(payload: { name: string, description: string | null }) {
  saving.value = true
  error.value = null
  success.value = null

  const editing = editingModality.value

  try {
    if (editing) {
      await updateModality(editing.id, payload)
      success.value = 'Modalidade atualizada.'
    }
    else {
      await createModality(payload)
      success.value = 'Modalidade cadastrada.'
    }

    formOpen.value = false
    await refresh()
  }
  catch {
    error.value = editing
      ? 'Não foi possível atualizar a Modalidade.'
      : 'Não foi possível cadastrar a Modalidade.'
  }
  finally {
    saving.value = false
  }
}

function openStatusDialog(modality: ModalityListItem) {
  if (getModalityStatusAction(modality.status).disabled) return

  selectedModality.value = modality
  success.value = null
  statusDialogOpen.value = true
}

async function confirmStatusChange() {
  const modality = selectedModality.value
  const action = modality ? getModalityStatusAction(modality.status) : null
  if (!modality || !action?.targetStatus) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await changeModalityStatus(modality.id, action.targetStatus)
    success.value = action.successMessage
    statusDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível alterar a situação da Modalidade.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <VContainer class="si-modalities">
    <div class="si-modalities__header">
      <h1 class="text-h5">
        Modalidades
      </h1>

      <div class="si-modalities__header-actions">
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
          Nova Modalidade
        </SiButton>
      </div>
    </div>

    <SiCard
      class="si-modalities__card"
      variant="outlined"
    >
      <div class="si-modalities__toolbar">
        <div class="si-modalities__count">
          {{ totalCount }} Modalidade{{ totalCount === 1 ? '' : 's' }}
        </div>

        <ModalitiesStatusFilter
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

      <ModalitiesTable
        :items="items"
        :loading="loading"
        @edit="openEditDialog"
        @change-status="openStatusDialog"
      />
    </SiCard>

    <ModalitiesFormDialog
      v-model="formOpen"
      :modality="editingModality"
      :saving="saving"
      @submit="submitForm"
    />

    <ModalitiesStatusChangeDialog
      v-model="statusDialogOpen"
      :modality="selectedModality"
      :loading="saving"
      @confirm="confirmStatusChange"
    />
  </VContainer>
</template>

<style scoped>
.si-modalities {
  max-width: var(--si-container-wide);
}

.si-modalities__header,
.si-modalities__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-modalities__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-modalities__header h1 {
  margin: 0;
}

.si-modalities__header-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-modalities__card {
  overflow: hidden;
}

.si-modalities__toolbar {
  padding: var(--si-space-4);
}

.si-modalities__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

/* Mobile-first (ADR-017): header e toolbar empilham no xs; ficam em linha a partir de sm. */
@media (max-width: 599.98px) {
  .si-modalities__header,
  .si-modalities__toolbar,
  .si-modalities__header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
