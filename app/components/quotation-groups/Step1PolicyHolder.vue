<script setup lang="ts">
/**
 * Etapa 1 — Dados do tomador (exec-plan 0015). Busca por CNPJ/razão social no endpoint de Pessoas
 * (`usePersons` com o papel `PolicyHolder`), igual à etapa 2 (Segurado): cada item da busca já traz
 * o `mainAddress`, sem endpoint de detalhe. O backend aplica o filtro de matriz (RN-016) para o
 * papel PolicyHolder e resolve filial→matriz. Ao selecionar, mostra o card do tomador (TOMADOR
 * ENCONTRADO + razão social + CNPJ + endereço) e guarda na store para o resumo e a assinatura de
 * recálculo. A busca fica SEMPRE visível — trocar o tomador é só buscar de novo (sem botão "Trocar").
 *
 * "Ver limites e taxas" abre um modal placeholder (tela à parte). O card também lista as Filiais do
 * tomador (RN-053) com marcação exclusiva (no máx. uma) via `usePolicyHolderBranches`; "Adicionar
 * filial" abre um modal que registra uma nova por CNPJ via Birô (`createBranch`) e mostra o aviso do
 * backend quando o CNPJ não é localizado (a matriz continua usável — não é erro).
 */
import type { PersonAddress, PersonSearchItem } from '~/composables/usePersons'
import type { CreatePolicyHolderBranchResponse } from '~/composables/usePolicyHolderBranches'
import type { SelectedPolicyHolder } from '~/stores/quotationGroupWizard'
import { formatCnpj } from '~/lib/documents'

const wizard = useQuotationGroupWizardStore()
const { searchPersons } = usePersons()
const { listBranches, createBranch } = usePolicyHolderBranches()

const query = ref('')
const searching = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const results = ref<PersonSearchItem[]>([])
const searched = ref(false)

const limitsModalOpen = ref(false)
const branchModalOpen = ref(false)
const branchCnpj = ref('')
const branchNotice = ref<string | null>(null)
const branchError = ref<string | null>(null)
const branchSaving = ref(false)

const selected = computed(() => wizard.policyHolder)

function formatCep(zip: string): string {
  const digits = zip.replace(/\D/g, '')
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : zip
}

function formatAddress(address: PersonAddress): string {
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode ? `CEP ${formatCep(address.zipCode)}` : '',
  ].filter(Boolean).join(' · ')
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
    const response = await searchPersons({ term, role: 'PolicyHolder' })
    results.value = response.items
    notice.value = response.notice ?? null
  }
  catch {
    error.value = 'Não foi possível buscar o tomador.'
    results.value = []
  }
  finally {
    searching.value = false
  }
}

// Cada item da busca de Pessoas já traz o endereço principal — não há endpoint de detalhe (igual à
// etapa 2). Monta o tomador direto do item selecionado. `preSelectedBranchId`: quando o corretor
// chegou digitando o CNPJ de uma Filial, ela já nasce marcada (RN-053); nos demais casos, a lista
// abre desmarcada (matriz). A lista de Filiais é buscada em seguida via BFF.
function select(item: PersonSearchItem): void {
  const chosen: SelectedPolicyHolder = {
    id: item.id,
    name: item.name,
    documentNumber: item.documentNumber,
    mainAddress: item.mainAddress ? formatAddress(item.mainAddress) : null,
    branches: [],
    selectedBranchId: item.preSelectedBranchId ?? null,
  }
  wizard.setPolicyHolder(chosen)
  branchNotice.value = null
  branchError.value = null
  results.value = []
  void loadBranches(item.id)
}

/** Busca as Filiais já registradas do tomador (RN-053). Falha na listagem não impede seguir com a
 * matriz — a tela apenas nasce sem Filiais para marcar. */
async function loadBranches(policyHolderId: string): Promise<void> {
  try {
    const response = await listBranches(policyHolderId)
    wizard.setBranches(response.branches)
  }
  catch {
    wizard.setBranches([])
  }
}

/** Marca/desmarca a Filial clicada. O v-model do SiCheckbox já garante a exclusividade: como cada
 * clique substitui `selectedBranchId` por inteiro (nunca acumula), marcar uma Filial desmarca
 * qualquer outra automaticamente (RN-053). */
