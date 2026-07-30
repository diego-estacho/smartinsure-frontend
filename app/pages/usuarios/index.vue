<script setup lang="ts">
import type { UserListItem } from '~/composables/useUsers'
import { toBrDateTime } from '~/lib/dates'
import { extractApiErrorMessage } from '~/lib/apiError'
import { getProfileLabel, profileScopes } from '~/lib/status/profiles'
import { getUserStatusView, userStatusOptions } from '~/lib/status/users'

definePageMeta({ layout: 'shell' })

const {
  listUsers,
  inviteBrokerageAdministrator,
  invitePolicyHolderAdministrator,
  inviteBrokerageUser,
  invitePolicyHolderUser,
} = useUsers()

const items = ref<UserListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const search = ref('')
const status = ref<string | null>(null)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)

// RN-066: convite de Corretor Administrador (somente Administrador do Sistema — decisão do servidor).
const inviteOpen = ref(false)
const inviting = ref(false)
const inviteError = ref<string | null>(null)
const success = ref<string | null>(null)

// RN-068/RN-069: criação de Usuário no escopo do Corretor Administrador (TA ou usuário da corretora).
const scopedInviteOpen = ref(false)
const scopedInviting = ref(false)

// DS (Table.jsx): rótulos à esquerda, ações à direita.
const headers = [
  { title: 'Nome', key: 'name' },
  { title: 'E-mail', key: 'email' },
  { title: 'Perfil', key: 'profileName' },
  { title: 'Situação', key: 'status' },
  { title: 'Cadastro', key: 'createdAt' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
] as const

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listUsers({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      status: status.value ?? undefined,
    })
    items.value = response.items
    totalCount.value = Number(response.totalCount)
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível carregar os usuários.')
    items.value = []
    totalCount.value = 0
  }
  finally {
    loading.value = false
  }
}

// Busca ou filtro novo volta à página 1 e refaz o fetch (server-side).
watch([search, status], () => {
  page.value = 1
  refresh()
})

function goToPage(target: number) {
  page.value = target
  refresh()
}

function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
  refresh()
}

/**
 * RN-068/RN-069/RN-070: um único formulário, e o perfil escolhido decide o fluxo —
 * Tomador escolhido → Tomador Administrador pela corretora ativa (RN-068);
 * perfil de escopo Tomador sem escolha → usuário do tomador ativo, criado pelo TA (RN-070);
 * demais → usuário da corretora ativa (RN-069).
 */
async function confirmScopedInvite(payload: {
  name: string
  email: string
  profileId: string
  policyHolderId: string | null
  profileScope: string
}) {
  scopedInviting.value = true
  inviteError.value = null
  success.value = null

  try {
    let invited: { email: string }

    if (payload.policyHolderId) {
      invited = await invitePolicyHolderAdministrator({
        name: payload.name,
        email: payload.email,
        policyHolderId: payload.policyHolderId,
      })
    }
    else if (payload.profileScope === profileScopes.policyHolder) {
      invited = await invitePolicyHolderUser({
        name: payload.name,
        email: payload.email,
        profileId: payload.profileId,
      })
    }
    else {
      invited = await inviteBrokerageUser({
        name: payload.name,
        email: payload.email,
        profileId: payload.profileId,
      })
    }

    scopedInviteOpen.value = false
    success.value = `Convite enviado para ${invited.email}. O usuário fica Pendente até concluir o primeiro acesso.`
    page.value = 1
    await refresh()
  }
  catch (requestError) {
    inviteError.value = extractApiErrorMessage(requestError, 'Não foi possível criar o usuário.')
  }
  finally {
    scopedInviting.value = false
  }
}

async function confirmInvite(payload: { name: string, email: string, brokerageIds: string[] }) {
  inviting.value = true
  inviteError.value = null
  success.value = null

  try {
    const invited = await inviteBrokerageAdministrator({
      name: payload.name,
      email: payload.email,
      brokerageIds: payload.brokerageIds,
    })
    inviteOpen.value = false
    success.value = `Convite enviado para ${invited.email}. O usuário fica Pendente até concluir o primeiro acesso.`
    page.value = 1
    await refresh()
  }
  catch (requestError) {
    inviteError.value = extractApiErrorMessage(requestError, 'Não foi possível enviar o convite.')
  }
  finally {
    inviting.value = false
  }
}
</script>

