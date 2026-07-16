# Exec-plan 0004 — Componente `SiPagination`

> Front-only, atividade interna de fundação (sem `AB#`). Branch: `feat/skin-visual-componentes`
> (mesma do 0003 — continuação do trabalho de tabela). Referência de aparência: `IpPagination.vue`
> do InsurePoint.

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **013** (composição em `ui/`) e **015** (css `si-*`), o grill em `.grill/adequacao-visual-componentes.md`.

## Objetivo

Entregar `SiPagination`: a barra de paginação (resumo + itens-por-página + navegação numérica com reticências) que a tabela de produção do InsurePoint tem e a nossa não tinha (usava a paginação nativa do Vuetify). Recupera o layout validado, em tokens do DS, desacoplado da tabela.

## Escopo

**Dentro:** `SiPagination.vue` standalone (v-model `page`/`itemsPerPage` + prop `total`/`perPageOptions`); demo na vitrine `/dev/ui` (total 2.313, espelhando produção); testes de comportamento.

**Fora:** acoplar a paginação dentro do `SiDataTable` (o consumidor usa `hide-default-footer` + a barra embaixo — decisão de composição da tela); coluna de status como chip (tarefa futura do dono); paginação server-side real (é UI; o fetch fica na página).

## Tarefas

- [x] `SiPagination.vue` em `app/components/ui/` — resumo "Mostrando {N} de {total}", `VSelect` de itens-por-página, janela de páginas `[1, …, atual±1, …, total]` (mesma regra do InsurePoint), página ativa destacada. CSS escopado sob `.si-pagination` (ADR-015).
- [x] Demo na vitrine sob o `SiDataTable` (`hide-default-footer` + a barra).
- [x] Testes: resumo, janela com reticências (232 páginas), emissão de `update:page` no clique, marcação da ativa.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok` (classes `.si-pagination*` respeitam o namespace `si-`).
- [x] `pnpm build` ✨ · `pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm test` **62/62** (+4 do SiPagination).
- [x] CSS só com classes `si-*` (ADR-015); nenhum valor hardcoded fora de token.
- [x] Screenshot batendo com a tabela de produção.

## Evidências

- **API:** `<SiPagination v-model:page v-model:items-per-page :total :per-page-options>`. `perPageOptions` default `[5, 10, 20, 50]`. Página ativa: borda + fundo `rgba(primary, .12)` (tema, whitelabel-safe). Trocar itens-por-página reclampa a página ao novo total.
- **Gates:** lint 0 · typecheck 0 · test 62/62 · build ✨ · harness ok.
- **Screenshot:** `docs/exec-plans/evidence/0004-si-pagination.png` — "Mostrando 10 de 2313 resultados · [10 ▾] Itens por página · 1 2 … 232" com o 1 ativo (verde). Idêntico ao print de produção do dono.
- **Arquivos:** `app/components/ui/SiPagination.vue` (novo), `app/pages/dev/ui.vue` (demo), `tests/unit/components/behavior.nuxt.spec.ts` (+4 testes).

**Decisões:** paginação fica **standalone** (dono, 16/07 — sem acoplar no `SiDataTable`).

**Aberto (tarefa futura):** coluna de status como `SiChip` semântico — confirmada pelo dono como próximo trabalho, fora deste plano.