function toggleBranch(branchId: string, checked: boolean | null): void {
  if (checked) wizard.setBranch(branchId)
  else wizard.clearBranch()
}

/** Registra a Filial por CNPJ via Birô (Task 9). `branchId` no corpo é o caminho feliz — recarrega
 * a lista (para trazer nome/razão social canônicos) e já marca a Filial recém-criada, já que foi
 * exatamente o que o corretor pediu. `notice` sem `branchId` é o Birô não achando o CNPJ — um
 * retorno não-erro do backend; a matriz continua usável e o modal permanece aberto para o corretor
 * tentar outro CNPJ (não é uma falha, então não fecha nem limpa o campo). */
async function addBranch(): Promise<void> {
  if (!selected.value) return
  branchSaving.value = true
  branchError.value = null
  branchNotice.value = null
  try {
    const result: CreatePolicyHolderBranchResponse = await createBranch(selected.value.id, branchCnpj.value)
    if (result.branchId) {
      await loadBranches(selected.value.id)
      wizard.setBranch(result.branchId)
      branchModalOpen.value = false
      branchCnpj.value = ''
    }
    else {
      branchNotice.value = result.notice
    }
  }
  catch {
    branchError.value = 'Não foi possível registrar a filial.'
  }
  finally {
    branchSaving.value = false
  }
}

/** Abre o modal já limpo — sem aviso/erro de uma tentativa anterior. */
function openBranchModal(): void {
  branchModalOpen.value = true
  branchNotice.value = null
  branchError.value = null
  branchCnpj.value = ''
}

function closeBranchModal(): void {
  branchModalOpen.value = false
  branchCnpj.value = ''
}
</script>

<template>
  <div class="si-qg-step1">
    <SiForm @submit.prevent="search">
      <div class="si-qg-step1__search">
        <SiTextField
          v-model="query"
          label="CNPJ ou razão social"
          placeholder="00.000.000/0000-00"
          density="comfortable"
          clearable
          hide-details
        />
        <SiButton
          type="submit"
          :loading="searching"
          :prepend-icon="'search'"
          class="si-qg-step1__search-btn"
        >
          Buscar
        </SiButton>
      </div>
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
      class="si-qg-step1__results"
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
      class="si-qg-step1__empty"
    >
      Nenhum tomador encontrado para "{{ query }}".
    </p>

    <SiCard
      v-if="selected"
      variant="outlined"
      class="si-qg-step1__card"
    >
      <div class="si-qg-step1__card-head">
        <span class="si-qg-step1__card-avatar">
          <SiIcon
            icon="building"
            :size="20"
          />
        </span>
        <div class="si-qg-step1__card-id">
          <span class="si-qg-step1__card-eyebrow">Tomador encontrado</span>
          <span class="si-qg-step1__card-name">{{ selected.name }}</span>
          <span class="si-qg-step1__card-doc">CNPJ {{ formatCnpj(selected.documentNumber) }}</span>
        </div>
      </div>

      <p
        v-if="selected.mainAddress"
        class="si-qg-step1__card-address"
      >
        {{ selected.mainAddress }}
      </p>

      <!-- Filiais do tomador (RN-053): marcação exclusiva — no máx. uma; desmarcar volta à matriz. -->
      <div
        v-if="selected.branches?.length"
        class="si-qg-step1__branches"
      >
        <span class="si-qg-step1__branches-label">Filial da cotação</span>
        <p class="si-qg-step1__branches-hint">
          Marque uma filial para cotar por ela; sem marcação, o estabelecimento é a matriz.
        </p>
        <SiCheckbox
          v-for="branch in selected.branches"
          :key="branch.id"
          :model-value="wizard.selectedBranchId === branch.id"
          :label="`${branch.name} — CNPJ ${formatCnpj(branch.documentNumber)}`"
          density="compact"
          hide-details
          @update:model-value="toggleBranch(branch.id, $event as boolean | null)"
        />
      </div>

      <div class="si-qg-step1__card-actions">
        <SiButton
          variant="outlined"
          color="secondary"
          size="small"
          :prepend-icon="'barChart'"
          @click="limitsModalOpen = true"
        >
          Ver limites e taxas
        </SiButton>
        <SiButton
          variant="outlined"
          color="secondary"
          size="small"
          :prepend-icon="'plus'"
          @click="openBranchModal"
        >
          Adicionar filial
        </SiButton>
      </div>
    </SiCard>

    <!-- Modal: limites e taxas (placeholder — tela à parte, fora de escopo). -->
    <SiDialog
      v-model="limitsModalOpen"
      :max-width="480"
    >
      <SiCard class="si-qg-step1__modal">
        <h3 class="text-subtitle-1 si-qg-step1__modal-title">
          Limites e taxas
        </h3>
        <p class="si-qg-step1__modal-text">
          Em construção. Esta tela será disponibilizada em breve.
        </p>
        <div class="si-qg-step1__modal-actions">
          <SiButton
            variant="text"
            color="secondary"
            @click="limitsModalOpen = false"
          >
            Fechar
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>

    <!-- Modal: adicionar filial. -->
    <SiDialog
      v-model="branchModalOpen"
      :max-width="480"
    >
      <SiCard class="si-qg-step1__modal">
        <h3 class="text-subtitle-1 si-qg-step1__modal-title">
          Adicionar filial
        </h3>
        <SiForm @submit.prevent="addBranch">
          <SiDocField
            v-model="branchCnpj"
            tipo="cnpj"
            label="CNPJ da filial"
            hint="A filial herda os dados cadastrais do tomador."
            density="comfortable"
          />
        </SiForm>

        <SiAlert
          v-if="branchNotice"
          type="info"
          class="mt-3 mb-0"
          :text="branchNotice"
        />
        <SiAlert
          v-if="branchError"
          type="error"
          class="mt-3 mb-0"
          :text="branchError"
        />

        <div class="si-qg-step1__modal-actions">
          <SiButton
            variant="text"
            color="secondary"
            @click="closeBranchModal"
          >
            Cancelar
          </SiButton>
          <SiButton
            :loading="branchSaving"
            @click="addBranch"
          >
            Adicionar filial
          </SiButton>
        </div>
      </SiCard>
    </SiDialog>
  </div>
