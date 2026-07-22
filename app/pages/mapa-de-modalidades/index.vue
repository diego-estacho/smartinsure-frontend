<script setup lang="ts">
/**
 * Mapa de Modalidades (RN-033) + Fila de Revisão (RN-034) na MESMA tela: a matriz Seguradoras ×
 * Modalidades e o recorte "precisa de decisão" (pendências) convivem, não são páginas separadas.
 * Página orquestradora fina (ADR-018): mantém o estado de tela, chama os composables e compõe os
 * componentes de domínio (matriz, fila, dialogs). Nenhuma regra de negócio aqui — oferta, ramos e
 * a trava de ramo do mapeamento são decididos no servidor (RN-033/RN-034). Sem markup denso.
 *
 * Ações da Fila: Mapear (Modalidade existente → /map), Promover (cria Modalidade via o cadastro
 * da fatia 1 e mapeia a pendência a ela) e Ignorar (→ /ignore).
 */
import type { ModalityListItem } from '~/composables/useModalities'
import type { ModalityGroupListItem } from '~/composables/useModalityGroups'
import type { ModalityMapEntry, PendingImportedModality } from '~/composables/useModalityMap'
import { mdiRefresh, mdiSitemapOutline } from '~/lib/icons'

definePageMeta({ layout: 'shell' })

const { getModalityMap, mapImportedModality, ignoreImportedModality } = useModalityMap()
const { listModalities, createModality } = useModalities()
const { listModalityGroups } = useModalityGroups()

const entries = ref<ModalityMapEntry[]>([])
const pending = ref<PendingImportedModality[]>([])
const modalities = ref<ModalityListItem[]>([])
const groups = ref<ModalityGroupListItem[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const mapDialogOpen = ref(false)
const ignoreDialogOpen = ref(false)
const promoteDialogOpen = ref(false)
const selectedPending = ref<PendingImportedModality | null>(null)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    // A matriz + a Fila vêm juntas do mapa; a lista de Modalidades alimenta o Mapear e os Grupos
    // (Ativos) alimentam o Promover (cadastro da fatia 1).
    const [map, modalitiesPage, groupsPage] = await Promise.all([
      getModalityMap(),
      listModalities({ pageSize: 100 }),
      listModalityGroups({ pageSize: 100 }),
    ])
    entries.value = [...map.modalities]
    pending.value = [...map.pending]
    modalities.value = [...modalitiesPage.items]
    groups.value = [...groupsPage.items]
  }
  catch {
    error.value = 'Não foi possível carregar o Mapa de Modalidades.'
  }
  finally {
    loading.value = false
  }
}

function openMapDialog(item: PendingImportedModality) {
  selectedPending.value = item
  success.value = null
  mapDialogOpen.value = true
}

function openPromoteDialog(item: PendingImportedModality) {
  selectedPending.value = item
  success.value = null
  promoteDialogOpen.value = true
}

function openIgnoreDialog(item: PendingImportedModality) {
  selectedPending.value = item
  success.value = null
  ignoreDialogOpen.value = true
}

async function confirmMap(modalityId: string) {
  const item = selectedPending.value
  if (!item) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await mapImportedModality(item.importedModalityId, modalityId)
    success.value = 'Modalidade Importada mapeada.'
    mapDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível mapear a Modalidade Importada.'
  }
  finally {
    saving.value = false
  }
}

// Promover (RN-034): cria a Modalidade no cadastro da fatia 1 e mapeia a pendência a ela.
async function confirmPromote(payload: { name: string, modalityGroupId: string, description: string | null }) {
  const item = selectedPending.value
  if (!item) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    const created = await createModality(payload)
    await mapImportedModality(item.importedModalityId, created.id)
    success.value = 'Modalidade criada e mapeada.'
    promoteDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível promover a Modalidade Importada.'
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

    <!-- Fila de Revisão evidenciada NA MESMA tela (RN-034): destacada no topo quando há pendência. -->
    <SiCard
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
          Modalidades Importadas que a importação não mapeou com segurança. Resolva cada pendência:
          Mapear para uma Modalidade existente, Promover (criar uma nova) ou Ignorar.
        </p>
      </div>

      <ModalityMapReviewQueue
        :items="pending"
        :loading="loading"
        :busy="saving"
        @map="openMapDialog"
        @promote="openPromoteDialog"
        @ignore="openIgnoreDialog"
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
          Uma Modalidade é ofertada quando tem ao menos uma Modalidade Importada Ativa com
          mapeamento confirmado. Disponibilidade por ramo é derivada, nunca digitada.
        </p>
      </div>

      <ModalityMapMatrix
        :entries="entries"
        :loading="loading"
      />
    </SiCard>

    <ModalityMapMappingDialog
      v-model="mapDialogOpen"
      :pending="selectedPending"
      :modalities="modalities"
      :saving="saving"
      @confirm="confirmMap"
    />

    <ModalityMapIgnoreDialog
      v-model="ignoreDialogOpen"
      :pending="selectedPending"
      :loading="saving"
      @confirm="confirmIgnore"
    />

    <!-- Promover reaproveita o cadastro de Modalidade da fatia 1 (RN-034 → RN-029). -->
    <ModalitiesFormDialog
      v-model="promoteDialogOpen"
      :modality="null"
      :groups="groups"
      :saving="saving"
      @submit="confirmPromote"
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
