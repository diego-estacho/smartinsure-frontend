# Exec-plan 0001 — Scaffold do app Nuxt

> Trabalho front-only concluído. Infra de UI, sem código de domínio (OPEN-01 aberta).

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, os ADRs em `docs/adr/`, e a camada de produto em `../smartinsure-backend/docs/` (glossário, RNs, open-decisions).

## Objetivo

Levantar o esqueleto executável do app Nuxt 4 conforme os ADRs de UI, **sem código de domínio** — porque **OPEN-01** (glossário + máquina de estados) está aberta e bloqueia nomes de entidade, rotas, telas e status. Entrega: gates verdes sobre uma landing neutra e a estrutura de pastas do ADR-003 pronta para receber domínio quando OPEN-01 fechar.

## Escopo

**Dentro:** tooling (package.json/pnpm, tsconfig strict, nuxt.config), Nitro como BFF, Pinia, Vuetify 3 com tema por design tokens, openapi-typescript (config, sem contrato ainda), Vitest + Playwright, ESLint, esqueleto de pastas ADR-003 (genérico, sem domínio), landing neutra, `lib/icons.ts`, tokens base neutros, ratificação das propostas em ADRs 010–012.

**Fora (bloqueado por OPEN-01 ou próprio de outra tarefa):** rotas/telas/componentes de domínio, máquina de estados, geração real de types (falta o contrato OpenAPI), implementação de sessão/dev-auth (ADR-007/009 — esqueleto só).

## Tarefas

- [x] ADRs de UI 010 (Vuetify 3), 011 (openapi-typescript), 012 (i18n pt-BR fixo)
- [x] `.gitignore` abrangente (Nuxt + node + scratch de framework)
- [x] `package.json` (pnpm, Nuxt 4, deps) + `tsconfig` strict
- [x] `nuxt.config.ts` (Pinia, Vuetify, Nitro/BFF, TS strict)
- [x] Esqueleto de pastas ADR-003 (genérico) + `app.vue` + landing neutra
- [x] Design tokens base + tema Vuetify + `lib/icons.ts`
- [x] Vitest + Playwright + ESLint + testes smoke
- [x] `pnpm install` + verificação (build/typecheck/lint/test)

## Critérios de aceite

- `pnpm build`, `pnpm typecheck`, `pnpm lint` e `pnpm test` verdes.
- Nenhum termo de domínio não-ratificado em rota/pasta/componente (respeita OPEN-01).
- Nenhum valor visual hardcoded fora de `styles/tokens/` (ADR-006).
- Scratch de framework não versionado; scaffold adicionado só por caminhos explícitos.

## Evidências

Versões fixadas (última estável compatível): Nuxt 4.4.8, Vue 3.5.39, Vuetify 3.12, Pinia 4, TypeScript 5.9, Vitest 4.1, ESLint 10, vuetify-nuxt-module 1.0.0-rc.2. Nota: o pnpm resolveu Vuetify 4 / TS 7 / ESLint 9 como "latest", mas foram fixados para a matriz compatível com os módulos Nuxt e com o ADR-010 (Vuetify 3).

Gates (rodados em `feat/scaffold-nuxt`):

- `pnpm build` → `✨ Build complete!` (exit 0) — Nitro compilado, rota `/api/health` e a landing com Vuetify.
- `pnpm typecheck` → exit 0 (após remover import explícito de `pinia`; `defineStore` é auto-import do @pinia/nuxt).
- `pnpm test` → `Test Files 1 passed (1) · Tests 2 passed (2)` — teste dos design tokens (ADR-006).
- `pnpm lint` → exit 0.

Runtime (dev server em `:3000`):

- `GET /` → renderiza `SmartInsure`, "ambiente pronto" e a raiz Vuetify (`v-application`).
- `GET /api/health` → `{ "status": "ok" }` (BFF Nitro, ADR-008).

Higiene:

- `git status` mostra só scaffold + docs; `.agents/.grill/.claude/skills-lock.json/.specify/node_modules/.nuxt` todos ignorados (ADR-004 + build outputs).

Pendências deixadas (fora do escopo, documentadas): geração real de types depende do contrato OpenAPI do backend; sessão/dev-auth (ADR-007/009) têm só o esqueleto; threshold de cobertura de 80% é ligado quando houver código de domínio; E2E Playwright configurado, browser não baixado neste ambiente.
