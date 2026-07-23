<script setup lang="ts">
/**
 * Layout shell — moldura de navegação do app (recriação do protótipo
 * `prototipos/menu/design_handoff_app_shell`, exec-plan 0014; continua 0005/0012).
 *
 * Estrutura:
 * - **Desktop (≥1024px):** sidebar carvão fixa, expandida (268px) ou recolhida/rail (72px).
 *   A preferência recolhida persiste em `localStorage` (`useShellPreferences`). No rail, os
 *   itens ganham tooltip e o símbolo do topo vira o botão "Expandir menu" (0012).
 * - **Mobile (<1024px):** a sidebar vira drawer temporário (scrim do Vuetify), aparecem a
 *   top-bar e a bottom navigation. O ponto de virada (1024) é o do Design System, central no
 *   nuxt.config (`display.mobileBreakpoint`) — aqui só se lê `useDisplay().mobile` (ADR-017).
 *
 * Cor do drawer: token `charcoal` (superfície escura da marca — DS `--si-carvao`); whitelabel
 * troca o valor por tenant sem tocar este componente (ADR-006). CSS autoral escopado sob
 * `.si-shell-*` (ADR-015); o popover do switcher (teleportado pelo SiMenu) é estilizado no
 * skin.css sob `.si-shell-ws-overlay`.
 *
 * Dado de domínio fica com placeholder honesto (sem inventar): a identidade real do usuário e
 * a lista/ativa de corretoras do switcher dependem de contrato e estão em **OPEN-03**
 * (`../smartinsure-backend/docs/product-specs/open-decisions.md`). Itens de menu sem rota ainda
 * implementada ficam desabilitados; nascem quando a rota + glossário existirem.
 */
import type { AppIconName } from '~/lib/icons'

interface NavItem {
  key: string
  title: string
  icon: AppIconName
  /** Rota de destino. Ausente = ainda não implementada (item desabilitado). */
  to?: string
}

const route = useRoute()
const { logout } = useAuth()
// Ponto de virada único do shell = 1024px (breakpoint do Design System), via matchMedia
// (useIsMobile) — o useDisplay do Vuetify não reconcilia a largura no SSR deste módulo.
const { isMobile: mobile } = useIsMobile()
const { collapsed, loadCollapsed, toggleCollapsed } = useShellPreferences()
const { workspaces, activeWorkspace, hasWorkspaces, selectWorkspace } = useWorkspaces()

const drawerOpen = ref(true)
const wsMenuOpen = ref(false)

/** Rail só no desktop recolhido; no mobile a sidebar nunca colapsa (vira drawer). */
const rail = computed(() => !mobile.value && collapsed.value)

const primaryNav: NavItem[] = [
  { key: 'painel', title: 'Painel', icon: 'dashboard', to: '/' },
  { key: 'cotacoes', title: 'Cotações', icon: 'fileText' },
  { key: 'apolices', title: 'Apólices', icon: 'shieldCheck' },
  { key: 'tomadores', title: 'Tomadores', icon: 'users', to: '/tomadores' },
  { key: 'consultaCredito', title: 'Consulta de Crédito', icon: 'creditCard', to: '/consulta-credito' },
  { key: 'corretoras', title: 'Corretoras', icon: 'building', to: '/corretoras' },
]
const secondaryNav: NavItem[] = [
  { key: 'modalidades', title: 'Modalidades', icon: 'tag', to: '/modalidades' },
  { key: 'mapaModalidades', title: 'Mapa de Modalidades', icon: 'sitemap', to: '/mapa-de-modalidades' },
  { key: 'usuarios', title: 'Usuários', icon: 'userRound' },
  { key: 'perfis', title: 'Perfis de acesso', icon: 'keyRound' },
  { key: 'relatorios', title: 'Relatórios', icon: 'barChart' },
  { key: 'config', title: 'Configurações', icon: 'settings' },
]
const navSections: { key: string, label?: string, items: NavItem[] }[] = [
  { key: 'main', items: primaryNav },
  { key: 'ops', label: 'Operação', items: secondaryNav },
]
/** Bottom navigation (mobile): os 5 primeiros destinos do menu primário. */
const bottomNav = computed(() => primaryNav.slice(0, 5))

/** Ativo derivado da rota (não de estado local): raiz é match exato; demais por prefixo. */
function isActive(item: NavItem): boolean {
  if (!item.to) return false
  return item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
}

