<script setup lang="ts">
/**
 * Mapa de Modalidades (RN-033) + Fila de Revisão (RN-034) na MESMA tela: a matriz Seguradoras ×
 * Modalidades e o recorte de exceções/curadoria (pendências) convivem, não são páginas separadas.
 * Página orquestradora fina (ADR-018): mantém o estado de tela, chama os composables e compõe os
 * componentes de domínio (matriz, fila, dialogs). Nenhuma regra de negócio aqui — oferta e ramos
 * são derivados no servidor (RN-033). Como o vínculo vem pronto pela Modalidade Global (ADR-061),
 * a Fila só faz curadoria.
 *
 * Ações da Fila: Reatribuir (define manualmente a Modalidade da Importada → /reassign), Ignorar
 * (→ /ignore) e Reativar (desfaz o Ignorar → /restore).
 */
import type { ModalityListItem } from '~/composables/useModalities'
import type { ModalityMapEntry, PendingImportedModality } from '~/composables/useModalityMap'
import { mdiRefresh, mdiSitemapOutline } from '~/lib/icons'

definePageMeta({ layout: 'shell' })

const {
  getModalityMap,
  reassignImportedModality,
  ignoreImportedModality,
  restoreImportedModality,
} = useModalityMap()
const { listModalities } = useModalities()

// Feature-flag (OPEN-14): a Fila de Revisão fica OCULTA por padrão. A implementação permanece
// intacta (composables, ações, dialogs); só a exibição é condicionada. Reexibir só quando o
// cadastro manual de Modalidades / tratamento de exceções for decidido — ver open-decisions OPEN-14.
const runtimeConfig = useRuntimeConfig()
const reviewQueueVisible = computed(() => runtimeConfig.public.modalityReviewQueue === true)

const entries = ref<ModalityMapEntry[]>([])
const pending = ref<PendingImportedModality[]>([])
const modalities = ref<ModalityListItem[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const reassignDialogOpen = ref(false)
const ignoreDialogOpen = ref(false)
const selectedPending = ref<PendingImportedModality | null>(null)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    // A matriz + a Fila vêm juntas do mapa; a lista de Modalidades alimenta o Reatribuir.
    const [map, modalitiesPage] = await Promise.all([
      getModalityMap(),
      listModalities({ pageSize: 100 }),
    ])
    entries.value = [...map.modalities]
    pending.value = [...map.pending]
    modalities.value = [...modalitiesPage.items]
  }
  catch {
    error.value = 'Não foi possível carregar o Mapa de Modalidades.'
  }
  finally {
    loading.value = false
  }
}

function openReassignDialog(item: PendingImportedModality) {
  selectedPending.value = item
  success.value = null
  reassignDialogOpen.value = true
}

function openIgnoreDialog(item: PendingImportedModality) {
  selectedPending.value = item
  success.value = null
  ignoreDialogOpen.value = true
}

async function confirmReassign(modalityId: string) {
  const item = selectedPending.value
  if (!item) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await reassignImportedModality(item.importedModalityId, modalityId)
    success.value = 'Modalidade Importada reatribuída.'
    reassignDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível reatribuir a Modalidade Importada.'
  }
  finally {
    saving.value = false
  }
}

async function confirmIgnore() {
  const item = selectedPending.value
  if (!item) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await ignoreImportedModality(item.importedModalityId)
    success.value = 'Modalidade Importada ignorada.'
    ignoreDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível ignorar a Modalidade Importada.'
  }
  finally {
    saving.value = false
  }
}

// Reativar (RN-034): desfaz o Ignorar direto, sem dialog de confirmação.
async function restore(item: PendingImportedModality) {
  saving.value = true
  error.value = null
  success.value = null

  try {
    await restoreImportedModality(item.importedModalityId)
    success.value = 'Modalidade Importada reativada.'
    await refresh()
  }
  catch {
    error.value = 'Não foi possível reativar a Modalidade Importada.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <VContainer class="si-modality-map">
    <div class="si-modality-map__header">
      <h1 class="text-h5">
        Mapa de Modalidades
      </h1>

      <SiButton
        :prepend-icon="mdiRefresh"
        variant="tonal"
        :loading="loading"
        @click="refresh"
      >
        Atualizar
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

    <!-- Fila de Revisão (RN-034) na MESMA tela. Oculta por feature-flag (OPEN-14); implementação intacta. -->
    <SiCard
      v-if="reviewQueueVisible"
      class="si-modality-map__card si-modality-map__card--queue"
      variant="outlined"
    >
      <div class="si-modality-map__section">
        <div class="si-modality-map__section-title">
          <SiIcon :icon="mdiSitemapOutline" />
          <h2 class="text-h6">
            Fila de Revisão
          </h2>
          <SiChip
            v-if="pending.length"
            color="warning"
            size="small"
          >
            {{ pending.length }} pendente{{ pending.length === 1 ? '' : 's' }}
          </SiChip>
        </div>
        <p class="si-modality-map__section-hint">
          Exceções da importação: Modalidades Importadas sem uma Modalidade vinculada. Resolva cada
          uma: Reatribuir para uma Modalidade, Ignorar ou Reativar.
        </p>
      </div>

      <ModalityMapReviewQueue
        :items="pending"
        :loading="loading"
        :busy="saving"
        @reassign="openReassignDialog"
        @ignore="openIgnoreDialog"
        @restore="restore"
      />
    </SiCard>

    <SiCard
      class="si-modality-map__card"
      variant="outlined"
    >
      <div class="si-modality-map__section">
        <div class="si-modality-map__section-title">
          <h2 class="text-h6">
            Seguradoras por Modalidade
          </h2>
          <span class="si-modality-map__count">
            {{ entries.length }} Modalidade{{ entries.length === 1 ? '' : 's' }}
          </span>
        </div>
        <p class="si-modality-map__section-hint">
          Uma Modalidade é ofertada quando tem ao menos uma Modalidade Importada Ativa e não
          Ignorada vinculada. Disponibilidade por ramo é derivada, nunca digitada.
        </p>
      </div>

      <ModalityMapMatrix
        :entries="entries"
        :loading="loading"
      />
    </SiCard>

    <ModalityMapReassignDialog
      v-model="reassignDialogOpen"
      :pending="selectedPending"
      :modalities="modalities"
      :saving="saving"
      @confirm="confirmReassign"
    />

    <ModalityMapIgnoreDialog
      v-model="ignoreDialogOpen"
      :pending="selectedPending"
      :loading="saving"
      @confirm="confirmIgnore"
    />
  </VContainer>
</template>

<style scoped>
.si-modality-map {
  max-width: var(--si-container-wide);
}

.si-modality-map__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-modality-map__header h1 {
  margin: 0;
}

.si-modality-map__card {
  overflow: hidden;
  margin-bottom: var(--si-space-4);
}

.si-modality-map__card--queue {
  border-color: rgb(var(--v-theme-warning));
}

.si-modality-map__section {
  padding: var(--si-space-4) var(--si-space-4) 0;
}

.si-modality-map__section-title {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-modality-map__section-title h2 {
  margin: 0;
}

.si-modality-map__section-hint {
  margin: var(--si-space-2) 0 0;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-modality-map__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

/* Mobile-first (ADR-017): header empilha no xs. */
@media (max-width: 599.98px) {
  .si-modality-map__header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
