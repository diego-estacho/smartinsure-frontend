# Exec-plan 0009 — Painel (dashboard) do design system, com dados mock

> Front-only, atividade de UI (sem `AB#`). Branch: `feat/painel-dashboard-mock`.
> Origem: pedido do dono — implementar o protótipo do dashboard do design system para **validar**
> que o app reproduz o protótipo. Referência: `../design system/ui_kits/web/index.html` (card
> "UI kit · partner dashboard"). Primeiro uso do de-para do design system (ADR-019 — vem no PR #16).

Status: em andamento
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, o de-para do design
system (`docs/design-system-map`, ADR-019), ADRs **006** (tokens), **013** (kit `Si`), **015**
(css `si-*`), **017** (mobile-first), **018** (página fina), **019** (DS/de-para).

## Objetivo

Provar a **fidelidade ao design system**: reproduzir o conteúdo do painel do protótipo (KPIs, gráfico
de tendência, atividade recente, cabeçalho e filtros) no stack do app — kit `Si` + tokens + `@mdi/js`
— traduzido pelo de-para. **Dados são mock**: não há contrato/backend para estes números ainda; o mock
sai quando o backend existir (troca-se `useDashboardMock` por consumo do BFF, ADR-008).

## Escopo

**Dentro:** o painel **é a home** — vive em `/` (`app/pages/index.vue`, layout `shell`) e
**substitui a antiga home de atalhos**; o login redireciona pra cá. Orquestradora fina que compõe
componentes de domínio em `app/components/dashboard/`:
- `Kpis.vue` (`<DashboardKpis>`) — 4 cards de métrica, incl. o card de destaque em carvão.
- `TrendChart.vue` (`<DashboardTrendChart>`) — área + linha (SVG) 100% por token, sem hex.
- `Activity.vue` (`<DashboardActivity>`) — atividade recente com ícone de tom semântico.
- `Filters.vue` (`<DashboardFilters>`) — chips de período (pill), ativo em carvão.
- `useDashboardMock.ts` — dados mock tipados. `lib/icons.ts` — ícones do de-para (Lucide→mdi).
- Item "Painel" no nav do `shell` aponta pra `/`. Toolbar (busca + "Nova apólice") e banner de
  aviso — a busca e o botão são **ilustrativos** (mock), com aviso explícito na tela.

**Fora (e por quê):**
- **Workspace switcher** ("trocar corretora") — é chrome do menu (shell) **e** feature de produto
  multi-corretora que exige o backend saber a quais corretoras o usuário pertence → **cross-repo**
  (contrato primeiro). Fica para um épico próprio.
- Dados reais / APIs / navegação das ações (sem promessa de tela: "Nova apólice", "Ver tudo",
  notificações e ajuda não navegam).
- Termos de domínio (Apólice/Sinistro/Segurado) aparecem como **rótulos ilustrativos** do mock; a
  ratificação no glossário e as rotas de domínio seguem OPEN-01, fora daqui.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok` (identificadores em inglês; sem hex cru — ADR-019).
- [x] `pnpm lint` 0 · `pnpm typecheck` 0.
- [x] Nenhuma cor/fonte/medida visual hardcoded — só token (inclui o SVG do gráfico, por token).
- [x] Fidelidade ao protótipo em **desktop** e responsivo em **mobile** (KPIs e grid empilham).
- [x] Fica evidente que é mock (banner de aviso); nenhuma ação promete tela inexistente.

## Evidências

- **Gates:** `python scripts/check-harness.py` → `harness ok` · `pnpm lint` 0 · `pnpm typecheck` 0.
  Sem hex cru nos arquivos novos (o SVG do gráfico é estilizado por token). **0 erros** no console.
- **Protótipo (referência):** `docs/exec-plans/evidence/0009-proto-referencia.png` (o alvo do DS).
- **Desktop (1400×900):** `docs/exec-plans/evidence/0009-painel-desktop.png` — reproduz o conteúdo do
  protótipo no kit `Si`: toolbar (busca + "Nova apólice"), banner de mock, cabeçalho com filtros pill
  (ativo em carvão), 4 KPIs (o de destaque em carvão com valor verde), gráfico área+linha em verde de
  marca + série cinza, e atividade recente com ícones de tom semântico. Renderiza dentro do `shell`
  existente (reuso do menu; item "Painel" adicionado ao nav).
- **Mobile (~390px, ADR-017):** `docs/exec-plans/evidence/0009-painel-mobile.png` — toolbar empilha,
  KPIs viram 1 coluna, gráfico e atividade empilham; sem scroll horizontal.
- **Arquivos:** `app/pages/index.vue` (o painel é a home; substitui a home de atalhos);
  `app/components/dashboard/{Kpis,TrendChart,Activity,Filters}.vue`;
  `app/composables/useDashboardMock.ts`; `app/lib/icons.ts` (+ícones do de-para); `app/layouts/shell.vue`
  (item "Painel").

**Fora (registrado):** workspace switcher (chrome do shell + multi-corretora = cross-repo, contrato
primeiro); dados/APIs reais; navegação das ações. O mock (`useDashboardMock`) sai quando o backend
existir — troca por consumo do BFF (ADR-008).