const drawerWidth = computed(() => (mobile.value ? 284 : 268))

watch(mobile, (isMobile) => {
  drawerOpen.value = !isMobile
}, { immediate: true })

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function closeDrawerOnMobile() {
  if (mobile.value) drawerOpen.value = false
}

function onSelectWorkspace(id: string) {
  selectWorkspace(id)
  wsMenuOpen.value = false
}

async function onLogout() {
  await logout()
  await navigateTo('/login')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') drawerOpen.value = false
}

onMounted(() => {
  loadCollapsed()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <VApp>
    <!-- Top-bar (mobile): hambúrguer + marca + sino + avatar do usuário. -->
    <SiAppBar
      v-if="mobile"
      color="charcoal"
      height="64"
      class="si-shell-topbar"
    >
      <button
        type="button"
        class="si-shell-topbar-button"
        :aria-label="drawerOpen ? 'Fechar menu' : 'Abrir menu'"
        @click="toggleDrawer"
      >
        <SiIcon icon="menu" />
      </button>

      <div class="si-shell-topbar-brand">
        <img
          src="/brand/symbol.png"
          alt="SmartInsure"
          class="si-shell-symbol"
          width="28"
          height="28"
        >
        <span class="si-shell-wordmark">
          <span class="si-shell-wordmark-smart">Smart</span><span class="si-shell-wordmark-insure">insure</span>
        </span>
      </div>

      <div class="si-shell-topbar-actions">
        <button
          type="button"
          class="si-shell-topbar-button"
          aria-label="Notificações"
        >
          <SiIcon
            icon="bell"
            :size="20"
          />
        </button>
        <SiAvatar
          color="primary"
          :size="32"
        >
          <SiIcon
            icon="user"
            :size="18"
          />
        </SiAvatar>
      </div>
    </SiAppBar>

    <SiNavigationDrawer
      v-model="drawerOpen"
      :permanent="!mobile"
      :temporary="mobile"
      :mobile="mobile"
      color="charcoal"
      :width="drawerWidth"
      :rail="rail"
      :rail-width="72"
      class="si-shell-drawer"
    >
      <!-- Marca. No rail, o símbolo é o botão "Expandir menu" (0012); senão, só a marca. -->
      <button
        v-if="rail"
        type="button"
        class="si-shell-brand si-shell-brand--rail si-shell-brand--toggle"
        aria-label="Expandir menu"
        title="Expandir menu"
        @click="toggleCollapsed"
      >
        <img
          src="/brand/symbol.png"
          alt="SmartInsure"
          class="si-shell-symbol"
          width="30"
          height="30"
        >
      </button>
      <div
        v-else
        class="si-shell-brand"
      >
        <img
          src="/brand/symbol.png"
          alt="SmartInsure"
          class="si-shell-symbol"
          width="30"
          height="30"
        >
        <span class="si-shell-wordmark">
          <span class="si-shell-wordmark-smart">Smart</span><span class="si-shell-wordmark-insure">insure</span>
        </span>
      </div>

      <!-- Seletor de corretora (workspace switcher) — moldura visual; dado real em OPEN-03. -->
      <div class="si-shell-ws">
        <SiMenu
          v-model="wsMenuOpen"
          :location="rail ? 'end' : 'bottom'"
          :close-on-content-click="false"
          content-class="si-shell-ws-overlay"
        >
          <template #activator="{ props }">
            <button
              type="button"
              class="si-shell-ws-btn"
              :class="{ 'si-shell-ws-btn--rail': rail }"
              v-bind="props"
            >
              <SiAvatar :size="36">
                <SiIcon
                  icon="building"
                  :size="18"
                />
              </SiAvatar>
              <span
                v-if="!rail"
                class="si-shell-ws-text"
              >
                <span class="si-shell-ws-name">{{ activeWorkspace?.name ?? 'Selecionar corretora' }}</span>
                <span class="si-shell-ws-sub">Trocar corretora</span>
              </span>
              <SiIcon
                v-if="!rail"
                icon="chevronDown"
                :size="18"
                class="si-shell-ws-chevron"
                :class="{ 'si-shell-ws-chevron--open': wsMenuOpen }"
              />
            </button>
          </template>

          <div class="si-shell-ws-pop">
            <p class="si-shell-ws-eyebrow">
              Suas corretoras
            </p>
            <p
              v-if="!hasWorkspaces"
              class="si-shell-ws-empty"
            >
              Nenhuma corretora vinculada ainda.
            </p>
            <button
              v-for="w in workspaces"
              :key="w.id"
              type="button"
              class="si-shell-ws-item"
              :class="{ 'si-shell-ws-item--active': w.id === activeWorkspace?.id }"
              @click="onSelectWorkspace(w.id)"
            >
              <SiAvatar :size="34" />
              <span class="si-shell-ws-item-text">
                <span class="si-shell-ws-item-name">{{ w.name }}</span>
                <span class="si-shell-ws-item-doc">{{ w.document }}</span>
              </span>
              <SiIcon
                v-if="w.id === activeWorkspace?.id"
                icon="check"
                :size="18"
                class="si-shell-ws-item-check"
              />
            </button>
            <div
              class="si-shell-ws-divider"
              aria-hidden="true"
            />
            <button
              type="button"
              class="si-shell-ws-add"
              @click="wsMenuOpen = false"
            >
              <SiIcon
                icon="plus"
                :size="18"
              />
              <span>Adicionar corretora</span>
            </button>
          </div>
        </SiMenu>
      </div>

      <!-- Navegação. Item ativo derivado da rota; itens sem rota ficam desabilitados. -->
      <SiList
        nav
        color="on-charcoal"
        class="si-shell-nav"
      >
        <template
          v-for="section in navSections"
          :key="section.key"
        >
          <div
            v-if="section.label"
            class="si-shell-group"
          >
            <span
              v-if="!rail"
              class="si-shell-group-label"
            >{{ section.label }}</span>
            <span
              v-else
              class="si-shell-group-line"
              aria-hidden="true"
            />
          </div>

          <SiTooltip
            v-for="item in section.items"
            :key="item.key"
            location="end"
            :text="item.title"
            :disabled="!rail"
          >
            <template #activator="{ props }">
              <SiListItem
                v-bind="props"
                :to="item.to"
                :active="isActive(item)"
                :disabled="!item.to"
                color="on-charcoal"
                :prepend-icon="item.icon"
                :title="item.title"
                class="si-shell-nav-item"
                @click="closeDrawerOnMobile"
              />
            </template>
          </SiTooltip>
        </template>
      </SiList>

      <template #append>
        <div class="si-shell-footer">
          <button
            v-if="!mobile"
            type="button"
            class="si-shell-action"
            :class="{ 'si-shell-action--rail': rail }"
            @click="toggleCollapsed"
          >
            <SiIcon
              :icon="rail ? 'chevronsRight' : 'chevronsLeft'"
              :size="18"
            />
            <span
              v-if="!rail"
              class="si-shell-collapse-label"
            >Recolher menu</span>
          </button>

          <SiDivider class="si-shell-divider" />

          <SiMenu location="top end">
            <template #activator="{ props }">
              <button
                type="button"
                class="si-shell-action si-shell-user"
                :class="{ 'si-shell-action--rail': rail }"
                v-bind="props"
              >
                <SiAvatar
                  color="primary"
                  :size="36"
                >
                  <SiIcon icon="user" />
                </SiAvatar>
                <span
                  v-if="!rail"
                  class="si-shell-user-info"
                >
                  <span class="si-shell-user-name">Minha conta</span>
                  <span class="si-shell-user-role">Sair da conta</span>
                </span>
                <SiIcon
                  v-if="!rail"
                  icon="chevronUp"
                  :size="18"
                  class="si-shell-user-chevron"
                />
              </button>
            </template>

            <SiList>
              <SiListItem
                prepend-icon="logOut"
                title="Sair"
                @click="onLogout"
              />
            </SiList>
          </SiMenu>
        </div>
      </template>
    </SiNavigationDrawer>

    <VMain>
      <div
        class="si-shell-content"
        :class="{ 'si-shell-content--bottomnav': mobile }"
      >
        <slot />
      </div>
    </VMain>

    <!-- Bottom navigation (mobile): 5 primeiros destinos; sem rota = desabilitado. -->
    <nav
      v-if="mobile"
      class="si-shell-bottomnav"
      aria-label="Navegação principal"
    >
      <template
        v-for="item in bottomNav"
        :key="item.key"
      >
        <NuxtLink
          v-if="item.to"
          :to="item.to"
          class="si-shell-bottomnav-item"
          :class="{ 'si-shell-bottomnav-item--active': isActive(item) }"
        >
          <SiIcon
            :icon="item.icon"
            :size="22"
          />
          <span>{{ item.title }}</span>
        </NuxtLink>
        <button
          v-else
          type="button"
          class="si-shell-bottomnav-item"
          disabled
        >
          <SiIcon
            :icon="item.icon"
            :size="22"
          />
          <span>{{ item.title }}</span>
        </button>
      </template>
    </nav>
  </VApp>
</template>

<style scoped>
/* ─── Top-bar (mobile) ─────────────────────────────────────────────────── */
.si-shell-topbar :deep(.v-toolbar__content) {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  padding-inline: var(--si-space-3);
}

.si-shell-topbar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--si-space-10);
  height: var(--si-space-10);
  border: 0;
  border-radius: var(--si-radius-md);
  background: transparent;
  color: rgb(var(--v-theme-on-charcoal));
  cursor: pointer;
}