</template>

<style scoped>
.si-qg-step1__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--si-space-3);
  align-items: end;
}

.si-qg-step1__search-btn {
  height: 48px;
}

.si-qg-step1__results {
  margin-top: var(--si-space-2);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  overflow: hidden;
}

.si-qg-step1__empty {
  margin: var(--si-space-3) 0 0;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-qg-step1__card {
  margin-top: var(--si-space-4);
  padding: var(--si-space-5);
}

.si-qg-step1__card-head {
  display: flex;
  align-items: flex-start;
  gap: var(--si-space-3);
}

.si-qg-step1__card-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--si-radius-md);
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  flex: 0 0 auto;
}

.si-qg-step1__card-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.si-qg-step1__card-eyebrow {
  font-size: var(--si-fs-caption, 0.75rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
}

.si-qg-step1__card-name {
  font-size: var(--si-fs-h4, 1.125rem);
  font-weight: var(--si-font-weight-semibold);
  line-height: 1.3;
}

.si-qg-step1__card-doc {
  font-size: var(--si-fs-small);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-qg-step1__card-address {
  margin: var(--si-space-4) 0 0;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.8);
  line-height: var(--si-lh-body);
}

.si-qg-step1__branches {
  margin-top: var(--si-space-5);
  padding-top: var(--si-space-4);
  border-top: 1px solid var(--si-cinza-claro);
  display: flex;
  flex-direction: column;
}

.si-qg-step1__branches-label {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step1__branches-hint {
  margin: 2px 0 var(--si-space-2);
  color: var(--si-cinza);
  font-size: var(--si-fs-caption, 0.75rem);
}

.si-qg-step1__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-3);
  margin-top: var(--si-space-5);
}

.si-qg-step1__modal {
  padding: var(--si-space-5);
}

.si-qg-step1__modal-title {
  margin: 0 0 var(--si-space-3);
}

.si-qg-step1__modal-text {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-qg-step1__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--si-space-2);
  margin-top: var(--si-space-5);
}

@media (max-width: 599.98px) {
  .si-qg-step1__search {
    grid-template-columns: 1fr;
  }

  .si-qg-step1__search-btn {
    width: 100%;
  }
}
</style>
