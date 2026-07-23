<script setup lang="ts">
import type { PolicyHolderListItem } from '~/composables/usePolicyHolders'
import { formatCnpj } from '~/lib/documents'

definePageMeta({ layout: 'shell' })

const { listPolicyHolders } = usePolicyHolders()

const items = ref<PolicyHolderListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const search = ref('')
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)

// DS (Table.jsx): rótulos à esquerda, ações à direita.
const headers = [
  { title: 'CNPJ', key: 'documentNumber' },
  { title: 'Razão social', key: 'name' },
  { title: 'Nome fantasia', key: 'socialName' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
] as const

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listPolicyHolders({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
    })
    items.value = response.items
    totalCount.value = Number(response.totalCount)
  }
  catch {
    error.value = 'Não foi possível carregar os tomadores.'
  }
  finally {
    loading.value = false
  }
}

// Busca nova volta à página 1 e refaz o fetch (server-side).
watch(search, () => {
  page.value = 1
  refresh()
})

// Navegação e tamanho de página vêm do SiPagination (server-side → refetch explícito).
function goToPage(target: number) {
  page.value = target
  refresh()
}

function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
  refresh()
}
</script>

<template>
  <VContainer class="si-policy-holders">
    <div class="si-policy-holders__header">
      <h1 class="text-h5">
        Tomadores
      </h1>

      <div class="si-policy-holders__header-actions">
        <SiButton
          :prepend-icon="'refresh'"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>

        <SiButton
          to="/tomadores/nova"
          :prepend-icon="'userPlus'"
        >
          Novo tomador
        </SiButton>
      </div>
    </div>

    <!-- Toolbar (contagem + busca) fora do card, acima da tabela. -->
    <div class="si-policy-holders__toolbar">
      <div class="si-policy-holders__count">
        {{ totalCount }} tomador{{ totalCount === 1 ? '' : 'es' }}
      </div>

      <SiTextField
        v-model="search"
        placeholder="Buscar por nome ou CNPJ"
        density="compact"
        clearable
        class="si-policy-holders__search"
      />
    </div>

    <SiCard
      class="si-policy-holders__table-card"
      variant="outlined"
    >
      <SiAlert
        v-if="error"
        type="error"
        class="mx-4 mb-4"
        :text="error"
      />

      <SiDataTable
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="pageSize"
        hide-default-footer
        class="si-policy-holders__table"
      >
        <template #[`item.documentNumber`]="{ item }">
          {{ formatCnpj(item.documentNumber) }}
        </template>

        <!-- Coluna prioritária em negrito (DS Table). -->
        <template #[`item.name`]="{ item }">
          <span class="si-cell-strong">{{ item.name }}</span>
        </template>

        <template #[`item.socialName`]="{ item }">
          {{ item.socialName ?? '-' }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-policy-holders__actions">
            <SiTooltip text="Detalhes">
              <template #activator="{ props }">
                <SiIconButton
                  v-bind="props"
                  :to="`/tomadores/${item.id}`"
                  icon="eye"
                  tone="view"
                  aria-label="Detalhes"
                />
              </template>
            </SiTooltip>
          </div>
        </template>
      </SiDataTable>

      <SiPagination
        :page="page"
        :items-per-page="pageSize"
        :total="totalCount"
        @update:page="goToPage"
        @update:items-per-page="changePageSize"
      />
    </SiCard>
  </VContainer>
</template>

<style scoped>
.si-policy-holders {
  max-width: var(--si-container-wide);
}

.si-policy-holders__header,
.si-policy-holders__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-policy-holders__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-policy-holders__header h1 {
  margin: 0;
}

.si-policy-holders__header-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-policy-holders__table-card {
  overflow: hidden;
}

.si-policy-holders__toolbar {
  margin-bottom: var(--si-space-3);
}

.si-policy-holders__search {
  flex: 0 0 280px;
  max-width: 280px;
  width: 280px;
}

.si-policy-holders__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-policy-holders__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

@media (max-width: 700px) {
  .si-policy-holders__header,
  .si-policy-holders__toolbar,
  .si-policy-holders__header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .si-policy-holders__search {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
  }
}
</style>
