<script setup lang="ts">
/**
 * Perfis de acesso (handoff §4–§9). Listagem + editor + exclusão-com-migração. Reusa o kit `Si`,
 * o editor de permissões (`<PermissionsEditor>`, o coração) e o padrão de listagem (tabela desktop
 * / cards no mobile, 4 estados). Os perfis são poucos: buscamos a página cheia e filtramos/paginamos
 * no cliente, o que viabiliza os filtros do drawer (o contrato do backend só filtra por nome+escopo).
 */
import type { ProfileListItem } from '~/composables/useProfiles'
import type { EditorConfirmPayload, EditorMode, EditorProfile } from '~/components/profiles-access/EditorDialog.vue'
import type { DeleteProfileTarget } from '~/components/profiles-access/DeleteDialog.vue'
import { extractApiErrorMessage } from '~/lib/apiError'
import { getProfileLabel, getProfileScopeView, profileScopes } from '~/lib/status/profiles'

definePageMeta({ layout: 'shell' })

const {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  updateFixedProfilePermissions,
  deleteProfile,
} = useProfiles()
const { catalog, load: loadCatalog } = usePermissionsCatalog()
const { context, loadContext } = useWorkspaces()

const isSystemAdministrator = computed(() => context.value?.systemProfileName === 'SystemAdministrator')

const items = ref<ProfileListItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

// Filtros (client-side sobre a lista carregada).
const tab = ref<string>('todos')
const q = ref('')
const drawerOpen = ref(false)
const fOrigem = ref<'todos' | 'fixed' | 'custom'>('todos')
const fUso = ref<'todos' | 'com' | 'sem'>('todos')
const fFrom = ref<string | null>(null)
const fTo = ref<string | null>(null)
const page = ref(1)
const perPage = ref(10)

const narrow = ref(false)
let mql: MediaQueryList | null = null
function onNarrow(event: MediaQueryListEvent | MediaQueryList) {
  narrow.value = event.matches
}

const scopeTabs = [
  { value: 'todos', label: 'Todos', scope: null },
  { value: 'system', label: 'Sistema', scope: profileScopes.system },
  { value: 'brokerage', label: 'Corretora', scope: profileScopes.brokerage },
  { value: 'policyHolder', label: 'Tomador', scope: profileScopes.policyHolder },
] as const

const origemOptions = [
  { title: 'Todas', value: 'todos' },
  { title: 'Fixo da plataforma', value: 'fixed' },
  { title: 'Customizado', value: 'custom' },
]
const usoOptions = [
  { title: 'Qualquer', value: 'todos' },
  { title: 'Com usuários vinculados', value: 'com' },
  { title: 'Sem nenhum usuário', value: 'sem' },
]

const num = (value: number | string | null | undefined) => Number(value ?? 0)

await loadContext()
await Promise.all([refresh(), loadCatalog().catch(() => {})])

onMounted(() => {
  mql = window.matchMedia('(max-width: 1023px)')
  narrow.value = mql.matches
  mql.addEventListener('change', onNarrow)
})
onBeforeUnmount(() => mql?.removeEventListener('change', onNarrow))

async function refresh() {
  loading.value = true
  error.value = null
  try {
    // pageSize alto: perfis são poucos; filtramos/paginamos no cliente.
    const response = await listProfiles({ page: 1, pageSize: 200 })
    items.value = response.items
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível carregar os perfis de acesso.')
    items.value = []
  }
  finally {
    loading.value = false
  }
}

const activeScope = computed(() => scopeTabs.find(t => t.value === tab.value)?.scope ?? null)

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase()
  return items.value.filter((profile) => {
    if (activeScope.value && profile.scope !== activeScope.value) {
      return false
    }
    if (fOrigem.value === 'fixed' && !profile.isFixed) {
      return false
    }
    if (fOrigem.value === 'custom' && profile.isFixed) {
      return false
    }
    if (fUso.value === 'com' && num(profile.userCount) === 0) {
      return false
    }
    if (fUso.value === 'sem' && num(profile.userCount) > 0) {
      return false
    }
    if (fFrom.value && profile.createdAt < fFrom.value) {
      return false
    }
    if (fTo.value && profile.createdAt > `${fTo.value}T23:59:59`) {
      return false
    }
    if (term) {
      const haystack = `${getProfileLabel(profile.name)} ${profile.name} ${profile.description ?? ''}`.toLowerCase()
      if (!haystack.includes(term)) {
        return false
      }
    }
    return true
  })
})