.si-shell-topbar-button:hover {
  background: rgba(var(--v-theme-on-charcoal), 0.08);
}

.si-shell-topbar-brand {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-shell-topbar-actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  margin-inline-start: auto;
}

/* ─── Marca ────────────────────────────────────────────────────────────── */
.si-shell-brand {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-5) var(--si-space-5) var(--si-space-3);
  min-height: var(--si-space-16);
}

.si-shell-brand--rail {
  justify-content: center;
  padding-inline: 0;
}

/* Recolhido, o logo é um botão de expandir: neutraliza o estilo de botão e realça no hover. */
.si-shell-brand--toggle {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: var(--si-radius-md);
  transition: background-color var(--si-dur-fast) var(--si-ease-out);
}

.si-shell-brand--toggle:hover {
  background: rgba(var(--v-theme-on-charcoal), 0.08);
}

.si-shell-symbol {
  object-fit: contain;
}

.si-shell-wordmark {
  font-weight: var(--si-font-weight-bold);
  font-size: var(--si-fs-h4);
  letter-spacing: var(--si-ls-h2);
  white-space: nowrap;
}

.si-shell-wordmark-smart {
  color: rgb(var(--v-theme-primary));
}

.si-shell-wordmark-insure {
  color: rgb(var(--v-theme-on-charcoal));
}

