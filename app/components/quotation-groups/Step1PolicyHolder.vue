<script setup lang="ts">
/**
 * Etapa 1 — Dados do tomador (exec-plan 0015, incremento 2). Busca por CNPJ/razão social
 * integrada de verdade (`usePolicyHolders`); ao selecionar um resultado, carrega o detalhe e
 * mostra o card do tomador (razão social, CNPJ, endereço principal), guardando-o na store para o
 * resumo e para a assinatura de recálculo.
 *
 * "Ver limites e taxas" abre um modal placeholder (tela à parte, fora de escopo). "Adicionar
 * filial" abre um modal com o CNPJ da filial — a criação real depende de contrato (Branch) que
 * ainda não existe: TODO(backend) ligar quando o endpoint existir.
 */
import type { PolicyHolderAddress, PolicyHolderListItem } from '~/composables/usePolicyHolders'
import type { SelectedPolicyHolder } from '~/stores/quotationGroupWizard'
import { formatCnpj } from '~/lib/documents'

const wizard = useQuotationGroupWizardStore()
const { listPolicyHolders, getPolicyHolder } = usePolicyHolders()

const query = ref('')
const searching = ref(false)
const loadingDetail = ref(false)
const error = ref<string | null>(null)
const results = ref<PolicyHolderListItem[]>([])
const searched = ref(false)

const limitsModalOpen = ref(false)
const branchModalOpen = ref(false)
const branchCnpj = ref('')
const branchNotice = ref<string | null>(null)

const selected = computed(() => wizard.policyHolder)

function formatAddress(address: PolicyHolderAddress): string {
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode,
  ].filter(Boolean).join(' · ')
}

async function search(): Promise<void> {
  const term = query.value.trim()
  error.value = null
  if (!term) {
    error.value = 'Digite um CNPJ ou razão social para buscar.'
    return
  }
  searching.value = true
  searched.value = true
  try {
    const response = await listPolicyHolders({ search: term, pageSize: 8 })
    results.value = response.items
  }
  catch {
    error.value = 'Não foi possível buscar o tomador.'
    results.value = []
  }
  finally {
    searching.value = false
  }
}

async function select(id: string): Promise<void> {
  error.value = null
  loadingDetail.value = true
  try {
    const detail = await getPolicyHolder(id)
    const main = detail.addresses.find(address => address.isMain) ?? detail.addresses[0] ?? null
    const chosen: SelectedPolicyHolder = {
      id: detail.id,
      name: detail.name,
      documentNumber: detail.documentNumber,
      mainAddress: main ? formatAddress(main) : null,
    }
    wizard.setPolicyHolder(chosen)
    results.value = []
  }
  catch {
    error.value = 'Não foi possível carregar os dados do tomador.'
  }
  finally {
    loadingDetail.value = false
  }
}

function clearSelection(): void {
  wizard.setPolicyHolder(null)
  branchNotice.value = null
  searched.value = false
  query.value = ''
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
    <template v-if="!selected">
      <SiForm @submit.prevent="search">
        <div class="si-qg-step1__search">
          <SiTextField
            v-model="query"
            label="CNPJ ou razão social"
            placeholder="00.000.000/0000-00"
            density="comfortable"
            clearable
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
          :disabled="loadingDetail"
          @click="select(item.id)"
        />
      </SiList>

      <p
        v-else-if="searched && !searching && !error"
        class="si-qg-step1__empty"
      >
        Nenhum tomador encontrado para "{{ query }}".
      </p>
    </template>

    <SiCard
      v-else
      variant="outlined"
      class="si-qg-step1__card"
    >
      <div class="si-qg-step1__card-head">
        <SiAvatar
          color="primary"
          :size="40"
        >
          <SiIcon
            icon="building"
            :size="20"
          />
        </SiAvatar>
        <div class="si-qg-step1__card-id">
          <span class="si-qg-step1__card-name">{{ selected.name }}</span>
          <span class="si-qg-step1__card-doc">CNPJ {{ formatCnpj(selected.documentNumber) }}</span>
        </div>
        <SiButton
          variant="text"
          color="secondary"
          size="small"
          :prepend-icon="'search'"
          @click="clearSelection"
        >
          Trocar
        </SiButton>
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
  align-items: start;
}

.si-qg-step1__search-btn {
  min-height: 40px;
}

.si-qg-step1__results {
  margin-top: var(--si-space-2);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  overflow: hidden;
}

.si-qg-step1__empty {
  margin: var(--si-space-3) 0 0;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-qg-step1__card {
  padding: var(--si-space-4);
}

.si-qg-step1__card-head {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-qg-step1__card-id {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}

.si-qg-step1__card-name {
  font-size: var(--si-fs-body);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step1__card-doc {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-variant-numeric: tabular-nums;
}

.si-qg-step1__card-address {
  margin: var(--si-space-3) 0 0;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.8);
  line-height: var(--si-lh-body);
}

.si-qg-step1__card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  margin-top: var(--si-space-4);
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
