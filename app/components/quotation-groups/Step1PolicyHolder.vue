<script setup lang="ts">
/**
 * Etapa 1 — Dados do tomador (exec-plan 0015). Busca por CNPJ/razão social no endpoint de Pessoas
 * (`usePersons` com o papel `PolicyHolder`), igual à etapa 2 (Segurado): cada item da busca já traz
 * o `mainAddress`, sem endpoint de detalhe. O backend aplica o filtro de matriz (RN-016) para o
 * papel PolicyHolder e resolve filial→matriz. Ao selecionar, mostra o card do tomador (TOMADOR
 * ENCONTRADO + razão social + CNPJ + endereço) e guarda na store para o resumo e a assinatura de
 * recálculo. A busca fica SEMPRE visível — trocar o tomador é só buscar de novo (sem botão "Trocar").
 *
 * "Ver limites e taxas" abre um modal placeholder (tela à parte). "Adicionar filial" abre um modal
 * com o CNPJ da filial — criação real depende de contrato (Branch) inexistente: TODO(backend).
 */
import type { PersonAddress, PersonSearchItem } from '~/composables/usePersons'
import type { SelectedPolicyHolder } from '~/stores/quotationGroupWizard'
import { formatCnpj } from '~/lib/documents'

const wizard = useQuotationGroupWizardStore()
const { searchPersons } = usePersons()

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
// etapa 2). Monta o tomador direto do item selecionado.
function select(item: PersonSearchItem): void {
  const chosen: SelectedPolicyHolder = {
    id: item.id,
    name: item.name,
    documentNumber: item.documentNumber,
    mainAddress: item.mainAddress ? formatAddress(item.mainAddress) : null,
  }
  wizard.setPolicyHolder(chosen)
  branchNotice.value = null
  results.value = []
}

function addBranch(): void {
  // TODO(backend): endpoint de filial (Branch) não existe no contrato; por ora confirma só na UI.
  branchModalOpen.value = false
  branchNotice.value = 'Filial adicionada ao tomador.'
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
          @click="branchModalOpen = true"
        >
          Adicionar filial
        </SiButton>
      </div>

      <SiAlert
        v-if="branchNotice"
        type="success"
        class="mt-3 mb-0"
        :text="branchNotice"
      />
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
        <div class="si-qg-step1__modal-actions">
          <SiButton
            variant="text"
            color="secondary"
            @click="branchModalOpen = false"
          >
            Cancelar
          </SiButton>
          <SiButton @click="addBranch">
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
