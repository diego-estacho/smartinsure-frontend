# Exec-plan 0005 — Shell de navegação (menu lateral)

> Front-only, atividade interna de fundação (sem `AB#`). Branch sugerida: `feat/shell-menu-lateral`.
> Origem: grill `.grill/menu-lateral-navegacao.md` (16/07). Referência de aparência: print do dono
> (drawer com logo + itens + área de conteúdo).

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **006** (tokens
whitelabel), **013** (composição `ui/`), **015** (css `si-*`); camada de produto: `open-decisions.md`
(OPEN-01) e `glossario.md`.

## Objetivo

Entregar o **shell navegável** do app: um menu lateral persistente (logo + itens) que troca a área de
conteúdo ao clicar — provando que a navegação funciona ponta a ponta. Destrava desenvolvimento em
paralelo sem depender do fechamento do domínio.

## Escopo

**Dentro:** layout `shell` (drawer via `SiNavigationDrawer` cor `secondary` + logo wordmark +
`SiList`/`SiListItem`; `VMain` para o conteúdo); `NuxtLayout` ligado no `app.vue`; duas páginas de
demonstração em **rotas neutras** (`/demo/a`, `/demo/b`) para validar a navegação; ícones de menu
centralizados em `lib/icons.ts`.

**Fora (disciplina do glossário / OPEN-01):** qualquer página de domínio (Cotações, Apólices, Ofertas,
Tomador, Perfis, Planos, Fatura); header/topbar com dados reais de usuário/corretora; estados de status;
whitelabel dinâmico vindo do backend (hoje o tema é a skin padrão via token — a troca por tenant é o
mesmo mecanismo, sem novo build).

## Tarefas

- [x] `lib/icons.ts`: +`mdiViewDashboardOutline`, `mdiFileDocumentOutline` (ícone novo entra aqui, não no componente).
- [x] `app/layouts/shell.vue`: `VLayout` > `SiNavigationDrawer` (permanent, `color="secondary"`, logo) + `SiList` de 2 itens + `VMain`. CSS autoral escopado sob `.si-shell-*` (ADR-015); cor por token (ADR-006).
- [x] `app/app.vue`: envolver `NuxtPage` em `NuxtLayout` (layout `shell` é nomeado — não afeta login/index/usuarios).
- [x] `app/pages/demo/a.vue` e `b.vue`: `definePageMeta({ layout: 'shell' })`, conteúdo distinto, rotas neutras.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok`.
- [x] `pnpm lint` 0 · `pnpm typecheck` 0.
- [x] Nenhum valor visual hardcoded (cor do drawer via `secondary`, medidas por `var(--si-…)`).
- [x] Nenhum termo de domínio em rota/label (só `demo/a`, `demo/b`, "Página A/B").
- [x] Evidência: navegação clicando A↔B troca rota e conteúdo (screenshot).

## Evidências

- **Gates:** `pnpm lint` 0 · `pnpm typecheck` 0 · `python scripts/check-harness.py` → `harness ok`.
- **Navegação (dev-auth ADR-009):** com sessão sintética, `/demo/a` renderiza o shell; clicar em
  "Página B" no menu navega para `/demo/b`, trocando URL, título, conteúdo e o item ativo. Drawer
  em `secondary`, offset do `VMain` = 280px, `transform: translateX(0)`.
  - `docs/exec-plans/evidence/0005-shell-demo-a.png` — Página A, item A ativo (verde).
  - `docs/exec-plans/evidence/0005-shell-demo-b.png` — Página B, item B ativo, conteúdo distinto.
- **Sem regressão:** `/login` e `/` seguem com `VApp` (via layout `default`), sem drawer, com o
  próprio conteúdo — o `VApp` migrou de `app.vue` para os layouts.
- **Arquivos:** `app/layouts/shell.vue` (novo), `app/layouts/default.vue` (novo), `app/app.vue`
  (NuxtLayout), `app/pages/demo/a.vue` + `b.vue` (novos), `app/lib/icons.ts` (+2 ícones).

**Bug encontrado na validação (por que E2E importa):** lint e typecheck passavam, mas o drawer
renderizava fora da tela (`translateX(-280px)`, sem offset do `VMain`). Duas causas: (1) `VLayout`
aninhado dentro do `VApp` do `app.vue` não computava altura → `VApp` virou o root do layout, e o
`VApp` saiu do `app.vue` para os layouts; (2) o `SiNavigationDrawer` liga sempre um `v-model` — sem
estado inicial explícito ele nasce fechado, mesmo com `permanent`. Corrigido com `v-model` = `ref(true)`.

**Decisões (do grill 16/07):** rotas de destino **neutras** (`/demo/a`, `/demo/b`) — não materializam
domínio; layout **nomeado** `shell` para não tocar páginas existentes.

**Ajuste de skin (16/07, feedback do dono):** o drawer usa o token **`carvao`** (`#0F172A`, superfície
escura da marca — design system `--si-carvao`), não `secondary`. Logo = **símbolo oficial** transparente
(`public/brand/symbol.png`, do design system) + wordmark "Smart"/"insure" por token. Item ativo repensado:
o verde entra como **accent** (barra lateral + ícone), com realce de fundo neutro (overlay `on-carvao`) —
em vez de preenchimento verde. Whitelabel troca os valores dos tokens, sem tocar o componente (ADR-006).
Arquivos: `tokens.ts` (+`carvao`/`on-carvao`/`carvao-lighten-1`), `public/brand/symbol.png` (novo).

**Rodapé do menu (16/07, feedback do dono):** "Recolher menu" (rail do `VNavigationDrawer`) + bloco de
conta com **menu dropdown** (Sair via `useAuth.logout()` → `/login`). Decisão de UX: menu em vez de botão
de logout direto (evita clique acidental, agrupa ações futuras). **Identidade não é hardcoded** — avatar
genérico + rótulo neutro ("Minha conta / Sessão ativa"); nome/perfil/corretora reais exigem contrato de
"usuário logado" (backend, ADR-001) e caem em OPEN-03. Validado: recolher, menu e Sair (→ `/login`) no
browser. Evidências: `0005-shell-demo-a.png` (rodapé), `0005-shell-rail.png` (recolhido).

**Relacionado:** OPEN-01 será fechada na modalidade "glossário emergente-mas-registrado" (decisão de
produto, backend) — não bloqueia este shell, que é front-only e sem domínio.
