<script setup lang="ts">
import type { UserListItem, UserStatusCounts } from '~/composables/useUsers'
import type { UsersFilters } from '~/components/users/FiltersDrawer.vue'
import { extractApiErrorMessage } from '~/lib/apiError'
import { getProfileLabel, getProfileScopeView, profileScopes } from '~/lib/status/profiles'
import {
  getUserDisplayStatus,
  userStatusTabs,
  type UserStatusTabKey,
} from '~/lib/status/users'

/**
 * Listagem de Usuários (RN-001/RN-012/RN-064). Estrutura de tela igual às demais listagens
 * (Cotações/Corretoras): cabeçalho + card de filtros (abas de situação + busca) + card da tabela
 * com os quatro estados + rodapé; mobile é lista de cards. "Convite expirado" é situação de
 * exibição derivada do flag `inviteExpired` (RN-065). As ações reenviar/inativar/reativar são
 * decididas no servidor (RN-065/RN-076); o front só dispara e reflete o resultado.
 *
 * NOTA (fatia): o drawer de filtros avançados (perfil/escopo/vínculo/último acesso/data) depende de
 * parâmetros de filtro e fontes de opção ainda inexistentes no backend — entra num sub-passo próprio.
 */
definePageMeta({ layout: 'shell' })

const {
  listUsers,
  resendInvitation,
  inactivateUser,
  reactivateUser,
  inviteBrokerageAdministrator,
  invitePolicyHolderAdministrator,
  inviteBrokerageUser,
  invitePolicyHolderUser,
} = useUsers()
const { listProfiles } = useProfiles()
const { listBrokerages } = useBrokerages()

const items = ref<UserListItem[]>([])
const counts = ref<UserStatusCounts>({ all: 0, active: 0, pending: 0, expired: 0, inactive: 0 })
const totalCount = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)

const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const tab = ref<UserStatusTabKey>('todos')

// Filtros avançados (§4): rascunho aplicado pelo drawer; opções vêm de perfis/corretoras da base.
const drawerOpen = ref(false)
function emptyFilters(): UsersFilters {
  return { profileId: null, scope: null, linkId: null, registeredFrom: null, registeredTo: null }
}
const filters = ref<UsersFilters>(emptyFilters())
const profileOptions = ref<{ title: string, value: string }[]>([])
const linkOptions = ref<{ title: string, value: string }[]>([])

// Feedback (§10): toast efêmero e mensagem de erro do backend (extractApiErrorMessage).
const toast = ref('')

// Convite de Corretor Administrador (RN-066) e "Novo usuário" (RN-068/069/070) — modais existentes.
const inviteAdminOpen = ref(false)
const invitingAdmin = ref(false)
const scopedInviteOpen = ref(false)
const scopedInviting = ref(false)
const inviteError = ref<string | null>(null)

// Confirmação de inativação (§10): modal pequeno, ação destrutiva em vermelho.
const confirmInactivate = ref<UserListItem | null>(null)
const actingId = ref<string | null>(null)

// Editar usuário (§9, RN-202): o modal busca o detalhe pelo id ao abrir.
const editUserId = ref<string | null>(null)
const editOpen = ref(false)

const currentTab = computed(() => userStatusTabs.find(t => t.key === tab.value) ?? userStatusTabs[0]!)

function tabCount(countKey: keyof UserStatusCounts): number {
  return Number(counts.value[countKey] ?? 0)
}

// Chips dos filtros avançados ativos (removíveis); resolvem o rótulo pelas opções carregadas.
const activeFilterChips = computed<{ key: string, label: string }[]>(() => {
  const f = filters.value
  const chips: { key: string, label: string }[] = []
  if (f.profileId) {
    chips.push({ key: 'profile', label: `Perfil: ${profileOptions.value.find(p => p.value === f.profileId)?.title ?? '—'}` })
  }
  if (f.scope) {
    chips.push({ key: 'scope', label: `Escopo: ${getProfileScopeView(f.scope).label}` })
  }
  if (f.linkId) {
    chips.push({ key: 'link', label: `Vínculo: ${linkOptions.value.find(l => l.value === f.linkId)?.title ?? '—'}` })
  }
  if (f.registeredFrom || f.registeredTo) {
    chips.push({ key: 'registered', label: `Cadastro: ${f.registeredFrom ?? '…'} – ${f.registeredTo ?? '…'}` })
  }
  return chips
})

