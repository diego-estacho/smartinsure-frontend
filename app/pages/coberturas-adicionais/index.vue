<script setup lang="ts">
/**
 * Curadoria de Coberturas Adicionais (RN-040..RN-046) numa única tela: o catálogo canônico
 * (Coberturas Adicionais com as Importadas Ativas vinculadas) e a Fila de pendências de mapeamento
 * (Importadas Ativas sem vínculo) convivem — não são páginas separadas. Restrita ao Administrador
 * do Sistema (decidido no servidor, RN-040). Página orquestradora fina (ADR-018): mantém o estado
 * de tela, chama os composables e compõe os componentes de domínio. Nenhuma regra de negócio aqui:
 * o vínculo é manual (RN-043) e a disponibilidade é derivada no servidor (RN-046).
 *
 * Diferente do Mapa de Modalidades, a Fila NÃO é ocultada por feature-flag: o vínculo é manual e as
 * pendências são o fluxo normal da curadoria. Ações da Fila: Vincular (escolher a canônica alvo →
 * /link), Ignorar (→ /ignore) e Reativar (desfaz o Ignorar → /restore). No catálogo, cada Importada
 * vinculada pode ser Desvinculada (→ /unlink), voltando a ficar pendente.
 */
import type {
  CanonicalCoverageItem,
  LinkedCoverageItem,
  PendingCoverageItem,
} from '~/composables/useAdditionalCoverageMap'
import { getAdditionalCoverageStatusAction } from '~/lib/status/additionalCoverages'

definePageMeta({ layout: 'shell' })

const {
  getAdditionalCoverageMap,
  linkImportedCoverage,
  unlinkImportedCoverage,
  ignoreImportedCoverage,
  restoreImportedCoverage,
} = useAdditionalCoverageMap()
const {
  createAdditionalCoverage,
  updateAdditionalCoverage,
  changeAdditionalCoverageStatus,
} = useAdditionalCoverages()

const coverages = ref<CanonicalCoverageItem[]>([])
const pending = ref<PendingCoverageItem[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const formOpen = ref(false)
const editingCoverage = ref<CanonicalCoverageItem | null>(null)

const statusDialogOpen = ref(false)
const selectedCoverage = ref<CanonicalCoverageItem | null>(null)

const linkDialogOpen = ref(false)
const ignoreDialogOpen = ref(false)
const selectedPending = ref<PendingCoverageItem | null>(null)

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const map = await getAdditionalCoverageMap()
    coverages.value = [...map.coverages]
    pending.value = [...map.pending]
  }
  catch {
    error.value = 'Não foi possível carregar as Coberturas Adicionais.'
  }
  finally {
    loading.value = false
  }
}

// --- Catálogo canônico (RN-040) ---

function openCreateDialog() {
  editingCoverage.value = null
  success.value = null
  formOpen.value = true
}

function openEditDialog(coverage: CanonicalCoverageItem) {
  editingCoverage.value = coverage
  success.value = null
  formOpen.value = true
}

async function submitForm(payload: { name: string }) {
  saving.value = true
  error.value = null
  success.value = null

  const editing = editingCoverage.value

  try {
    if (editing) {
      await updateAdditionalCoverage(editing.id, payload)
      success.value = 'Cobertura Adicional atualizada.'
    }
    else {
      await createAdditionalCoverage(payload)
      success.value = 'Cobertura Adicional cadastrada.'
    }

    formOpen.value = false
    await refresh()
  }
  catch {
    error.value = editing
      ? 'Não foi possível atualizar a Cobertura Adicional.'
      : 'Não foi possível cadastrar a Cobertura Adicional.'
  }
  finally {
    saving.value = false
  }
}

function openStatusDialog(coverage: CanonicalCoverageItem) {
  if (getAdditionalCoverageStatusAction(coverage.status).disabled) return

  selectedCoverage.value = coverage
  success.value = null
  statusDialogOpen.value = true
}

async function confirmStatusChange() {
  const coverage = selectedCoverage.value
  const action = coverage ? getAdditionalCoverageStatusAction(coverage.status) : null
  if (!coverage || !action?.targetStatus) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await changeAdditionalCoverageStatus(coverage.id, action.targetStatus)
    success.value = action.successMessage
    statusDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível alterar a situação da Cobertura Adicional.'
  }
  finally {
    saving.value = false
  }
}

// --- Vínculo manual (RN-043) ---

// Desvincular (RN-043): desfaz o vínculo direto, sem dialog — a Importada volta à Fila.
async function unlink(linked: LinkedCoverageItem) {
  saving.value = true
  error.value = null
  success.value = null

  try {
    await unlinkImportedCoverage(linked.importedCoverageId)
    success.value = 'Cobertura Adicional Importada desvinculada.'
    await refresh()
  }
  catch {
    error.value = 'Não foi possível desvincular a Cobertura Adicional Importada.'
  }
  finally {
    saving.value = false
  }
}

function openLinkDialog(item: PendingCoverageItem) {
  selectedPending.value = item
  success.value = null
  linkDialogOpen.value = true
}

function openIgnoreDialog(item: PendingCoverageItem) {
  selectedPending.value = item
  success.value = null
  ignoreDialogOpen.value = true
}

