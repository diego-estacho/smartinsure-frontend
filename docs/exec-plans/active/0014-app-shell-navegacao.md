# Exec-plan 0014 — App shell de navegação (recriação do protótipo `design_handoff_app_shell`)

> Front-only, atividade de fundação de UI (sem `AB#`).
> Branch/worktree: `app-shell-nav` (`C:\wt\app-shell-nav\smartinsure-frontend`).
> Origem: protótipo do Claude design `prototipos/menu/design_handoff_app_shell/` (README + `App shell.dc.html` + `colors_and_type.css`).
> Continua o **0005** (shell/menu lateral) e o **0012** (logo do topo expande no rail). Protótipo é **planta**: traduzir para o kit `Si` + tokens, nunca colar HTML (ADR-019/022).

Status: em andamento
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **006** (tokens whitelabel), **013** (kit `Si`), **015** (css `si-*`), **017** (mobile-first), **019** (DS fonte + de-para), **021** (ícones Lucide), **022** (DS-first); `docs/design-system-map.md`; camada de produto: `open-decisions.md` (**OPEN-03** — vínculo Usuário↔Corretora) e `glossario.md`. Predecessores: exec-plans **0005** e **0012**.

## Objetivo

Recriar o **app shell de navegação** do protótipo no stack do app (Nuxt + Vuetify + kit `Si` + tokens `--si-*` + Lucide), elevando o `layout/shell.vue` atual para a moldura completa do protótipo — **desktop primeiro, depois mobile** (pedido do dono). Fidelidade alta (hifi) sem materializar domínio nem inventar dado.

## Triagem (Passo 0)

Majoritariamente **front-only** (moldura visual). As partes com dado — seletor de corretora (workspace switcher) e identidade do usuário logado — são **cross-repo** (contrato no backend) e estão **bloqueadas por OPEN-03**. Por isso entram como **moldura visual com placeholder**, sem inventar corretoras/CNPJs/nome — o dado real pluga quando o contrato existir. Nenhuma RN no cliente.

## Escopo

**Dentro (front-only, tradução do protótipo):**
- **Breakpoint único 1024px** (protótipo) via `useIsMobile` (matchMedia `(max-width: 1023px)`, como o protótipo) + prop `:mobile` no drawer. Ver Nota de engenharia (o `useDisplay()`/config global do Vuetify não reconcilia a largura no SSR deste módulo).
- **Desktop — sidebar carvão** expandida (268px) ↔ colapsada/rail (72px) com transição de largura; **persistência da preferência** em `localStorage['si-shell-collapsed']` (composable `useShellPreferences`, SSR-safe); **tooltips** (`SiTooltip`) nos itens só no estado colapsado.
- **Item de nav ativo** = accent verde do DS: barra vertical 3×22 colada à esquerda + ícone verde + texto branco/600 + fundo tint `rgba(var(--v-theme-primary), .13)` (evolução leve do 0005 — segue accent-led, sem preenchimento pesado). Estado ativo **derivado da rota** (`useRoute`), não de estado local.
- **Marca:** símbolo (`public/brand/symbol.png`) + wordmark; só símbolo no rail. Preserva o **0012** (no rail, o símbolo é botão "Expandir menu").
- **Divisor de grupo "Operação"** (rótulo eyebrow expandido; traço curto centralizado no rail).
- **Rodapé:** botão "Recolher menu" (chevrons) + linha de conta **neutra** (avatar genérico + rótulo neutro + Sair via `useAuth.logout()`), mantendo a decisão do 0005 (identidade real = OPEN-03).
- **Workspace switcher (moldura visual):** botão (avatar + nome + "Trocar corretora" + chevron) que abre popover (`SiMenu`) com eyebrow "Suas corretoras", **estado vazio honesto** ("Nenhuma corretora vinculada") e ação "Adicionar corretora". Alimentado por `useWorkspaces()` **placeholder** (lista vazia / ativa nula) — bloqueado por **OPEN-03**; sem dado inventado.
- **Mobile:** sidebar vira drawer (`translateX`, 284px) + **scrim** (fecha ao tocar/Escape/selecionar) + **top-bar** (hambúrguer, marca, sino, avatar) + **bottom navigation** (5 primeiros destinos). Chrome do shell bespoke tokenizado sob `.si-shell-*` (precedente do 0013 — topbar/collapse/brand já são chrome; bottom nav segue a mesma receita, sem novo primitivo de kit).
- **Menu completo** (9 itens do protótipo). Navegam os que têm rota: Painel (`/`), Corretoras (`/corretoras`), Tomadores (`/tomadores`). Os sem rota (Cotações, Apólices, Usuários, Perfis de acesso, Relatórios, Configurações) ficam **desabilitados** (não navegam), sem rótulo textual — decisão do dono. Remover o item de teste **"Página B"** (`/demo/b`).
- **Ícones novos** no `lib/icons.ts` (deep-import Lucide) + de-para: `users`, `userRound`, `keyRound`, `settings`, `barChart`.