const hasActiveFilters = computed(
  () => !!search.value || tab.value !== 'todos' || activeFilterChips.value.length > 0,
)
const isEmptyFirstUse = computed(
  () => !loading.value && !error.value && items.value.length === 0 && !hasActiveFilters.value,
)

// Faixa de convites pendentes (§6): só na aba "Todos" e quando há pendente ou expirado.
const pendingInvites = computed(() => tabCount('pending') + tabCount('expired'))
const showPendingBanner = computed(() => tab.value === 'todos' && pendingInvites.value > 0)

const rangeLabel = computed(() => {
  if (totalCount.value === 0) {
    return 'Nenhum resultado'
  }
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, totalCount.value)
  return `Exibindo ${start}–${end} de ${totalCount.value}`
})

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : ''
  return (first + last).toUpperCase() || '?'
}

// Vínculo: o nome da Corretora/Tomador; no Escopo Sistema (sem vínculo) mostramos a plataforma.
function linkLabel(item: UserListItem): string {
  if (item.link) {
    return item.link
  }
  return item.profileScope === profileScopes.system ? 'SmartInsure' : '—'
}

function scopeLabel(item: UserListItem): string {
  return item.profileScope ? getProfileScopeView(item.profileScope).label : '—'
}

function originLabel(item: UserListItem): string {
  return item.profileIsFixed ? 'Fixo' : 'Customizado'
}

const headers = [
  { title: 'Usuário', key: 'name', sortable: false, width: 250 },
  { title: 'Perfil de acesso', key: 'profileName', sortable: false, width: 190 },
  { title: 'Vínculo', key: 'link', sortable: false, width: 190 },
  { title: 'Situação', key: 'status', sortable: false, width: 130 },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const, width: 96 },
] as const

await refresh()
loadOptions()