<template>
  <VContainer class="si-users">
    <div class="si-users__header">
      <h1 class="text-h5">
        Usuários
      </h1>

      <div class="si-users__header-actions">
        <SiButton
          :prepend-icon="'refresh'"
          variant="tonal"
          :loading="loading"
          @click="refresh"
        >
          Atualizar
        </SiButton>

        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'userPlus'"
          @click="inviteOpen = true"
        >
          Convidar corretor administrador
        </SiButton>

        <SiButton
          :prepend-icon="'userPlus'"
          @click="scopedInviteOpen = true"
        >
          Novo usuário
        </SiButton>
      </div>
    </div>

    <SiAlert
      v-if="success"
      type="success"
      class="mb-4"
      closable
      :text="success"
      @click:close="success = null"
    />

    <!-- Toolbar (contagem + busca + filtro) fora do card, acima da tabela. -->
    <div class="si-users__toolbar">
      <div class="si-users__count">
        {{ totalCount }} usuário{{ totalCount === 1 ? '' : 's' }}
      </div>

      <div class="si-users__filters">
        <SiSelect
          v-model="status"
          label="Situação"
          :items="userStatusOptions"
          density="compact"
          hide-details
          class="si-users__status"
        />

        <SiTextField
          v-model="search"
          placeholder="Buscar por nome ou e-mail"
          :prepend-inner-icon="'search'"
          density="compact"
          clearable
          hide-details
          class="si-users__search"
        />
      </div>
    </div>

    <SiCard
      class="si-users__table-card"
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
        class="si-users__table"
      >
        <!-- Coluna prioritária em negrito (DS Table). -->
        <template #[`item.name`]="{ item }">
          <span class="si-cell-strong">{{ item.name }}</span>
        </template>

        <template #[`item.profileName`]="{ item }">
          {{ getProfileLabel(item.profileName) }}
        </template>

        <template #[`item.status`]="{ item }">
          <SiChip
            size="small"
            :color="getUserStatusView(item.status).color"
          >
            {{ getUserStatusView(item.status).label }}
          </SiChip>
        </template>

        <template #[`item.createdAt`]="{ item }">
          {{ toBrDateTime(item.createdAt) }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-users__actions">
            <SiTooltip text="Detalhes">
              <template #activator="{ props }">
                <SiIconButton
                  v-bind="props"
                  :to="`/usuarios/${item.id}`"
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

    <UsersInviteBrokerageAdministratorDialog
      v-model="inviteOpen"
      :submitting="inviting"
      @confirm="confirmInvite"
    />

    <UsersCreateScopedUserDialog
      v-model="scopedInviteOpen"
      :submitting="scopedInviting"
      @confirm="confirmScopedInvite"
    />

    <SiAlert
      v-if="inviteError"
      type="error"
      class="mt-4"
      :text="inviteError"
    />
  </VContainer>
</template>

<style scoped>
.si-users {
  max-width: var(--si-container-wide);
}

.si-users__header,
.si-users__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-users__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-users__header h1 {
  margin: 0;
}

.si-users__header-actions,
.si-users__filters {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-users__table-card {
  overflow: hidden;
}

.si-users__toolbar {
  margin-bottom: var(--si-space-3);
}

.si-users__search {
  flex: 0 0 280px;
  max-width: 280px;
  width: 280px;
}

.si-users__status {
  flex: 0 0 180px;
  max-width: 180px;
  width: 180px;
}

.si-users__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-users__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

@media (max-width: 700px) {
  .si-users__header,
  .si-users__toolbar,
  .si-users__header-actions,
  .si-users__filters {
    align-items: stretch;
    flex-direction: column;
  }

  .si-users__search,
  .si-users__status {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
  }
}
</style>
