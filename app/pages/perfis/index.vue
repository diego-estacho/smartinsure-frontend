<script setup lang="ts">
import type { ProfileListItem } from '~/composables/useProfiles'
import { describeRequestError } from '~/lib/errors'
import { getProfileLabel, getProfileScopeView, profileScopeOptions } from '~/lib/status/profiles'

definePageMeta({ layout: 'shell' })

const {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  updateFixedProfilePermissions,
} = useProfiles()
// RN-073: só o Administrador do Sistema edita as permissões dos perfis fixos.
const { context, loadContext } = useWorkspaces()

await loadContext()

const isSystemAdministrator = computed(
  () => context.value?.systemProfileName === 'SystemAdministrator',
)

const items = ref<ProfileListItem[]>([])
const totalCount = ref(0)
const loading = ref(false)
const search = ref('')
const scope = ref<string | null>(null)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)

// RN-069/RN-070/RN-074: manutenção de perfis customizados do escopo ativo.
const formOpen = ref(false)
const saving = ref(false)
const editing = ref<{ id: string, name: string, permissionCodes: string[] } | null>(null)
// RN-073: quando o perfil em edição é fixo, o formulário edita só as permissões (efeito global).
const editingFixed = ref(false)

const headers = [
  { title: 'Perfil', key: 'name' },
  { title: 'Escopo', key: 'scope' },
  { title: 'Origem', key: 'isFixed' },
  { title: 'Permissões', key: 'permissionCount' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' },
] as const

await refresh()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listProfiles({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      scope: scope.value ?? undefined,
    })
    items.value = response.items
    totalCount.value = Number(response.totalCount)
  }
  catch (requestError) {
    error.value = describeRequestError(requestError, 'Não foi possível carregar os perfis de acesso.')
    items.value = []
    totalCount.value = 0
  }
  finally {
    loading.value = false
  }
}