async function refresh() {
  loading.value = true
  error.value = null

  try {
    const response = await listUsers({
      page: page.value,
      pageSize: pageSize.value,
      search: search.value || undefined,
      status: currentTab.value.filter ?? undefined,
      profileId: filters.value.profileId ?? undefined,
      scope: filters.value.scope ?? undefined,
      linkId: filters.value.linkId ?? undefined,
      registeredFrom: filters.value.registeredFrom ?? undefined,
      registeredTo: filters.value.registeredTo ?? undefined,
    })
    items.value = response.items ?? []
    totalCount.value = Number(response.totalCount ?? 0)
    counts.value = response.counts ?? { all: 0, active: 0, pending: 0, expired: 0, inactive: 0 }
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

function reload() {
  page.value = 1
  refresh()
}

watch(search, reload)
watch(tab, reload)

function goToPage(target: number) {
  page.value = target
  refresh()
}

function changePageSize(size: number) {
  pageSize.value = size
  page.value = 1
  refresh()
}

function applyFilters(next: UsersFilters) {
  filters.value = next
  reload()
}

function clearDrawerFilters() {
  filters.value = emptyFilters()
  reload()
}

function removeFilterChip(key: string) {
  const next = { ...filters.value }
  if (key === 'profile') {
    next.profileId = null
  }
  else if (key === 'scope') {
    next.scope = null
  }
  else if (key === 'link') {
    next.linkId = null
  }
  else if (key === 'registered') {
    next.registeredFrom = null
    next.registeredTo = null
  }
  filters.value = next
  reload()
}

async function loadOptions() {
  try {
    const [profilesResponse, brokeragesResponse] = await Promise.all([
      listProfiles({ page: 1, pageSize: 100 }),
      listBrokerages({ page: 1, pageSize: 100 }),
    ])
    profileOptions.value = (profilesResponse.items ?? [])
      .map(profile => ({ title: getProfileLabel(profile.name), value: profile.id }))
    linkOptions.value = (brokeragesResponse.items ?? [])
      .map(brokerage => ({ title: brokerage.name, value: brokerage.id }))
  }
  catch {
    // As opções do drawer são conveniência; falha ao carregar não quebra a listagem.
  }
}

function clearFilters() {
  tab.value = 'todos'
  filters.value = emptyFilters()
  if (search.value) {
    search.value = ''
  }
  else {
    reload()
  }
}

function openDetail(item: UserListItem) {
  navigateTo(`/usuarios/${item.id}`)
}

function onRowClick(_event: unknown, payload: { item: UserListItem }) {
  openDetail(payload.item)
}

// RN-065: reenvia o convite (mesmo e-mail). Sucesso reflete no toast; refaz a lista (situação/validade).
async function onResend(item: UserListItem) {
  actingId.value = item.id
  try {
    await resendInvitation(item.id)
    toast.value = `Novo link de primeiro acesso enviado para ${item.email}. O link anterior deixa de valer.`
    await refresh()
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível reenviar o convite.')
  }
  finally {
    actingId.value = null
  }
}

// RN-076: inativação com confirmação (ação destrutiva). Reativação é direta.
async function onInactivateConfirmed() {
  const item = confirmInactivate.value
  if (!item) {
    return
  }
  actingId.value = item.id
  try {
    await inactivateUser(item.id)
    toast.value = `${item.name} foi inativado.`
    confirmInactivate.value = null
    await refresh()
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível inativar o usuário.')
  }
  finally {
    actingId.value = null
  }
}

async function onReactivate(item: UserListItem) {
  actingId.value = item.id
  try {
    await reactivateUser(item.id)
    toast.value = `${item.name} foi reativado.`
    await refresh()
  }
  catch (requestError) {
    error.value = extractApiErrorMessage(requestError, 'Não foi possível reativar o usuário.')
  }
  finally {
    actingId.value = null
  }
}

// §9/RN-202: abre o modal de edição para o usuário da linha.
function openEdit(item: UserListItem) {
  editUserId.value = item.id
  editOpen.value = true
}

// O modal decide o efeito (nome/e-mail/perfil); aqui só refletimos o resultado e refazemos a lista.
async function onEdited(payload: { name: string, emailResent: boolean, email: string }) {
  toast.value = payload.emailResent
    ? `Dados atualizados. Convite reenviado para ${payload.email}.`
    : 'Dados atualizados.'
  await refresh()
}

async function onEditResent(payload: { email: string }) {
  toast.value = `Novo link de primeiro acesso enviado para ${payload.email}. O link anterior deixa de valer.`
  await refresh()
}

// Exportar (§3): CSV client-side dos usuários carregados na página atual (sem endpoint de export).
function exportCsv() {
  const rows = items.value
  const header = ['Nome', 'E-mail', 'Perfil', 'Vínculo', 'Situação']
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const body = rows.map(item => [
    item.name,
    item.email,
    item.profileName ? getProfileLabel(item.profileName) : '',
    linkLabel(item),
    getUserDisplayStatus(item.status, item.inviteExpired).label,
  ].map(cell => escape(String(cell))).join(','))
  const csv = [header.map(escape).join(','), ...body].join('\r\n')
  // BOM (U+FEFF) para o Excel reconhecer UTF-8; via fromCharCode para não deixar caractere
  // invisível no fonte (no-irregular-whitespace).
  const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'usuarios.csv'
  anchor.click()
  URL.revokeObjectURL(url)
  toast.value = `Exportando ${rows.length} usuário${rows.length === 1 ? '' : 's'} desta página em CSV.`
}

async function confirmScopedInvite(payload: {
  name: string
  email: string
  documentNumber: string
  profileId: string
  policyHolderId: string | null
  profileScope: string
}) {
  scopedInviting.value = true
  inviteError.value = null

  try {
    let invited: { email: string }
    if (payload.policyHolderId) {
      invited = await invitePolicyHolderAdministrator({
        name: payload.name,
        email: payload.email,
        documentNumber: payload.documentNumber,
        policyHolderId: payload.policyHolderId,
      })
    }
    else if (payload.profileScope === profileScopes.policyHolder) {
      invited = await invitePolicyHolderUser({
        name: payload.name,
        email: payload.email,
        documentNumber: payload.documentNumber,
        profileId: payload.profileId,
      })
    }
    else {
      invited = await inviteBrokerageUser({
        name: payload.name,
        email: payload.email,
        documentNumber: payload.documentNumber,
        profileId: payload.profileId,
      })
    }
    scopedInviteOpen.value = false
    toast.value = `Convite enviado para ${invited.email}. Ele aparece como Pendente até o primeiro acesso.`
    reload()
  }
  catch (requestError) {
    inviteError.value = extractApiErrorMessage(requestError, 'Não foi possível criar o usuário.')
  }
  finally {
    scopedInviting.value = false
  }
}

async function confirmInviteAdmin(payload: { name: string, email: string, brokerageIds: string[] }) {
  invitingAdmin.value = true
  inviteError.value = null

  try {
    const invited = await inviteBrokerageAdministrator(payload)
    inviteAdminOpen.value = false
    toast.value = `Convite enviado para ${invited.email}. Ele aparece como Pendente até o primeiro acesso.`
    reload()
  }
  catch (requestError) {
    inviteError.value = extractApiErrorMessage(requestError, 'Não foi possível enviar o convite.')
  }
  finally {
    invitingAdmin.value = false
  }
}
</script>

<template>
  <VContainer class="si-users">
    <!-- Cabeçalho (§3): eyebrow + título + ações (o CTA some no vazio-primeiro-uso). -->
    <div class="si-users__header">
      <div class="si-users__title">
        <span class="si-users__eyebrow">Acessos · Usuários</span>
        <h1 class="si-users__h1">
          Usuários
        </h1>
      </div>

      <div
        v-if="!isEmptyFirstUse"
        class="si-users__actions"
      >
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'download'"
          @click="exportCsv"
        >
          Exportar
        </SiButton>
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'building'"
          @click="inviteAdminOpen = true"
        >
          Convidar corretor administrador
        </SiButton>
        <SiButton
          :prepend-icon="'plus'"
          @click="scopedInviteOpen = true"
        >
          Novo usuário
        </SiButton>
      </div>
    </div>

    <!-- Card de filtros: abas de situação (com contagem) + busca (some no vazio-primeiro-uso). -->
    <SiCard
      v-if="!isEmptyFirstUse"
      variant="flat"
      class="si-users__filters"
    >
      <SiTabs
        v-model="tab"
        class="si-users__tabs"
      >
        <SiTab
          v-for="option in userStatusTabs"
          :key="option.key"
          :value="option.key"
          :text="option.label"
          :count="tabCount(option.countKey)"
        />
      </SiTabs>

      <div class="si-users__search-row">
        <div class="si-users__search">
          <SiTextField
            v-model="search"
            placeholder="Buscar por nome, e-mail ou perfil"
            :prepend-inner-icon="'search'"
            clearable
            hide-details
            class="si-field--search"
          />
        </div>
        <SiButton
          variant="outlined"
          color="secondary"
          :prepend-icon="'filter'"
          class="si-users__filters-btn"
          @click="drawerOpen = true"
        >
          Filtros avançados
          <SiChip
            v-if="activeFilterChips.length"
            size="x-small"
            color="success"
            class="ml-2"
          >
            {{ activeFilterChips.length }}
          </SiChip>
        </SiButton>
      </div>

      <div
        v-if="activeFilterChips.length"
        class="si-users__chips"
      >
        <SiChip
          v-for="chip in activeFilterChips"
          :key="chip.key"
          size="small"
          closable
          @click:close="removeFilterChip(chip.key)"
        >
          {{ chip.label }}
        </SiChip>
        <SiButton
          variant="text"
          size="small"
          @click="clearFilters"
        >
          Limpar filtros
        </SiButton>
      </div>
    </SiCard>

    <!-- Faixa de convites pendentes (§6). -->
    <div
      v-if="showPendingBanner"
      class="si-users__pending"
    >
      <SiIcon
        icon="clock"
        class="si-users__pending-icon"
      />
      <span class="si-users__pending-text">
        {{ pendingInvites }} convite{{ pendingInvites === 1 ? '' : 's' }}
        {{ pendingInvites === 1 ? 'ainda não foi aceito' : 'ainda não foram aceitos' }}. Quem não faz
        o primeiro acesso não aparece nos relatórios de atividade.
      </span>
      <SiButton
        variant="outlined"
        color="secondary"
        size="small"
        class="si-users__pending-btn"
        @click="tab = 'pendente'"
      >
        Ver pendentes
      </SiButton>
    </div>

    <!-- Card da tabela: estados (erro / vazios) OU tabela + rodapé. -->
    <SiCard
      variant="flat"
      class="si-users__table-card"
    >
      <SiAlert
        v-if="error"
        type="error"
        class="ma-4"
        :text="error"
      />

      <!-- Estado: erro (com retry) — só quando não há dados carregados. -->
      <div
        v-if="error && items.length === 0"
        class="si-users__state"
      >
        <div class="si-users__state-icon si-users__state-icon--danger">
          <SiIcon icon="alertTriangle" />
        </div>
        <h2 class="si-users__state-title">
          Não foi possível carregar os usuários
        </h2>
        <p class="si-users__state-text">
          A consulta expirou. Isso costuma ser instabilidade momentânea do serviço de identidade.
        </p>
        <SiButton
          :prepend-icon="'refresh'"
          @click="refresh"
        >
          Tentar novamente
        </SiButton>
      </div>

      <!-- Estado: vazio — primeiro uso (base vazia), com CTA. -->
      <div
        v-else-if="isEmptyFirstUse"
        class="si-users__state"
      >
        <div class="si-users__state-icon">
          <SiIcon icon="userRound" />
        </div>
        <h2 class="si-users__state-title">
          Você ainda não tem usuários
        </h2>
        <p class="si-users__state-text">
          Convide as pessoas que vão operar a plataforma com você. Cada uma recebe um e-mail com link
          de primeiro acesso e define a própria senha.
        </p>
        <SiButton
          :prepend-icon="'plus'"
          @click="scopedInviteOpen = true"
        >
          Novo usuário
        </SiButton>
      </div>

      <!-- Estado: vazio — filtro sem resultado. -->
      <div
        v-else-if="!loading && items.length === 0"
        class="si-users__state"
      >
        <div class="si-users__state-icon">
          <SiIcon icon="search" />
        </div>
        <h2 class="si-users__state-title">
          Nenhum usuário encontrado
        </h2>
        <p class="si-users__state-text">
          {{ search ? `Nada corresponde a «${search}». Revise o termo ou remova os filtros aplicados.` : 'Nenhum usuário atende aos filtros aplicados. Remova algum deles para ampliar o resultado.' }}
        </p>
        <SiButton
          variant="outlined"
          color="secondary"
          @click="clearFilters"
        >
          Limpar filtros
        </SiButton>
      </div>

      <!-- Dados (+ carregando inline). -->
      <template v-else>
        <!-- Desktop: tabela (escondida no mobile por CSS). -->
        <SiDataTable
          :headers="headers"
          :items="items"
          :loading="loading"
          :items-per-page="pageSize"
          hide-default-footer
          class="si-users__table si-users__table--clickable"
          @click:row="onRowClick"
        >
          <template #[`item.name`]="{ item }">
            <div class="si-users__identity">
              <SiAvatar
                :size="36"
                class="si-users__avatar"
              >
                {{ initials(item.name) }}
              </SiAvatar>
              <div class="si-users__stack">
                <span
                  class="si-cell-strong si-users__truncate"
                  :title="item.name"
                >{{ item.name }}</span>
                <span
                  class="si-users__muted si-users__truncate"
                  :title="item.email"
                >{{ item.email }}</span>
              </div>
            </div>
          </template>

          <template #[`item.profileName`]="{ item }">
            <div
              v-if="item.profileName"
              class="si-users__stack"
            >
              <span class="si-users__truncate">{{ getProfileLabel(item.profileName) }}</span>
              <span class="si-users__muted si-users__sub">{{ scopeLabel(item) }} · {{ originLabel(item) }}</span>
            </div>
            <span
              v-else
              class="si-users__muted"
            >—</span>
          </template>

          <template #[`item.link`]="{ item }">
            <span
              class="si-users__truncate si-users__muted"
              :title="linkLabel(item)"
            >{{ linkLabel(item) }}</span>
          </template>

          <template #[`item.status`]="{ item }">
            <SiChip
              :color="getUserDisplayStatus(item.status, item.inviteExpired).color"
              size="small"
              dot
            >
              {{ getUserDisplayStatus(item.status, item.inviteExpired).label }}
            </SiChip>
          </template>

          <template #[`item.actions`]="{ item }">
            <div
              class="si-users__row-actions"
              @click.stop
            >
              <SiTooltip text="Ver usuário">
                <template #activator="{ props }">
                  <SiIconButton
                    v-bind="props"
                    icon="eye"
                    tone="view"
                    aria-label="Ver usuário"
                    @click="openDetail(item)"
                  />
                </template>
              </SiTooltip>

              <SiMenu location="bottom end">
                <template #activator="{ props }">
                  <SiIconButton
                    v-bind="props"
                    icon="dotsHorizontal"
                    aria-label="Mais ações"
                  />
                </template>
                <SiList
                  density="compact"
                  class="si-rowmenu"
                >
                  <SiListItem
                    title="Editar usuário"
                    prepend-icon="pencil"
                    @click="openEdit(item)"
                  />
                  <SiListItem
                    v-if="item.status === 'Pending'"
                    title="Reenviar convite"
                    prepend-icon="mail"
                    @click="onResend(item)"
                  />
                  <SiListItem
                    v-if="item.status === 'Active' || item.status === 'Pending'"
                    title="Inativar usuário"
                    prepend-icon="userX"
                    class="si-rowmenu__danger"
                    @click="confirmInactivate = item"
                  />
                  <SiListItem
                    v-if="item.status === 'Inactive'"
                    title="Reativar usuário"
                    prepend-icon="userCheck"
                    @click="onReactivate(item)"
                  />
                </SiList>
              </SiMenu>
            </div>
          </template>
        </SiDataTable>

        <!-- Mobile: cards (escondidos no desktop por CSS). -->
        <div class="si-users__cards">
          <SiCard
            v-for="item in items"
            :key="item.id"
            variant="outlined"
            class="si-users__card si-users__card--clickable"
            @click="openDetail(item)"
          >
            <div class="si-users__card-top">
              <SiAvatar
                :size="44"
                class="si-users__avatar"
              >
                {{ initials(item.name) }}
              </SiAvatar>
              <div class="si-users__card-identity">
                <span class="si-cell-strong">{{ item.name }}</span>
                <span class="si-users__muted si-users__breakall">{{ item.email }}</span>
              </div>
              <SiChip
                :color="getUserDisplayStatus(item.status, item.inviteExpired).color"
                size="small"
                dot
              >
                {{ getUserDisplayStatus(item.status, item.inviteExpired).label }}
              </SiChip>
            </div>
            <div class="si-users__card-grid">
              <div>
                <span class="si-users__card-key">Perfil</span>
                <span>{{ item.profileName ? getProfileLabel(item.profileName) : '—' }}</span>
              </div>
              <div>
                <span class="si-users__card-key">Vínculo</span>
                <span>{{ linkLabel(item) }}</span>
              </div>
            </div>
            <div
              class="si-users__card-actions"
              @click.stop
            >
              <SiButton
                variant="text"
                size="small"
                :prepend-icon="'eye'"
                @click="openDetail(item)"
              >
                Ver usuário
              </SiButton>
              <SiButton
                variant="text"
                size="small"
                :prepend-icon="'pencil'"
                @click="openEdit(item)"
              >
                Editar
              </SiButton>
              <SiButton
                v-if="item.status === 'Pending'"
                variant="outlined"
                color="secondary"
                size="small"
                :loading="actingId === item.id"
                @click="onResend(item)"
              >
                Reenviar convite
              </SiButton>
              <SiButton
                v-else-if="item.status === 'Inactive'"
                variant="outlined"
                color="secondary"
                size="small"
                :loading="actingId === item.id"
                @click="onReactivate(item)"
              >
                Reativar
              </SiButton>
            </div>
          </SiCard>
        </div>

        <div class="si-users__footer">
          <span class="si-users__range">{{ rangeLabel }}</span>
          <SiPagination
            :page="page"
            :items-per-page="pageSize"
            :total="totalCount"
            @update:page="goToPage"
            @update:items-per-page="changePageSize"
          />
        </div>
      </template>
    </SiCard>

    <!-- Confirmação de inativação (§10): modal pequeno, ação destrutiva em vermelho. -->
    <SiDialog
      :model-value="confirmInactivate !== null"
      :max-width="440"
      @update:model-value="(open: boolean | undefined) => { if (!open) confirmInactivate = null }"
    >
      <SiCard variant="flat">
        <template #title>
          Inativar {{ confirmInactivate?.name }}?
        </template>
        <template #text>
          A pessoa perde o acesso imediatamente, mas o histórico dela na plataforma continua
          preservado. Você pode reativar quando quiser.
        </template>
        <template #actions>
          <VSpacer />
          <SiButton
            variant="text"
            color="secondary"
            @click="confirmInactivate = null"
          >
            Cancelar
          </SiButton>
          <SiButton
            color="error"
            :loading="actingId === confirmInactivate?.id"
            @click="onInactivateConfirmed"
          >
            Inativar usuário
          </SiButton>
        </template>
      </SiCard>
    </SiDialog>

    <UsersInviteBrokerageAdministratorDialog
      v-model="inviteAdminOpen"
      :submitting="invitingAdmin"
      @confirm="confirmInviteAdmin"
    />

    <UsersCreateScopedUserDialog
      v-model="scopedInviteOpen"
      :submitting="scopedInviting"
      @confirm="confirmScopedInvite"
    />

    <UsersEditDialog
      v-model="editOpen"
      :user-id="editUserId"
      @saved="onEdited"
      @resent="onEditResent"
    />

    <SiAlert
      v-if="inviteError"
      type="error"
      class="mt-4"
      :text="inviteError"
    />

    <SiSnackbar
      :model-value="Boolean(toast)"
      :timeout="3800"
      @update:model-value="(open: boolean | undefined) => { if (!open) toast = '' }"
    >
      {{ toast }}
    </SiSnackbar>

    <!-- ClientOnly: o drawer temporário não é renderizado no SSR (evita o flash meio-aberto). -->
    <ClientOnly>
      <UsersFiltersDrawer
        v-model="drawerOpen"
        :filters="filters"
        :profiles="profileOptions"
        :links="linkOptions"
        @apply="applyFilters"
        @clear="clearDrawerFilters"
      />
    </ClientOnly>
  </VContainer>
</template>

<style scoped>
.si-users {
  max-width: var(--si-container-wide);
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
}

.si-users__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--si-space-4);
  margin-top: var(--si-space-6);
}