**Fora (e por quê):**
- Dado real do switcher / identidade / claims de corretora → **OPEN-03** (backend primeiro).
- Materializar páginas de domínio (Cotações, Apólices, Perfis, Relatórios, Configurações) — só o item de menu desabilitado; a página nasce quando a rota+glossário existirem.
- `expand-on-hover` do rail (muda o modelo de interação; 0012 já resolveu a descoberta).
- Dark mode / whitelabel dinâmico (ADR-013 §3/§4).

## Tarefas

- [x] **Gate:** worktree `app-shell-nav` + `pnpm install`; este exec-plan.
- [x] `lib/icons.ts` + `design-system-map.md`: +`users`, `userRound`, `keyRound`, `settings`, `barChart` (Lucide 1.0 renomeou `bar-chart-3` → `chart-column`).
- [x] `composables/useIsMobile.ts` (matchMedia 1024), `useShellPreferences.ts` (rail persistido) e `useWorkspaces.ts` (placeholder OPEN-03).
- [x] `app/layouts/shell.vue` — **desktop**: rail 72 / 268 (`:mobile` explícito no drawer), tooltips no rail, item ativo por rota (barra+ícone+tint), grupo "Operação", switcher (moldura), rodapé neutro; preservado 0012.
- [x] `app/layouts/shell.vue` — **mobile**: drawer 284 + scrim (Vuetify temporary) + topbar + bottom navigation.
- [x] Menu completo com itens desabilitados; "Página B" removida.
- [x] Skin `.si-shell-*` no `shell.vue` (escopado) + popover do switcher no `skin.css` (`.si-shell-ws-overlay`); tokens, sem hex cru.
- [x] Testes de comportamento (`shell.nuxt.spec.ts`): rail persiste, item ativo/desabilitado, switcher vazio (OPEN-03), grupo/conta neutra.
- [x] Gates + evidência (screenshots desktop expandido/colapsado/switcher + mobile/drawer).

## Critérios de aceite

