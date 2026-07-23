# Exec-plan 0010 — Adoção da lib de gráficos (unovis) no painel

> Front-only, decisão de dependência (sem `AB#`). Branch: `feat/grafico-unovis` (empilhada sobre
> `feat/painel-dashboard-mock` / PR #17). Origem: pedido do dono — usar uma lib de gráficos pronta
> em vez do SVG à mão, deixando-a disponível para o dashboard real.

Status: concluído
Contexto obrigatório: `AGENTS.md`, ADR-006 (tokens/whitelabel), ADR-008 (BFF/SSR), ADR-013 (kit),
ADR-019 (DS/de-para), **ADR-020** (a escolha da lib), exec-plan 0009 (o painel).

## Objetivo

Trocar o gráfico de tendência do painel (home `/`, hoje SVG desenhado à mão, exec-plan 0009) pela lib
**unovis** (ADR-020), deixando a lib integrada e tematizada por token — pronta para o dashboard real.
Sem mudar os dados (seguem mock, ADR-019/0009): o valor validado aqui é a **integração da lib**
(SSR-safe + whitelabel por token), não o número.

## Escopo

**Dentro:** `@unovis/vue` + `@unovis/ts` no `package.json`; `build.transpile` no `nuxt.config`;
`app/components/dashboard/TrendChart.vue` reescrito com `VisXYContainer`/`VisArea`/`VisLine`/`VisAxis`,
dentro de `<ClientOnly>` (fallback de mesma altura, sem layout shift), com cores por token
(`rgb(var(--v-theme-*))`) e grade/fonte via CSS vars do unovis (`--vis-*`). `useDashboardMock`: a série
do gráfico passa a guardar **valores** (maior = mais alto), em vez de coordenadas de SVG.

**Fora:** demais gráficos/tipos (donut, barras) — entram quando as telas existirem; dados reais
(seguem mock até o backend); eixos com rótulo/tooltip ricos (o painel real define).

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok` (sem hex; identificadores em inglês).
- [x] `pnpm lint` 0 · `pnpm typecheck` 0.
- [x] Gráfico renderiza no browser (client-side), com **cor por token** (verde de marca + série cinza)
  e responsivo; sem erro de SSR/hidratação no console.
- [x] Cor do gráfico é whitelabel por construção (token → tema), nenhuma cor hardcoded.

## Evidências

- **Gates:** `python scripts/check-harness.py` → `harness ok` · `pnpm lint` 0 · `pnpm typecheck` 0.
  Sem hex no `TrendChart.vue` (cores por `rgb(var(--v-theme-*))`). **0 erros** no console.
- **Desktop (1400×900):** `docs/exec-plans/evidence/0010-painel-unovis-desktop.png` — o gráfico agora
  é unovis (`VisXYContainer`/`VisArea`/`VisLine`/`VisAxis`): área verde translúcida + linha atual em
  verde de marca + série cinza + grade, tudo por token. Igual em composição ao SVG anterior, mas com a
  lib pronta para o dashboard real (eixos/tooltip/tipos).
- **Mobile (~390px):** `docs/exec-plans/evidence/0010-painel-unovis-mobile.png` — gráfico responsivo
  (preenche a largura), empilhado; sem scroll horizontal.
- **Integração:** montado em `<ClientOnly>` (fallback de mesma altura, sem layout shift); `build.transpile`
  do `@unovis/vue` no `nuxt.config`; tema do unovis por CSS var (`--vis-axis-grid-color`, `--vis-font-family`)
  herdadas do `.si-dash-chart`. Sem erro de SSR/hidratação.
- **Arquivos:** `package.json` (+`@unovis/vue`, `@unovis/ts`), `nuxt.config.ts` (transpile),
  `app/components/dashboard/TrendChart.vue` (reescrito), `app/composables/useDashboardMock.ts`
  (série vira valores), `docs/adr/020-lib-de-graficos-unovis.md`.

**Nota (bundle):** `@unovis/ts` traz deps opcionais (three/maplibre) para mapas/3D **não usados** em
XY — ficam fora do bundle por tree-shaking; `@types/three` é devDependency.