/* ─── Workspace switcher (botão no drawer) ─────────────────────────────── */
.si-shell-ws {
  padding: 0 var(--si-space-3) var(--si-space-3);
}

.si-shell-ws-btn {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  width: 100%;
  min-height: var(--si-space-12);
  padding: var(--si-space-2) var(--si-space-3);
  border: 1px solid rgba(var(--v-theme-on-charcoal), 0.1);
  border-radius: var(--si-radius-lg);
  background: rgba(var(--v-theme-on-charcoal), 0.04);
  cursor: pointer;
  font: inherit;
  text-align: start;
  transition: background-color var(--si-dur-fast) var(--si-ease-out);
}

.si-shell-ws-btn:hover {
  background: rgba(var(--v-theme-on-charcoal), 0.08);
}

.si-shell-ws-btn--rail {
  justify-content: center;
  padding-inline: 0;
  border-color: transparent;
  background: transparent;
}

.si-shell-ws-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}

.si-shell-ws-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-on-charcoal));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si-shell-ws-sub {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-charcoal), 0.55);
  white-space: nowrap;
}

.si-shell-ws-chevron {
  margin-inline-start: auto;
  color: rgba(var(--v-theme-on-charcoal), 0.55);
  transition: transform var(--si-dur-fast) var(--si-ease-out);
}

.si-shell-ws-chevron--open {
  transform: rotate(180deg);
}

/* ─── Navegação ────────────────────────────────────────────────────────── */
/* Sidebar presa à altura do VIEWPORT (não à da página): sem isto, o drawer permanente cresce
 * com o conteúdo alto do <main> e empurra o rodapé pra baixo da dobra. Com altura de viewport,
 * a marca + switcher ficam no topo, a nav rola (`__content` já é overflow-y:auto) e o rodapé
 * (#append) fica ancorado embaixo — "Recolher menu"/conta sempre alcançáveis (como no protótipo). */
.si-shell-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}

.si-shell-nav {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-inline: var(--si-space-2);
}

/* Item sobre carvão: texto suave; hover/ativo com realce. O verde é ACCENT (barra + ícone)
 * sobre um leve tint de fundo no ativo — não um preenchimento pesado (evolução do 0005). */
