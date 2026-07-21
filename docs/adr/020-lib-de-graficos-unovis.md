# ADR-020: Biblioteca de gráficos — unovis

## Status
Aceito (ratificado pelo dono, 2026-07-21)

## Contexto

O dashboard real precisa de gráficos de verdade — linha, área, barra, donut, sparkline — com eixos,
tooltip/crosshair, responsividade e acessibilidade. Desenhar à mão em SVG (`polyline`/`path`) serviu
para o mock do painel (ADR-019, exec-plan 0009), mas não escala.

Escolher a lib é decisão de dependência (vai pro `package.json`), com restrições fortes do nosso stack:

- **SSR (Nuxt):** a página é renderizada no servidor; libs canvas são client-only.
- **Whitelabel por token (ADR-006):** a cor do gráfico tem que vir de design token (`--si-*` / tema
  Vuetify) e trocar por corretora — sem cor hardcoded.
- **Bundle** (marca "eficiente"), **Vue 3 nativo**, **licença** permissiva, **a11y**.

Opções consideradas:
1. **unovis (`@unovis/vue`)** — SVG, tematizável por CSS var, wrapper Vue 3, feito para dashboards, Apache-2.0.
2. **ECharts (`vue-echarts`)** — mais poderosa e provada; renderer SVG; MIT; porém mais pesada.
3. **Chart.js (`vue-chartjs`)** — leve; canvas (cor por JS, não CSS var); client-only; MIT.
4. **SVG à mão** — zero dep, mas não escala (sem eixos/tooltip/tipos).

## Decisão

- **Adotar `@unovis/vue`** como a lib de gráficos do produto. Motivo: é **SVG** e tematiza por **CSS
  custom property**, o que casa 1:1 com o whitelabel por token (ADR-006) — a cor do gráfico sai do
  mesmo tema Vuetify/`--si-*`, sem cor hardcoded.
- **Renderização client-side:** os componentes tocam o DOM, então o gráfico é montado dentro de
  `<ClientOnly>`, com um fallback de mesma altura (sem layout shift). O resto da página segue SSR.
- **Cor sempre por token:** as séries recebem `rgb(var(--v-theme-*))` / `var(--si-*)` — nunca hex
  (a trava do `check-harness`, ADR-019, cobre).
- **`build.transpile`** do `@unovis/vue` no `nuxt.config` (compat ESM/d3).

## Consequências

- Gráficos do produto usam unovis; primeiro uso é o `/painel` (troca o SVG à mão pela lib).
- Cor do gráfico é whitelabel por construção (token → tema).
- `@unovis/ts` traz dependências **opcionais** (three/maplibre, para mapas/3D) que **não** usamos em
  gráficos XY — ficam fora do bundle por tree-shaking; `@types/three` é só devDependency.
- Rejeitados: Chart.js (canvas não tematiza por CSS var; client-only), ECharts (mais pesada para o
  nosso uso), SVG à mão (não escala).