const totalFiltered = computed(() => filtered.value.length)
const paged = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})

const activeFilterCount = computed(() =>
  (fOrigem.value !== 'todos' ? 1 : 0)
  + (fUso.value !== 'todos' ? 1 : 0)
  + (fFrom.value ? 1 : 0)
  + (fTo.value ? 1 : 0))

const hasAnyFilter = computed(() =>
  Boolean(q.value.trim()) || tab.value !== 'todos' || activeFilterCount.value > 0)

// Estado da lista: '' = dados; 'empty-first' = nenhum perfil e sem filtro; 'empty-none' = filtro sem resultado.
const listState = computed(() => {
  if (totalFiltered.value > 0) {
    return 'data'
  }
  return !hasAnyFilter.value && items.value.length === 0 ? 'empty-first' : 'empty-none'
})

watch([tab, q, fOrigem, fUso, fFrom, fTo], () => {
  page.value = 1
})

function clearFilters() {
  q.value = ''
  tab.value = 'todos'
  fOrigem.value = 'todos'
  fUso.value = 'todos'
  fFrom.value = null
  fTo.value = null
}

const headers = [
  { title: 'Perfil', key: 'name', sortable: false, width: '330px' },
  { title: 'Escopo', key: 'scope', sortable: false, width: '118px' },
  { title: 'Origem', key: 'origin', sortable: false, width: '152px' },
  { title: 'Permissões', key: 'permissions', sortable: false, width: '140px', align: 'end' as const },
  { title: 'Usuários', key: 'users', sortable: false, width: '96px', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, width: '96px', align: 'end' as const },
]

// ---- Editor ----
const editorOpen = ref(false)
const editorMode = ref<EditorMode>('novo')
const editorProfile = ref<EditorProfile | null>(null)
const editorSubmitting = ref(false)
const editorError = ref<string | null>(null)

async function openCreate() {
  editorMode.value = 'novo'
  editorProfile.value = null
  editorError.value = null
  await loadCatalog().catch(() => {})
  editorOpen.value = true
}

/** Abre o editor carregando as permissões marcadas do perfil. */
async function openEditorFor(id: string, mode: EditorMode) {
  editorError.value = null
  try {
    const profile = await getProfile(id)
    editorProfile.value = {
      id: profile.id,
      name: profile.name,
      scope: profile.scope,
      description: profile.description,
      permissionCodes: profile.permissions.map(permission => permission.code),
    }
    editorMode.value = mode
    await loadCatalog().catch(() => {})
    editorOpen.value = true
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível carregar o perfil.')
  }
}

function duplicate(profile: ProfileListItem) {
  openEditorFor(profile.id, 'duplicar')
}

/**
 * RN-073/RN-074 — a guarda de perfil fixo é na FUNÇÃO, não só no estilo: perfil fixo só é editável
 * pelo Administrador do Sistema (permissões, efeito global); para os demais, early-return.
 */
function requestEdit(profile: ProfileListItem) {
  if (profile.isFixed) {
    if (!isSystemAdministrator.value) {
      return
    }
    openEditorFor(profile.id, 'editar-fixo')
    return
  }
  openEditorFor(profile.id, 'editar')
}

async function confirmEditor(payload: EditorConfirmPayload) {
  editorSubmitting.value = true
  editorError.value = null
  try {
    if (editorMode.value === 'editar-fixo' && editorProfile.value?.id) {
      await updateFixedProfilePermissions(editorProfile.value.id, { permissionCodes: payload.permissionCodes })
      success.value = `Permissões de ${getProfileLabel(editorProfile.value.name)} atualizadas para toda a plataforma.`
    }
    else if (editorMode.value === 'editar' && editorProfile.value?.id) {
      await updateProfile(editorProfile.value.id, payload)
      success.value = `Perfil ${payload.name} atualizado com ${payload.permissionCodes.length} permissões.`
    }
    else {
      await createProfile(payload)
      success.value = `Perfil ${payload.name} criado. Ele já aparece na hora de convidar um usuário.`
    }
    editorOpen.value = false
    await refresh()
  }
  catch (requestError) {
    editorError.value = extractApiErrorMessage(requestError, 'Não foi possível salvar o perfil.')
  }
  finally {
    editorSubmitting.value = false
  }
}