.si-shell-nav :deep(.v-list-item) {
  color: rgba(var(--v-theme-on-charcoal), 0.7);
  border-radius: var(--si-radius-md);
  margin-block: var(--si-space-1);
  min-height: var(--si-space-10);
}

.si-shell-nav :deep(.v-list-item:hover) {
  color: rgb(var(--v-theme-on-charcoal));
}

.si-shell-nav :deep(.v-list-item--active) {
  color: rgb(var(--v-theme-on-charcoal));
  font-weight: var(--si-font-weight-semibold);
  background-color: rgba(var(--v-theme-primary), 0.13);
}

/* Usa nosso tint próprio no ativo — neutraliza o overlay do Vuetify. */
.si-shell-nav :deep(.v-list-item--active)::before {
  opacity: 0;
}

/* Barra vertical de acento colada à borda esquerda (DS: 3×22, cantos direitos arredondados). */
.si-shell-nav :deep(.si-shell-nav-item.v-list-item--active)::after {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  border-radius: 0 var(--si-radius-sm) var(--si-radius-sm) 0;
  background: rgb(var(--v-theme-primary));
}

.si-shell-nav :deep(.si-shell-nav-item.v-list-item--active .v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 1;
}

/* Divisor de grupo "Operação": rótulo expandido; traço curto centralizado no rail. */
.si-shell-group {
  display: flex;
  align-items: center;
  padding: var(--si-space-3) var(--si-space-3) var(--si-space-1);
}

.si-shell-group:has(.si-shell-group-line) {
  justify-content: center;
}

.si-shell-group-label {
  font-size: var(--si-fs-eyebrow);
  line-height: var(--si-lh-eyebrow);
  letter-spacing: var(--si-ls-eyebrow);
  text-transform: uppercase;
  font-weight: var(--si-font-weight-semibold);
  color: rgba(var(--v-theme-on-charcoal), 0.5);
}

.si-shell-group-line {
  width: var(--si-space-6);
  height: 1px;
  background: rgba(var(--v-theme-on-charcoal), 0.12);
}

/* ─── Rodapé (recolher + conta) ────────────────────────────────────────── */
.si-shell-footer {
  padding: var(--si-space-2);
}

.si-shell-action {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
  width: 100%;
  padding: var(--si-space-2) var(--si-space-3);
  border: 0;
  border-radius: var(--si-radius-md);
  background: transparent;
  color: rgba(var(--v-theme-on-charcoal), 0.7);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background-color var(--si-dur-fast) var(--si-ease-out);
}

.si-shell-action:hover {
  background: rgba(var(--v-theme-on-charcoal), 0.06);
  color: rgb(var(--v-theme-on-charcoal));
}

.si-shell-action--rail {
  justify-content: center;
  padding-inline: 0;
}

/* "Recolher menu" é utilitário — fonte menor que o corpo pra não competir com a navegação. */
.si-shell-collapse-label {
  font-size: var(--si-fs-small);
}

.si-shell-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}

/* Chevron da conta: sinaliza que o item abre um menu (mesma pista do switcher). */
.si-shell-user-chevron {
  margin-inline-start: auto;
  color: rgba(var(--v-theme-on-charcoal), 0.55);
}

.si-shell-user-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-on-charcoal));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.si-shell-user-role {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-charcoal), 0.55);
}

.si-shell-divider {
  margin-block: var(--si-space-2);
  border-color: rgba(var(--v-theme-on-charcoal), 0.12);
}

/* ─── Área de conteúdo ─────────────────────────────────────────────────── */
.si-shell-content--bottomnav {
  padding-bottom: calc(var(--si-space-16) + env(safe-area-inset-bottom));
}

/* ─── Bottom navigation (mobile) ───────────────────────────────────────── */
.si-shell-bottomnav {
  position: fixed;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: 1005;
  display: flex;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid var(--si-cinza-claro);
  box-shadow: var(--si-shadow-2);
  padding-bottom: env(safe-area-inset-bottom);
}

.si-shell-bottomnav-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-1);
  min-height: 60px;
  padding: var(--si-space-2) var(--si-space-1);
  border: 0;
  background: transparent;
  color: var(--si-cinza);
  font-size: var(--si-fs-caption);
  font-weight: var(--si-font-weight-medium);
  cursor: pointer;
  text-decoration: none;
}

.si-shell-bottomnav-item:disabled {
  opacity: 0.5;
  cursor: default;
}

.si-shell-bottomnav-item--active {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--si-font-weight-semibold);
}
</style>