.si-users__title {
  min-width: 0;
}

.si-users__eyebrow {
  display: block;
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--si-cinza);
  margin-bottom: var(--si-space-1);
}

.si-users__h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: var(--si-font-weight-semibold);
}

.si-users__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.si-users__tabs {
  padding: 0 var(--si-space-5);
}

.si-users__search-row {
  display: flex;
  align-items: flex-start;
  gap: var(--si-space-3);
  padding: var(--si-space-4) var(--si-space-5);
}

.si-users__search {
  flex: 1 1 auto;
  min-width: 280px;
}

.si-users__search :deep(.v-field) {
  min-height: 42px;
}

.si-users__filters-btn.v-btn {
  --v-btn-height: 42px;
}

.si-users__chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--si-space-2);
  padding: 0 var(--si-space-5) var(--si-space-4);
}

/* Faixa de convites pendentes (§6): âmbar claro, hairline, ícone e texto em tons de âmbar escuro. */
.si-users__pending {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  padding: 13px 18px;
  border-radius: var(--si-radius-lg);
  background: var(--si-warning-tint);
  border: 1px solid rgba(var(--v-theme-warning), 0.35);
}

.si-users__pending-icon {
  color: var(--si-warning-fg);
  flex-shrink: 0;
}

.si-users__pending-text {
  flex: 1;
  font-size: var(--si-fs-small);
  color: var(--si-warning-fg);
}

