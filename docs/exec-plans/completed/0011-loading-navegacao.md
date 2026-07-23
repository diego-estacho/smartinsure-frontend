# Exec-plan 0011 — Feedback de carregamento na navegação entre páginas

> Front-only, atividade de UI (sem `AB#`). Branch: `feat/loading-navegacao`.
> Origem: pedido do dono — "as páginas demoram um pouco para carregar e não temos um LOADING;
> ao navegar (ex.: Corretoras) quero um feedback visual de que está carregando".

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **006** (tokens),
**018** (página fina).

## Objetivo

Dar **feedback visual imediato** durante a transição de rota, sem mudar a estratégia de dados.

## Diagnóstico (causa da falta de feedback)

Páginas orquestradoras buscam dados com **`await` no topo do `<script setup>`** (ex.:
`app/pages/corretoras/index.vue`, `await refresh()`). Isso **suspende a navegação** (Suspense do
`<NuxtPage>`): ao clicar num item do menu, a tela anterior fica congelada por ~0,5–1,3s até o dado
resolver — e não havia nenhum indicador. A percepção é de "travou".

## Escopo

**Dentro:** adicionar o `<NuxtLoadingIndicator>` (nativo do Nuxt) no `app/app.vue`. Ele mostra uma
barra de progresso fixa no topo durante **toda** a transição de rota (inclui o tempo do Suspense da
página que dá `await`). Cor pela marca via token (`rgb(var(--v-theme-primary))`, ADR-006 — sem hex).
`throttle` padrão (200ms) evita piscar em navegações instantâneas.

**Fora (e por quê):**
- **Reescrever a estratégia de dados** (converter `await` de topo em fetch lazy + skeleton por
  página) — melhora maior, mas é refatoração por página e muda comportamento; fica como follow-up.
  O indicador global cobre o pedido ("feedback de que está carregando") com o menor incremento.
- Loading in-page de ações (filtro/atualizar) — **já existe** (`BrokeragesTable :loading`); não muda.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok` (sem hex cru; identificadores em inglês).
- [x] `pnpm lint` 0 · `pnpm typecheck` 0.
- [x] Cor da barra vem do token da marca (sem valor visual hardcoded).
- [x] Ao navegar para uma rota que busca dados (ex.: `/corretoras`), a barra aparece no topo durante
      a espera e some ao renderizar.

## Evidências

- **Gates:** `python scripts/check-harness.py` → `harness ok` · `pnpm lint` 0 · `pnpm typecheck` 0.
- **Navegação com barra (medido via DOM na transição `/` → `/corretoras`):** a `.nuxt-loading-indicator`
  ficou visível (`sawVisible: true`) e cresceu progressivamente — largura `0 → 15 → 41 → 92 → 138 →
  1425px`, opacidade `0 → 1` — e sumiu ao renderizar. **Cor** resolvida `rgb(34, 197, 94)` (verde da
  marca, `--v-theme-primary`), **altura** `3px`. Confirma feedback on-brand durante o Suspense da página.
- **Arquivos:** `app/app.vue` (+`<NuxtLoadingIndicator color="rgb(var(--v-theme-primary))">`).