// ---- Exclusão ----
const deleteOpen = ref(false)
const deleteTarget = ref<DeleteProfileTarget | null>(null)
const deleteSubmitting = ref(false)
const deleteError = ref<string | null>(null)

const migrationOptions = computed(() => {
  const target = deleteTarget.value
  if (!target) {
    return []
  }
  const scope = items.value.find(profile => profile.id === target.id)?.scope
  return items.value
    .filter(profile => profile.id !== target.id && profile.scope === scope)
    .map(profile => ({ title: getProfileLabel(profile.name), value: profile.id }))
})

/** RN-074: perfil fixo nunca chega ao fluxo de exclusão (guarda na função). */
function requestDelete(profile: ProfileListItem) {
  if (profile.isFixed) {
    return
  }
  deleteTarget.value = { id: profile.id, name: profile.name, userCount: num(profile.userCount) }
  deleteError.value = null
  deleteOpen.value = true
}

async function confirmDelete(payload: { migrateToProfileId?: string }) {
  const target = deleteTarget.value
  if (!target) {
    return
  }
  deleteSubmitting.value = true
  deleteError.value = null
  try {
    await deleteProfile(target.id, payload.migrateToProfileId)
    if (payload.migrateToProfileId) {
      const to = getProfileLabel(items.value.find(p => p.id === payload.migrateToProfileId)?.name)
      success.value = `Perfil ${getProfileLabel(target.name)} excluído. ${target.userCount} ${target.userCount === 1 ? 'usuário migrou' : 'usuários migraram'} para ${to}.`
    }
    else {
      success.value = `Perfil ${getProfileLabel(target.name)} excluído.`
    }
    deleteOpen.value = false
    await refresh()
  }
  catch (requestError) {
    deleteError.value = extractApiErrorMessage(requestError, 'Não foi possível remover o perfil.')
  }
  finally {
    deleteSubmitting.value = false
  }
}

function editTooltip(profile: ProfileListItem): string {
  if (!profile.isFixed) {
    return 'Editar permissões'
  }
  return isSystemAdministrator.value
    ? 'Editar permissões (efeito global)'
    : 'Perfil fixo da plataforma — duplique para ajustar.'
}

