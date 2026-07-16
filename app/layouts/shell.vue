<script setup lang="ts">
/**
 * Layout shell — menu lateral persistente do app (drawer + área de conteúdo).
 *
 * Nomeado (não `default`): só páginas que declaram `layout: 'shell'` o recebem.
 *
 * Cor do drawer: token `charcoal` (superfície escura da marca — design system `--si-carvao`).
 * Whitelabel troca o valor por tenant, sem tocar este componente (ADR-006). Logo: símbolo
 * oficial (public/brand) + wordmark.
 *
 * Rodapé: "Recolher menu" (rail) + bloco de conta com menu (Sair). O bloco NÃO mostra
 * nome/perfil/corretora reais — isso exige contrato de "usuário logado" (backend, ADR-001) e
 * cai em OPEN-03 (perfil/corretora). Até lá, avatar genérico + rótulo neutro, sem dado falso.
 *
 * Itens de domínio (Cotações, Apólices, …) NÃO entram aqui até o termo ser ratificado no
 * glossário e a rota existir. Os dois itens abaixo são neutros — validam a navegação.
 *
 * `width`/`rail-width` são dimensões ESTRUTURAIS do layout (o Vuetify usa o número para o
 * offset do VMain), não valores visuais tokenizáveis (ADR-006 rege cor/fonte/espaço/raio/sombra).
 */
import {
  mdiViewDashboardOutline, mdiFileDocumentOutline, mdiAccount, mdiLogout,
  mdiChevronDoubleLeft, mdiChevronDoubleRight,
} from '~/lib/icons'

const { logout } = useAuth()

const drawerOpen = ref(true)
const rail = ref(false)

const nav = [
  { title: 'Página A', to: '/demo/a', icon: mdiViewDashboardOutline },
  { title: 'Página B', to: '/demo/b', icon: mdiFileDocumentOutline },
]

async function onLogout() {
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <VApp>
    <SiNavigationDrawer
      v-model="drawerOpen"
      permanent
      color="charcoal"
      :width="280"
      :rail="rail"
      :rail-width="76"
    >
      <div
        class="si-shell-brand"
        :class="{ 'si-shell-brand--rail': rail }"
      >
        <img
          src="/brand/symbol.png"
          alt="SmartInsure"
          class="si-shell-symbol"
          width="32"
          height="32"
        >
        <span
          v-if="!rail"
          class="si-shell-wordmark"
        >
          <span class="si-shell-wordmark-smart">Smart</span><span class="si-shell-wordmark-insure">insure</span>
        </span>
      </div>

      <SiList
        nav
        color="on-charcoal"
        class="si-shell-nav"
      >
        <SiListItem
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          color="on-charcoal"
          :prepend-icon="item.icon"
          :title="item.title"
        />
      </SiList>

      <template #append>
        <div class="si-shell-footer">
          <button
            type="button"
            class="si-shell-action"
            :class="{ 'si-shell-action--rail': rail }"
            @click="rail = !rail"
          >
            <SiIcon :icon="rail ? mdiChevronDoubleRight : mdiChevronDoubleLeft" />
            <span v-if="!rail">Recolher menu</span>
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
                  size="36"
                >
                  <SiIcon :icon="mdiAccount" />
                </SiAvatar>
                <span
                  v-if="!rail"
                  class="si-shell-user-info"
                >
                  <span class="si-shell-user-name">Minha conta</span>
                  <span class="si-shell-user-role">Sessão ativa</span>
                </span>
              </button>
            </template>

            <SiList>
              <SiListItem
                :prepend-icon="mdiLogout"
                title="Sair"
                @click="onLogout"
              />
            </SiList>
          </SiMenu>
        </div>
      </template>
    </SiNavigationDrawer>

    <VMain>
      <slot />
    </VMain>
  </VApp>
</template>

<style scoped>
.si-shell-brand {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  padding: var(--si-space-5) var(--si-space-4) var(--si-space-4);
}

.si-shell-brand--rail {
  justify-content: center;
  padding-inline: 0;
}

.si-shell-symbol {
  width: var(--si-space-8);
  height: var(--si-space-8);
  object-fit: contain;
}

.si-shell-wordmark {
  font-weight: var(--si-font-weight-bold);
  font-size: var(--si-fs-h4);
  letter-spacing: var(--si-ls-h2);
}

.si-shell-wordmark-smart {
  color: rgb(var(--v-theme-primary));
}

.si-shell-wordmark-insure {
  color: rgb(var(--v-theme-on-charcoal));
}

.si-shell-nav {
  padding-inline: var(--si-space-2);
}

/* Item sobre superfície escura: texto suave; o realce de fundo do hover/ativo vem do overlay
 * do Vuetify (color="on-charcoal"). O verde entra como ACCENT — barra lateral + ícone no ativo —
 * em vez de preencher o item (mais intuitivo e menos pesado). Tudo por token (ADR-006/015). */
.si-shell-nav :deep(.v-list-item) {
  color: rgba(var(--v-theme-on-charcoal), 0.72);
  border-radius: var(--si-radius-md);
  margin-block: var(--si-space-1);
  min-height: var(--si-space-12);
}

.si-shell-nav :deep(.v-list-item:hover),
.si-shell-nav :deep(.v-list-item--active) {
  color: rgb(var(--v-theme-on-charcoal));
}

.si-shell-nav :deep(.v-list-item--active) {
  box-shadow: inset var(--si-space-1) 0 0 rgb(var(--v-theme-primary));
  font-weight: var(--si-font-weight-semibold);
}

.si-shell-nav :deep(.v-list-item--active .v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 1;
}

/* Rodapé: recolher menu + bloco de conta */
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
  color: rgba(var(--v-theme-on-charcoal), 0.72);
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

.si-shell-user-info {
  display: flex;
  flex-direction: column;
}

.si-shell-user-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-on-charcoal));
}

.si-shell-user-role {
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-charcoal), 0.6);
}

.si-shell-divider {
  margin-block: var(--si-space-2);
  border-color: rgba(var(--v-theme-on-charcoal), 0.12);
}
</style>
