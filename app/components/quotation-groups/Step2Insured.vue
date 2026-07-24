<script setup lang="ts">
/**
 * Etapa 2 — Dados do segurado (exec-plan 0015, incremento 6). Busca por CNPJ/razão social
 * integrada de verdade (`usePersons`, papel `Insured`); cada resultado já traz o endereço
 * principal, então ao selecionar mostramos o card do segurado (razão social, CNPJ, nome fantasia,
 * endereço) e o guardamos na store para o resumo e a assinatura de recálculo.
 *
 * Gerenciar endereços do segurado (adicionar/selecionar outro) depende de contrato inexistente —
 * por ora exibe o endereço principal. TODO(backend): endpoints de endereço de Pessoa.
 */
import type { PersonAddress, PersonSearchItem } from '~/composables/usePersons'
import type { SelectedInsured } from '~/stores/quotationGroupWizard'
import { formatCnpj } from '~/lib/documents'

const wizard = useQuotationGroupWizardStore()
const { searchPersons } = usePersons()

const query = ref('')
const searching = ref(false)
const error = ref<string | null>(null)
const notice = ref<string | null>(null)
const results = ref<PersonSearchItem[]>([])
const searched = ref(false)

const selected = computed(() => wizard.insured)

function formatAddress(address: PersonAddress): string {
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
  notice.value = null
  if (!term) {
    error.value = 'Digite um CNPJ ou razão social para buscar.'
    return
  }
  searching.value = true
  searched.value = true
  try {
    const response = await searchPersons({ term, role: 'Insured' })
    results.value = response.items
    notice.value = response.notice ?? null
  }
  catch {
    error.value = 'Não foi possível buscar o segurado.'
    results.value = []
  }
  finally {
    searching.value = false
  }
}

function select(item: PersonSearchItem): void {
  const chosen: SelectedInsured = {
    id: item.id,
    name: item.name,
    documentNumber: item.documentNumber,
    socialName: item.socialName ?? null,
    mainAddress: item.mainAddress ? formatAddress(item.mainAddress) : null,
  }
  wizard.setInsured(chosen)
  results.value = []
}

function clearSelection(): void {
  wizard.setInsured(null)
  searched.value = false
  query.value = ''
}
</script>

<template>
  <div class="si-qg-step2">
    <template v-if="!selected">
      <SiForm @submit.prevent="search">
        <div class="si-qg-step2__search">
          <SiTextField
            v-model="query"
            label="CNPJ ou razão social do segurado"
            placeholder="00.000.000/0000-00"
            density="comfortable"
            clearable
          />
          <SiButton
            type="submit"
            :loading="searching"
            :prepend-icon="'search'"
            class="si-qg-step2__search-btn"
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
        class="si-qg-step2__results"
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
        v-else-if="searched && !searching && !error"
        class="si-qg-step2__empty"
      >
        Nenhum segurado encontrado para "{{ query }}".
      </p>
    </template>

    <SiCard
      v-else
      variant="outlined"
      class="si-qg-step2__card"
    >
      <div class="si-qg-step2__card-head">
        <SiAvatar
          color="primary"
          :size="40"
        >
          <SiIcon
            icon="building"
            :size="20"
          />
        </SiAvatar>
        <div class="si-qg-step2__card-id">
          <span class="si-qg-step2__card-name">{{ selected.name }}</span>
          <span class="si-qg-step2__card-doc">CNPJ {{ formatCnpj(selected.documentNumber) }}</span>
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

      <dl class="si-qg-step2__facts">
        <div v-if="selected.socialName">
          <dt>Nome fantasia</dt>
          <dd>{{ selected.socialName }}</dd>
        </div>
        <div v-if="selected.mainAddress">
          <dt>Endereço principal</dt>
          <dd>{{ selected.mainAddress }}</dd>
        </div>
      </dl>
    </SiCard>
  </div>
</template>

<style scoped>
.si-qg-step2__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--si-space-3);
  align-items: start;
}

.si-qg-step2__search-btn {
  min-height: 40px;
}

.si-qg-step2__results {
  margin-top: var(--si-space-2);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  overflow: hidden;
}

.si-qg-step2__empty {
  margin: var(--si-space-3) 0 0;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-qg-step2__card {
  padding: var(--si-space-4);
}

.si-qg-step2__card-head {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-qg-step2__card-id {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}

.si-qg-step2__card-name {
  font-size: var(--si-fs-body);
  font-weight: var(--si-font-weight-semibold);
}

.si-qg-step2__card-doc {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-variant-numeric: tabular-nums;
}

.si-qg-step2__facts {
  display: grid;
  gap: var(--si-space-3);
  margin: var(--si-space-4) 0 0;
}

.si-qg-step2__facts div {
  display: grid;
  gap: 2px;
}

.si-qg-step2__facts dt {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-qg-step2__facts dd {
  margin: 0;
  font-weight: var(--si-font-weight-medium);
  font-size: var(--si-fs-small);
}

@media (max-width: 599.98px) {
  .si-qg-step2__search {
    grid-template-columns: 1fr;
  }

  .si-qg-step2__search-btn {
    width: 100%;
  }
}
</style>