- `python scripts/check-harness.py` → `harness ok` (sem hex fora de `tokens/`; identificadores inglês; css `.si-*`; exec-plan válido).
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` verdes.
- Desktop: expandir/colapsar persiste no reload; tooltip no rail; item ativo acompanha a rota (Painel/Corretoras/Tomadores).
- Itens sem rota não navegam (desabilitados); "Página B" removida.
- Switcher abre/fecha sem dado inventado (estado vazio honesto, OPEN-03 citado).
- Mobile (<1024): drawer + scrim + topbar + bottom nav; scrim/Escape/seleção fecham o drawer.
- Nenhum valor visual hardcoded fora de `styles/tokens/` (ADR-006).
- Evidência: screenshots desktop (expandido + colapsado) e mobile (drawer + bottom nav).

## Evidências

**Gates (worktree `app-shell-nav`):**
- `pnpm typecheck` → **exit 0**.
- `pnpm lint` → **exit 0** (0 erros/avisos).
- `python scripts/check-harness.py` → **`harness ok`** (sem hex fora de `tokens/`; css sob `.si-*`; exec-plan válido). Avisos de `../smartinsure-backend ausente` são do layout de worktree sob `C:\wt` (não há repo irmão ali), pré-existentes e não-bloqueantes.
- `pnpm test` → **102/102** (15 arquivos; +8 em `shell.nuxt.spec.ts`).
- `pnpm build` → **`✨ Build complete!`** (client + Nitro).

**Runtime + validação visual (dev :3000, dev-auth ADR-009):** capturado com Playwright (viewport 1280 desktop / 390 mobile), autenticando via `POST /api/auth/dev-login`:
- `0014-desktop-expandido.png` — sidebar 268px, marca, switcher (estado neutro), Painel ativo (barra+ícone verde+tint), itens sem rota desabilitados (esmaecidos, sem rótulo), grupo "Operação", rodapé (Recolher + conta neutra).
- `0014-desktop-colapsado.png` — rail 72px só com ícones; símbolo-botão "Expandir menu" no topo (0012); Painel ativo verde; rodapé em ícones.
- `0014-desktop-switcher.png` — popover "Suas corretoras" com **estado vazio honesto** ("Nenhuma corretora vinculada ainda.") + "Adicionar corretora" (OPEN-03, sem dado inventado).
- `0014-mobile.png` — top-bar (hambúrguer/marca/sino/avatar) + bottom navigation (Painel ativo).
- `0014-mobile-drawer.png` — drawer aberto (284px) sobre scrim + bottom nav.

**Nota de engenharia (breakpoint / mobile):** o `useDisplay().mobile` do Vuetify **não reconcilia a largura real** no SSR do `vuetify-nuxt-module` (a largura vem de client-hints e ficava presa < viewport), o que (a) renderizava o shell em modo mobile no desktop e (b) marcava o `VNavigationDrawer` como `--mobile`, que **ignora `rail`**. Resolvido sem depender do display global: `useIsMobile` (matchMedia `(max-width:1023px)`, como o protótipo) decide o layout, e o drawer recebe **`:mobile` explícito** (a prop vence o `display.mobile` global — default do VNavigationDrawer é `mobile: null` → cai no global). Verificado por medição (Playwright): colapsar leva o drawer de **268 → 72px**; desktop = sem `--mobile`.

**Outras notas:**
- **Ícones Lucide 1.0:** `bar-chart-3` foi renomeado; usado `chart-column` (`ChartColumn`) sob a chave estável `barChart`. Pego no `pnpm test` (o shim de tipos não valida existência de subpath; o Vite valida).
- **Scroll da nav:** `.v-navigation-drawer__content` vira coluna flex e a nav rola (`flex:1; overflow-y:auto`), mantendo o rodapé (#append) ancorado em telas baixas.
- **Popover teleportado:** estilizado no `skin.css` via `content-class="si-shell-ws-overlay"` (mesmo padrão do `.si-datepicker`, ADR-015).

**Arquivos principais tocados:**
- `app/layouts/shell.vue` (reescrito), `app/composables/useIsMobile.ts` + `useShellPreferences.ts` + `useWorkspaces.ts` (novos),
  `app/lib/icons.ts` (+5 ícones), `app/assets/styles/skin.css` (popover do switcher), `docs/design-system-map.md` (de-para de ícones),
  `tests/unit/components/shell.nuxt.spec.ts` (novo, +8), `docs/exec-plans/active/0014-app-shell-navegacao.md` (este).
- Nav sem o item de teste "Página B"; conta neutra e switcher com placeholder (OPEN-03) — nenhum dado de domínio inventado.

**Aberto (fora do escopo, registrado):** dado real do switcher (lista/ativa de corretoras) e identidade do usuário logado dependem de contrato — **OPEN-03**. O item de menu de domínio sem rota (Cotações, Apólices, Usuários, Perfis, Relatórios, Configurações) nasce navegável quando a rota + ratificação de glossário existirem.