watch([search, scope], () => {
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

function openCreate() {
  editing.value = null
  editingFixed.value = false
  formOpen.value = true
}

/**
 * RN-073/RN-074: editar carrega as permissões já marcadas. Perfil fixo só chega aqui para o
 * Administrador do Sistema, e nele o formulário edita apenas as permissões.
 */
async function openEdit(profileId: string, isFixed: boolean) {
  error.value = null
  success.value = null

  try {
    const profile = await getProfile(profileId)
    editing.value = {
      id: profile.id,
      name: getProfileLabel(profile.name),
      permissionCodes: profile.permissions.map(permission => permission.code),
    }
    editingFixed.value = isFixed
    formOpen.value = true
  }
  catch (requestError) {
    error.value = describeRequestError(requestError, 'Não foi possível carregar o perfil.')
  }
}

async function confirmForm(payload: { name: string, permissionCodes: string[] }) {
  saving.value = true
  error.value = null
  success.value = null

  try {
    if (editing.value && editingFixed.value) {
      // RN-073: perfil fixo — só permissões, e a mudança vale para todos os escopos.
      await updateFixedProfilePermissions(editing.value.id, {
        permissionCodes: payload.permissionCodes,
      })
      success.value = `Permissões de ${editing.value.name} atualizadas para toda a plataforma.`
    }
    else if (editing.value) {
      await updateProfile(editing.value.id, payload)
      success.value = `Perfil ${payload.name} atualizado.`
    }
    else {
      await createProfile(payload)
      success.value = `Perfil ${payload.name} criado.`
    }

    formOpen.value = false
    await refresh()
  }
  catch (requestError) {
    error.value = describeRequestError(requestError, 'Não foi possível salvar o perfil.')
  }
  finally {
    saving.value = false
  }
}

/** RN-074: a recusa por perfil em uso vem do servidor, com a mensagem dele. */
async function removeProfile(profileId: string, profileName: string) {
  error.value = null
  success.value = null

  try {
    await deleteProfile(profileId)
    success.value = `Perfil ${profileName} removido.`
    await refresh()
  }
  catch (requestError) {
    error.value = describeRequestError(requestError, 'Não foi possível remover o perfil.')
  }
}
</script>

<template>
  <VContainer class="si-profiles">
    <div class="si-profiles__header">
      <h1 class="text-h5">
        Perfis de acesso
      </h1>

      <div class="si-profiles__header-actions">
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
          @click="openCreate"
        >
          Novo perfil
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

    <div class="si-profiles__toolbar">
      <div class="si-profiles__count">
        {{ totalCount }} perfil{{ totalCount === 1 ? '' : 's' }}
      </div>

      <div class="si-profiles__filters">
        <SiSelect
          v-model="scope"
          label="Escopo"
          :items="profileScopeOptions"
          density="compact"
          hide-details
          class="si-profiles__scope"
        />

        <SiTextField
          v-model="search"
          placeholder="Buscar por nome do perfil"
          :prepend-inner-icon="'search'"
          density="compact"
          clearable
          hide-details
          class="si-profiles__search"
        />
      </div>
    </div>

    <SiCard
      class="si-profiles__table-card"
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
        class="si-profiles__table"
      >
        <template #[`item.name`]="{ item }">
          <span class="si-cell-strong">{{ getProfileLabel(item.name) }}</span>
        </template>

        <template #[`item.scope`]="{ item }">
          <SiChip
            size="small"
            :color="getProfileScopeView(item.scope).color"
          >
            {{ getProfileScopeView(item.scope).label }}
          </SiChip>
        </template>

        <template #[`item.isFixed`]="{ item }">
          {{ item.isFixed ? 'Fixo da plataforma' : 'Customizado' }}
        </template>

        <template #[`item.permissionCount`]="{ item }">
          {{ item.permissionCount }}
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-profiles__actions">
            <SiTooltip text="Detalhes">
              <template #activator="{ props }">
                <SiIconButton
                  v-bind="props"
                  :to="`/perfis/${item.id}`"
                  icon="eye"
                  tone="view"
                  aria-label="Detalhes"
                />
              </template>
            </SiTooltip>

            <!--
              RN-073/RN-074: perfil customizado é editado pelo administrador do escopo; perfil fixo
              só tem as permissões editadas, e apenas pelo Administrador do Sistema.
            -->
            <SiTooltip
              :text="item.isFixed
                ? (isSystemAdministrator ? 'Editar permissões (efeito global)' : 'Perfil fixo da plataforma')
                : 'Editar'"
            >
              <template #activator="{ props }">
                <SiIconButton
                  v-bind="props"
                  icon="pencil"
                  tone="edit"
                  :disabled="item.isFixed && !isSystemAdministrator"
                  aria-label="Editar"
                  @click="openEdit(item.id, item.isFixed)"
                />
              </template>
            </SiTooltip>

            <SiTooltip :text="item.isFixed ? 'Perfil fixo da plataforma' : 'Remover'">
              <template #activator="{ props }">
                <SiIconButton
                  v-bind="props"
                  icon="trash"
                  tone="delete"
                  :disabled="item.isFixed"
                  aria-label="Remover"
                  @click="removeProfile(item.id, item.name)"
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

    <ProfilesFormDialog
      v-model="formOpen"
      :profile="editing"
      :fixed-profile="editingFixed"
      :submitting="saving"
      @confirm="confirmForm"
    />
  </VContainer>
</template>

<style scoped>
.si-profiles {
  max-width: var(--si-container-wide);
}

.si-profiles__header,
.si-profiles__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-profiles__header {
  margin-block: var(--si-space-6) var(--si-space-4);
}

.si-profiles__header h1 {
  margin: 0;
}

.si-profiles__header-actions,
.si-profiles__filters {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-profiles__table-card {
  overflow: hidden;
}

.si-profiles__toolbar {
  margin-bottom: var(--si-space-3);
}

.si-profiles__search {
  flex: 0 0 280px;
  max-width: 280px;
  width: 280px;
}

.si-profiles__scope {
  flex: 0 0 180px;
  max-width: 180px;
  width: 180px;
}

.si-profiles__count {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-profiles__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-2);
}

@media (max-width: 700px) {
  .si-profiles__header,
  .si-profiles__toolbar,
  .si-profiles__header-actions,
  .si-profiles__filters {
    align-items: stretch;
    flex-direction: column;
  }

  .si-profiles__search,
  .si-profiles__scope {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
  }
}
</style>