/** Exportação client-side (CSV) da lista filtrada — o botão Exportar (§4) sem endpoint dedicado. */
function exportCsv() {
  const rows: string[][] = [['Perfil', 'Escopo', 'Origem', 'Permissões', 'Áreas', 'Usuários']]
  for (const profile of filtered.value) {
    rows.push([
      getProfileLabel(profile.name),
      getProfileScopeView(profile.scope).label,
      profile.isFixed ? 'Fixo da plataforma' : 'Customizado',
      String(num(profile.permissionCount)),
      String(num(profile.areaCount)),
      String(num(profile.userCount)),
    ])
  }
  const csv = rows.map(cols => cols.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`${String.fromCharCode(0xFEFF)}${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'perfis-de-acesso.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <VContainer class="si-profiles">
    <!-- Cabeçalho (§4) -->
    <header class="si-profiles__header">
      <div>
        <p class="si-profiles__eyebrow">
          Acessos · Perfis
        </p>
        <h1 class="si-profiles__title">
          Perfis de acesso
        </h1>
      </div>
      <div class="si-profiles__cta">
        <SiButton
          variant="outlined"
          color="secondary"
          size="small"
          :prepend-icon="'download'"
          :disabled="listState !== 'data'"
          @click="exportCsv"
        >
          Exportar
        </SiButton>
        <SiButton
          :prepend-icon="'plus'"
          size="small"
          @click="openCreate"
        >
          {{ narrow ? 'Novo' : 'Novo perfil' }}
        </SiButton>
      </div>
    </header>

    <SiAlert
      v-if="success"
      type="success"
      class="mb-4"
      closable
      :text="success"
      @click:close="success = null"
    />

    <!-- Filtros: abas + busca + filtros avançados (§5) — escondidos no vazio-primeiro-uso -->
    <SiCard
      v-if="listState !== 'empty-first'"
      variant="outlined"
      class="si-profiles__filters"
    >
      <SiTabs
        v-model="tab"
        class="si-profiles__tabs"
      >
        <SiTab
          v-for="t in scopeTabs"
          :key="t.value"
          :value="t.value"
          :text="t.label"
        />
      </SiTabs>

      <div class="si-profiles__toolbar">
        <div class="si-profiles__search">
          <SiTextField
            v-model="q"
            placeholder="Buscar por nome do perfil ou permissão"
            :prepend-inner-icon="'search'"
            density="compact"
            hide-details
            clearable
          />
        </div>
        <SiButton
          variant="outlined"
          color="secondary"
          size="small"
          :prepend-icon="'filter'"
          @click="drawerOpen = true"
        >
          Filtros avançados{{ activeFilterCount ? ` (${activeFilterCount})` : '' }}
        </SiButton>
      </div>
    </SiCard>

    <!-- Erro -->
    <SiCard
      v-if="error"
      variant="outlined"
      class="si-profiles__state"
    >
      <SiIcon
        icon="alertTriangle"
        :size="32"
        color="warning"
      />
      <h2>Não foi possível carregar os perfis</h2>
      <p>A consulta expirou. Isso costuma ser instabilidade momentânea do serviço de identidade.</p>
      <SiButton
        size="small"
        :prepend-icon="'refresh'"
        @click="refresh"
      >
        Tentar novamente
      </SiButton>
    </SiCard>

    <!-- Carregando -->
    <SiCard
      v-else-if="loading"
      variant="outlined"
      class="si-profiles__table-card"
    >
      <div class="si-profiles__skeleton">
        <SiSkeleton
          v-for="n in 6"
          :key="n"
          height="52px"
          class="mb-2"
        />
      </div>
    </SiCard>

    <!-- Vazio — primeiro uso (§7) -->
    <SiCard
      v-else-if="listState === 'empty-first'"
      variant="outlined"
      class="si-profiles__state"
    >
      <SiIcon
        icon="keyRound"
        :size="32"
        color="primary"
      />
      <h2>Você ainda não tem perfis de acesso</h2>
      <p>
        O perfil reúne as ações que uma pessoa pode executar na plataforma. Crie um perfil antes de
        convidar o primeiro usuário — é ele que autoriza cada operação.
      </p>
      <SiButton
        size="small"
        :prepend-icon="'plus'"
        @click="openCreate"
      >
        Novo perfil
      </SiButton>
    </SiCard>

    <!-- Vazio — filtro sem resultado (§7) -->
    <SiCard
      v-else-if="listState === 'empty-none'"
      variant="outlined"
      class="si-profiles__state"
    >
      <SiIcon
        icon="search"
        :size="32"
        color="secondary"
      />
      <h2>Nenhum perfil encontrado</h2>
      <p v-if="q.trim()">
        Nada corresponde a «{{ q.trim() }}». A busca também procura dentro da descrição de cada perfil.
      </p>
      <p v-else>
        Nenhum perfil corresponde aos filtros atuais.
      </p>
      <SiButton
        variant="outlined"
        color="secondary"
        size="small"
        @click="clearFilters"
      >
        Limpar filtros
      </SiButton>
    </SiCard>

    <!-- Cards no mobile -->
    <div
      v-else-if="narrow"
      class="si-profiles__cards"
    >
      <SiCard
        v-for="profile in paged"
        :key="profile.id"
        variant="outlined"
        class="si-profiles__card"
      >
        <div class="si-profiles__card-top">
          <span class="si-profiles__card-name">{{ getProfileLabel(profile.name) }}</span>
          <SiChip
            size="small"
            :color="getProfileScopeView(profile.scope).color"
          >
            {{ getProfileScopeView(profile.scope).label }}
          </SiChip>
        </div>
        <p
          v-if="profile.description"
          class="si-profiles__card-desc"
        >
          {{ profile.description }}
        </p>
        <div class="si-profiles__card-grid">
          <div>
            <span class="si-profiles__card-label">Permissões</span>
            <span class="si-profiles__card-value">{{ num(profile.permissionCount) }}</span>
          </div>
          <div>
            <span class="si-profiles__card-label">Usuários</span>
            <span class="si-profiles__card-value">{{ num(profile.userCount) }}</span>
          </div>
        </div>
        <div class="si-profiles__card-actions">
          <SiButton
            variant="text"
            size="small"
            :prepend-icon="'eye'"
            :to="`/perfis-acesso/${profile.id}`"
          >
            Ver permissões
          </SiButton>
          <SiButton
            v-if="!profile.isFixed"
            variant="outlined"
            color="secondary"
            size="small"
            :prepend-icon="'pencil'"
            @click="requestEdit(profile)"
          >
            Editar
          </SiButton>
          <SiButton
            v-else
            variant="outlined"
            color="secondary"
            size="small"
            :prepend-icon="'copy'"
            @click="duplicate(profile)"
          >
            Duplicar
          </SiButton>
        </div>
      </SiCard>
      <SiPagination
        v-model:page="page"
        v-model:items-per-page="perPage"
        :total="totalFiltered"
      />
    </div>

    <!-- Tabela no desktop (§6) -->
    <SiCard
      v-else
      variant="outlined"
      class="si-profiles__table-card"
    >
      <SiDataTable
        :headers="headers"
        :items="paged"
        :items-per-page="perPage"
        hide-default-footer
        class="si-profiles__table"
      >
        <template #[`item.name`]="{ item }">
          <div class="si-profiles__perfil">
            <span class="si-profiles__key">
              <SiIcon
                icon="keyRound"
                :size="18"
              />
            </span>
            <span class="si-profiles__perfil-text">
              <span class="si-profiles__perfil-name">{{ getProfileLabel(item.name) }}</span>
              <span
                v-if="item.description"
                class="si-profiles__perfil-desc"
              >{{ item.description }}</span>
            </span>
          </div>
        </template>

        <template #[`item.scope`]="{ item }">
          <SiChip
            size="small"
            :color="getProfileScopeView(item.scope).color"
          >
            {{ getProfileScopeView(item.scope).label }}
          </SiChip>
        </template>

        <template #[`item.origin`]="{ item }">
          <span :class="['si-profiles__origin', { 'si-profiles__origin--fixed': item.isFixed }]">
            {{ item.isFixed ? 'Fixo da plataforma' : 'Customizado' }}
          </span>
        </template>

        <template #[`item.permissions`]="{ item }">
          <div class="si-profiles__perms-cell">
            <template v-if="num(item.permissionCount) > 0">
              <span class="si-profiles__perms-n">
                {{ num(item.permissionCount) }} {{ num(item.permissionCount) === 1 ? 'permissão' : 'permissões' }}
              </span>
              <span class="si-profiles__perms-areas">
                em {{ num(item.areaCount) }} {{ num(item.areaCount) === 1 ? 'área' : 'áreas' }}
              </span>
            </template>
            <template v-else>
              <span class="si-profiles__perms-none">Nenhuma</span>
              <span class="si-profiles__perms-areas">não autoriza operação</span>
            </template>
          </div>
        </template>

        <template #[`item.users`]="{ item }">
          <span :class="['si-profiles__users', { 'si-profiles__users--zero': num(item.userCount) === 0 }]">
            <SiIcon
              icon="users"
              :size="15"
            />
            {{ num(item.userCount) }}
          </span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="si-profiles__actions">
            <SiTooltip text="Ver permissões">
              <template #activator="{ props: tip }">
                <SiIconButton
                  v-bind="tip"
                  icon="eye"
                  tone="view"
                  :to="`/perfis-acesso/${item.id}`"
                  aria-label="Ver permissões"
                />
              </template>
            </SiTooltip>

            <SiMenu>
              <template #activator="{ props: menu }">
                <SiIconButton
                  v-bind="menu"
                  icon="dotsHorizontal"
                  aria-label="Mais ações"
                />
              </template>
              <SiList
                density="compact"
                class="si-profiles__menu"
              >
                <SiListItem
                  title="Duplicar perfil"
                  prepend-icon="copy"
                  @click="duplicate(item)"
                />
                <SiTooltip
                  :text="editTooltip(item)"
                  location="start"
                >
                  <template #activator="{ props: tip }">
                    <div v-bind="tip">
                      <SiListItem
                        title="Editar permissões"
                        prepend-icon="pencil"
                        :disabled="item.isFixed && !isSystemAdministrator"
                        @click="requestEdit(item)"
                      />
                    </div>
                  </template>
                </SiTooltip>
                <SiTooltip
                  v-if="item.isFixed"
                  text="Perfis fixos não podem ser excluídos."
                  location="start"
                >
                  <template #activator="{ props: tip }">
                    <div v-bind="tip">
                      <SiListItem
                        title="Excluir perfil"
                        prepend-icon="trash"
                        disabled
                      />
                    </div>
                  </template>
                </SiTooltip>
                <SiListItem
                  v-else
                  title="Excluir perfil"
                  prepend-icon="trash"
                  class="si-profiles__menu-danger"
                  @click="requestDelete(item)"
                />
              </SiList>
            </SiMenu>
          </div>
        </template>
      </SiDataTable>

      <SiPagination
        v-model:page="page"
        v-model:items-per-page="perPage"
        :total="totalFiltered"
        :per-page-options="[8, 10, 20]"
      />
    </SiCard>

    <!-- Drawer de filtros avançados (§5) -->
    <SiNavigationDrawer
      v-model="drawerOpen"
      location="right"
      temporary
      :width="400"
      class="si-profiles__drawer"
    >
      <div class="si-profiles__drawer-body">
        <div class="si-profiles__drawer-head">
          <h2>Filtros avançados</h2>
          <SiIconButton
            icon="close"
            aria-label="Fechar"
            @click="drawerOpen = false"
          />
        </div>
        <SiSelect
          v-model="fOrigem"
          label="Origem"
          :items="origemOptions"
          hide-details
        />
        <SiSelect
          v-model="fUso"
          label="Uso"
          :items="usoOptions"
          hide-details
        />
        <div class="si-profiles__drawer-dates">
          <SiDateField
            v-model="fFrom"
            label="Criado de"
            hide-details
          />
          <SiDateField
            v-model="fTo"
            label="Criado até"
            hide-details
          />
        </div>
        <p class="si-profiles__drawer-note">
          Para achar pelo nome do perfil ou por uma permissão específica, use o campo de busca da
          listagem.
        </p>
        <div class="si-profiles__drawer-actions">
          <SiButton
            variant="text"
            size="small"
            @click="clearFilters"
          >
            Limpar
          </SiButton>
          <SiButton
            size="small"
            @click="drawerOpen = false"
          >
            Ver {{ totalFiltered }} resultados
          </SiButton>
        </div>
      </div>
    </SiNavigationDrawer>

    <ProfilesAccessEditorDialog
      v-if="catalog"
      v-model="editorOpen"
      :mode="editorMode"
      :catalog="catalog"
      :profile="editorProfile"
      :submitting="editorSubmitting"
      :error="editorError"
      @confirm="confirmEditor"
    />

    <ProfilesAccessDeleteDialog
      v-model="deleteOpen"
      :profile="deleteTarget"
      :migration-options="migrationOptions"
      :submitting="deleteSubmitting"
      :error="deleteError"
      @confirm="confirmDelete"
    />
  </VContainer>
</template>

<style scoped>
.si-profiles {
  max-width: var(--si-container-wide, 1200px);
}

.si-profiles__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-block: var(--si-space-6) var(--si-space-4);
  flex-wrap: wrap;
}

.si-profiles__eyebrow {
  margin: 0;
  font-size: var(--si-fs-eyebrow);
  letter-spacing: var(--si-ls-eyebrow);
  text-transform: uppercase;
  color: var(--si-cinza);
}

.si-profiles__title {
  margin: 2px 0 0;
  font-size: 28px;
  font-weight: var(--si-font-weight-semibold);
  letter-spacing: -0.02em;
}

.si-profiles__cta {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-profiles__filters {
  padding: var(--si-space-2) var(--si-space-4) var(--si-space-4);
  margin-bottom: var(--si-space-4);
}

/* Gotcha do handoff: o Tabs precisa disso ou a régua de rolagem aparece. */
.si-profiles__tabs :deep([role="tablist"]) {
  overflow-y: hidden;
}

.si-profiles__toolbar {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  margin-top: var(--si-space-3);
  flex-wrap: wrap;
}

.si-profiles__search {
  flex: 1 1 280px;
  min-width: 280px;
}

.si-profiles__search :deep(.v-input) {
  width: 100%;
}

.si-profiles__table-card {
  overflow: hidden;
}

.si-profiles__skeleton {
  padding: var(--si-space-4);
}

/* Estados (erro / vazio) */
.si-profiles__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-2);
  padding: var(--si-space-12) var(--si-space-6);
}

.si-profiles__state h2 {
  margin: var(--si-space-2) 0 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-profiles__state p {
  margin: 0 0 var(--si-space-3);
  max-width: 460px;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

/* Tabela: larguras fixas (§6) — o SiDataTable recorta o excedente. */
.si-profiles__table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.si-profiles__table :deep(td),
.si-profiles__table :deep(th) {
  overflow: hidden;
  padding-inline: 10px;
}

.si-profiles__perfil {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  min-width: 0;
}

.si-profiles__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--si-radius-md);
  background: var(--si-verde-100);
  color: var(--si-verde-800);
  flex-shrink: 0;
}

.si-profiles__perfil-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.si-profiles__perfil-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si-profiles__perfil-desc {
  font-size: 12px;
  color: var(--si-cinza);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si-profiles__origin {
  font-size: var(--si-fs-small);
  color: var(--si-cinza);
}

.si-profiles__origin--fixed {
  color: var(--si-cinza);
}

.si-profiles__perms-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.3;
}

.si-profiles__perms-n {
  font-size: 13.5px;
  font-weight: var(--si-font-weight-semibold);
}

.si-profiles__perms-areas {
  font-size: 11.5px;
  color: var(--si-border-strong);
}

.si-profiles__perms-none {
  font-size: 13.5px;
  color: var(--si-border-strong);
}

.si-profiles__users {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  width: 100%;
  font-variant-numeric: tabular-nums;
  color: var(--si-cinza);
}

.si-profiles__users--zero {
  color: var(--si-border-strong);
}

.si-profiles__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-1);
}

.si-profiles__menu {
  min-width: 258px;
}

.si-profiles__menu-danger :deep(.v-list-item-title) {
  color: var(--si-danger-strong);
}

/* Mobile cards (§11) */
.si-profiles__cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-profiles__card {
  padding: var(--si-space-4);
}

.si-profiles__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
}

.si-profiles__card-name {
  font-size: 15.5px;
  font-weight: var(--si-font-weight-semibold);
}

.si-profiles__card-desc {
  margin: var(--si-space-1) 0 0;
  font-size: 12.5px;
  color: var(--si-cinza);
}

.si-profiles__card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-2);
  margin: var(--si-space-3) 0;
  border-block: 1px solid var(--si-divider);
  padding-block: var(--si-space-2);
}

.si-profiles__card-label {
  display: block;
  font-size: 11.5px;
  color: var(--si-cinza);
}

.si-profiles__card-value {
  font-size: 14px;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.si-profiles__card-actions {
  display: flex;
  gap: var(--si-space-2);
}

.si-profiles__card-actions :deep(.v-btn) {
  min-height: 44px;
}

/* Drawer */
.si-profiles__drawer-body {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-4);
  padding: var(--si-space-4);
}

.si-profiles__drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.si-profiles__drawer-head h2 {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-profiles__drawer-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-2);
}

.si-profiles__drawer-note {
  margin: 0;
  font-size: 12px;
  color: var(--si-cinza);
}

.si-profiles__drawer-actions {
  display: flex;
  gap: var(--si-space-2);
  margin-top: auto;
}

.si-profiles__drawer-actions :deep(.v-btn):last-child {
  flex: 1;
}
</style>
