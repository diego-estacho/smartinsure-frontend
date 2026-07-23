# Exec-plan 0007 — Mobile-first + componentização (referência: corretoras)

> Front-only, atividade interna de fundação (sem `AB#`). Branch sugerida: `feat/mobile-first-componentizacao`.
> Origem: feedback do dono (20/07) — três premissas: mobile-first, componentização e consistência de DS.

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **006** (tokens),
**010** (Vuetify), **013** (kit `Si`), **015** (css `si-*`), **017** (mobile-first, novo), **018**
(página fina, novo).

## Objetivo

Fixar como premissa e provar na prática: (1) **mobile-first** — telas boas em celular e desktop;
(2) **componentização** — página fina + componentes de domínio; (3) **consistência de DS** — só o kit
`Si`. O `corretoras/index.vue` (hoje um monólito: tabela + filtro + dialog + estado) é refatorado como
**exemplo de referência** dos três princípios.

## Escopo

**Dentro:**
- ADR-017 (mobile-first e responsividade) e ADR-018 (página fina + componentes de domínio) — ratificados (Aceito, 20/07).
- Reforço no `FRONTEND.md`: regras não-negociáveis de DS, mobile-first e componentização; tabela de ADRs atualizada (013–018).
- Refatoração do `corretoras/index.vue` em componentes de domínio em `components/brokerages/`:
  `Table` (responsivo: tabela no desktop, cards no mobile — ADR-017), `StatusFilter`, `StatusChangeDialog`.
  A página passa a só orquestrar estado + `useBrokerages`.

**Fora:**
- Mudança no filtro por situação (virá em PR próprio do dono).
- Página de criação `/corretoras/nova` e detalhes `/corretoras/:id` (não fazem parte desta refatoração).
- Aplicar o padrão às demais telas (feito incrementalmente conforme cada tela é tocada).

## Tarefas

- [x] ADR-017 e ADR-018 (`docs/adr/`), status Aceito (ratificados 20/07).
- [x] `FRONTEND.md`: regras + tabela de ADRs.
- [x] `components/brokerages/StatusFilter.vue` — `SiSelect` de situação; `v-model` (defineModel); emite mudança.
- [x] `components/brokerages/Table.vue` — desktop: `SiDataTable`; mobile: lista de `SiCard`; props `items`/`loading`; emite `change-status`; "Detalhes" navega por rota.
- [x] `components/brokerages/StatusChangeDialog.vue` — confirmação de habilitar/desabilitar; `v-model` de abertura + prop `brokerage`/`loading`; emite `confirm`.
- [x] `corretoras/index.vue` — orquestra: estado + `useBrokerages` + composição dos três componentes.

## Critérios de aceite

- [x] `pnpm lint` 0 · `pnpm typecheck` 0 · `python scripts/check-harness.py` → `harness ok`.
- [x] Nenhum valor visual hardcoded; só componentes `Si` (nenhum Vuetify tematizável direto na página/componentes).
- [x] Página é orquestradora fina (sem markup denso de tabela/dialog).
- [x] Evidência em **dois viewports**: desktop (tabela) e mobile ~390px (cards).

## Evidências

- **Gates:** `pnpm lint` 0 · `pnpm typecheck` 0 · `python scripts/check-harness.py` → `harness ok`.
- **Desktop:** `/corretoras` renderiza o shell + `SiDataTable` (colunas CNPJ/Razão social/Nome fantasia/Situação/Ações). Estado vazio "Não há dados disponíveis" (banco local sem corretoras).
- **Mobile (~390px):** o `BrokeragesTable` troca para a branch de cards (estado vazio "Nenhuma corretora encontrada."); header e toolbar empilham; filtro full-width; app bar do shell com hambúrguer. Confirma o fallback tabela→cards do ADR-017.
- **Arquivos:** `components/brokerages/{Table,StatusFilter,StatusChangeDialog}.vue` (novos); `pages/corretoras/index.vue` (agora orquestradora fina); `docs/adr/017`, `docs/adr/018` (novos); `docs/FRONTEND.md` (regras + tabela).
- **Pré-existente (fora do escopo):** no SSR o `useBrokerages` (via `$fetch`) não repassa o cookie de sessão ao BFF → `/api/v1/brokerages` responde 401 no servidor e há um hydration mismatch (alerta de erro do SSR × cliente). O cliente refaz a chamada com cookie e a tela fica consistente. A ser tratado no PR de dados/filtro de corretoras (usar `useFetch`/`useRequestFetch` ou fetch só-cliente).