async function confirmLink(additionalCoverageId: string) {
  const item = selectedPending.value
  if (!item) return

  saving.value = true
  error.value = null
  success.value = null

  try {
    await linkImportedCoverage(item.id, additionalCoverageId)
    success.value = 'Cobertura Adicional Importada vinculada.'
    linkDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível vincular a Cobertura Adicional Importada.'
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
    await ignoreImportedCoverage(item.id)
    success.value = 'Cobertura Adicional Importada ignorada.'
    ignoreDialogOpen.value = false
    await refresh()
  }
  catch {
    error.value = 'Não foi possível ignorar a Cobertura Adicional Importada.'
  }
  finally {
    saving.value = false
  }
}

// Reativar (RN-043): desfaz o Ignorar direto, sem dialog de confirmação.
async function restore(item: PendingCoverageItem) {
  saving.value = true
  error.value = null
  success.value = null

  try {
    await restoreImportedCoverage(item.id)
    success.value = 'Cobertura Adicional Importada reativada.'
    await refresh()
  }
  catch {
    error.value = 'Não foi possível reativar a Cobertura Adicional Importada.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <VContainer class="si-additional-coverages">
    <div class="si-additional-coverages__header">
      <h1 class="text-h5">
        Coberturas Adicionais
      </h1>

      <div class="si-additional-coverages__header-actions">
        <SiButton
          :prepend-icon="'refresh'"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>

        <SiButton
          :prepend-icon="'plus'"
          @click="openCreateDialog"
        >
          Nova Cobertura Adicional
        </SiButton>
      </div>
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

    <!-- Fila de pendências (RN-043): SEMPRE visível — o vínculo é manual e as pendências são o fluxo normal. -->
    <SiCard
      class="si-additional-coverages__card si-additional-coverages__card--queue"
      variant="outlined"
    >
      <div class="si-additional-coverages__section">
        <div class="si-additional-coverages__section-title">
          <SiIcon icon="sitemap" />
          <h2 class="text-h6">
            Pendentes de mapeamento
          </h2>
          <SiChip
            v-if="pending.length"
            color="warning"
            size="small"
          >
            {{ pending.length }} pendente{{ pending.length === 1 ? '' : 's' }}
          </SiChip>
        </div>
        <p class="si-additional-coverages__section-hint">
          Coberturas Adicionais Importadas Ativas ainda sem vínculo com uma Cobertura Adicional
          canônica. Resolva cada uma: Vincular a uma Cobertura Adicional, Ignorar ou Reativar.
        </p>
      </div>

      <AdditionalCoverageMapPendingQueue
        :items="pending"
        :loading="loading"
        :busy="saving"
        @link="openLinkDialog"
        @ignore="openIgnoreDialog"
        @restore="restore"
      />
    </SiCard>

    <SiCard
      class="si-additional-coverages__card"
      variant="outlined"
    >
      <div class="si-additional-coverages__section">
        <div class="si-additional-coverages__section-title">
          <h2 class="text-h6">
            Catálogo de Coberturas Adicionais
          </h2>
          <span class="si-additional-coverages__count">
            {{ coverages.length }} Cobertura{{ coverages.length === 1 ? '' : 's' }} Adiciona{{ coverages.length === 1 ? 'l' : 'is' }}
          </span>
        </div>
        <p class="si-additional-coverages__section-hint">
          O catálogo canônico que o corretor vê na cotação. Uma Cobertura Adicional é oferecida
          enquanto tiver ao menos uma Cobertura Adicional Importada Ativa vinculada — a
          disponibilidade é derivada dos vínculos, nunca digitada.
        </p>
      </div>

      <AdditionalCoverageMapMatrix
        :coverages="coverages"
        :loading="loading"
        :busy="saving"
        @edit="openEditDialog"
        @change-status="openStatusDialog"
        @unlink="unlink"
      />
    </SiCard>

    <AdditionalCoveragesFormDialog
      v-model="formOpen"
      :coverage="editingCoverage"
      :saving="saving"
      @submit="submitForm"
    />

    <AdditionalCoveragesStatusChangeDialog
      v-model="statusDialogOpen"
      :coverage="selectedCoverage"
      :loading="saving"
      @confirm="confirmStatusChange"
    />

    <AdditionalCoverageMapLinkDialog
      v-model="linkDialogOpen"
      :pending="selectedPending"
      :coverages="coverages"
      :saving="saving"
      @confirm="confirmLink"
    />

    <AdditionalCoverageMapIgnoreDialog
      v-model="ignoreDialogOpen"
      :pending="selectedPending"
      :loading="saving"
      @confirm="confirmIgnore"
    />
  </VContainer>
</template>

<style scoped>
.si-additional-coverages {
  max-width: var(--si-container-wide);
}

.si-additional-coverages__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-additional-coverages__header h1 {
  margin: 0;
}

.si-additional-coverages__header-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-additional-coverages__card {
  overflow: hidden;
  margin-bottom: var(--si-space-4);
}

.si-additional-coverages__card--queue {
  border-color: rgb(var(--v-theme-warning));
}

.si-additional-coverages__section {
  padding: var(--si-space-4) var(--si-space-4) 0;
}

.si-additional-coverages__section-title {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-additional-coverages__section-title h2 {
  margin: 0;
}

.si-additional-coverages__section-hint {
  margin: var(--si-space-2) 0 0;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.si-additional-coverages__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

/* Mobile-first (ADR-017): header empilha no xs. */
@media (max-width: 599.98px) {
  .si-additional-coverages__header,
  .si-additional-coverages__header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