.si-users__pending-btn {
  flex-shrink: 0;
}

.si-users__table-card {
  overflow: hidden;
}

.si-users__table--clickable :deep(tbody tr) {
  cursor: pointer;
}

.si-users__card--clickable {
  cursor: pointer;
}

/* table-layout fixo + padding lateral 10px (bug documentado: o VDataTable recorta e não rola). */
.si-users__table :deep(table) {
  table-layout: fixed;
}

.si-users__table :deep(th),
.si-users__table :deep(td) {
  padding-inline: 10px !important;
  overflow: hidden;
}

.si-users__identity {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  min-width: 0;
}

.si-users__avatar {
  flex-shrink: 0;
}

.si-users__stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.si-users__truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.si-users__sub {
  font-size: var(--si-fs-caption);
}

.si-users__muted {
  color: var(--si-cinza);
}

.si-users__breakall {
  word-break: break-all;
}

.si-users__row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--si-space-1);
}

.si-rowmenu__danger :deep(.v-list-item-title),
.si-rowmenu__danger :deep(.v-list-item__prepend .v-icon) {
  color: var(--si-danger-strong);
}

.si-users__cards {
  display: none;
}

@media (max-width: 1023.98px) {
  .si-users__table {
    display: none;
  }

  .si-users__cards {
    display: flex;
    flex-direction: column;
    gap: var(--si-space-3);
    padding: var(--si-space-4);
  }

  .si-users__header,
  .si-users__actions,
  .si-users__search-row {
    flex-direction: column;
    align-items: stretch;
  }
}

.si-users__card {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  padding: var(--si-space-4);
}

.si-users__card-top {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-users__card-identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.si-users__card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--si-space-2);
  padding: var(--si-space-3) 0;
  border-block: 1px solid var(--si-divider);
}

.si-users__card-grid > div {
  display: flex;
  flex-direction: column;
}

.si-users__card-key {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  color: var(--si-cinza);
}

.si-users__card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
}

.si-users__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-3) var(--si-space-5);
  background: rgb(var(--v-theme-background));
  flex-wrap: wrap;
}

.si-users__range {
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}

.si-users__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--si-space-3);
  padding: 64px 24px;
}

.si-users__state-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: var(--si-radius-pill);
  background: var(--si-cinza-claro);
  color: var(--si-cinza);
}

.si-users__state-icon--danger {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}

.si-users__state-title {
  margin: 0;
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-users__state-text {
  margin: 0;
  max-width: 440px;
  color: var(--si-cinza);
  font-size: var(--si-fs-small);
}
</style>
