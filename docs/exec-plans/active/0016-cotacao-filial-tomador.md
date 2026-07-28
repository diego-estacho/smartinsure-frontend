# Exec-plan 0016 — Cotação de filial do tomador (front)

Status: ativo — AB#0005 (`ab-0005-cotacao-filial-tomador`). Front entregue e verificado (evidências abaixo), com **uma pendência declarada: o spec de E2E da jornada**. Depende do contrato publicado pelo backend — já publicado. Move para `completed/` no mesmo PR que encerrar o front.
Contexto obrigatório: RN-052 em `../smartinsure-backend/docs/product-specs/regras-de-negocio/tomadores.md`; RN-053 e RN-050/RN-051 em `../smartinsure-backend/docs/product-specs/regras-de-negocio/grupo-de-cotacao.md`; `../smartinsure-backend/docs/adr/063-filial-como-pessoa-vinculada-a-matriz.md`; `docs/FRONTEND.md`; exec-plan base da jornada: `0015-nova-oferta-quotation-group.md`. Exec-plan irmão no backend: `../smartinsure-backend/docs/exec-plans/active/0013-cotacao-filial-tomador.md`.

## Objetivo

Substituir o botão "Adicionar filial" cosmético do wizard (`Step1PolicyHolder.vue:87-92`, que hoje descarta o
CNPJ digitado) pela lista real de Filiais com marcação exclusiva, refletir o estabelecimento escolhido no
resumo da jornada e enviá-lo ao backend; e listar Filiais na ficha do Tomador (RN-052, RN-053).

## Tarefas

- [x] `pnpm types:gen` após o contrato do backend ser publicado — nenhum type de API escrito à mão.
- [x] BFF proxies (ADR-008 — o browser nunca fala com o backend direto): `GET`/`POST` de `policy-holders/{id}/branches` em `server/api/`.
- [x] Composable `usePolicyHolderBranches` — listar e cadastrar Filial por CNPJ, no padrão de `usePersons`.
- [x] `stores/quotationGroupWizard.ts`: `SelectedPolicyHolder` ganha as Filiais e a Filial marcada; `setBranch`/`clearBranch`; a Filial entra no payload e na **assinatura de recálculo** (RN-051); trocar o Tomador limpa a Filial (RN-053).
- [x] `Step1PolicyHolder.vue`: remover `addBranch()` e o aviso falso "Filial adicionada ao tomador"; lista de Filiais com checkbox **exclusivo** (marcar outra desmarca a anterior; desmarcar volta à matriz); consumir `preSelectedBranchId` da busca para nascer marcada; modal "Adicionar filial" passando a chamar o endpoint real e a exibir o aviso do backend quando o CNPJ não for localizado.
- [x] `SummarySidebar.vue`: exibir o CNPJ do estabelecimento — da Filial marcada, ou o da matriz quando nenhuma estiver marcada.
- [x] `composables/useQuotationGroups.ts`: enviar `branchId` no POST e no PUT; ao retomar um Rascunho com Filial, ela volta marcada.
- [x] Ficha de detalhe do Tomador: seção Filiais (lista + cadastrar por CNPJ), consumindo `branches[]` do detalhe (RN-025).
- [x] Testes vitest na store, no composable, no wizard e na ficha do Tomador.
- [ ] **Não entregue** — E2E Playwright marcando e desmarcando a Filial e conferindo o CNPJ no resumo. A suíte E2E atual não tem spec de Grupo de Cotação, e `tests/e2e/tomadores.spec.ts` não foi estendido para a aba Filiais. A jornada está coberta por teste de componente (montagem real do wizard e da ficha, com marcação/desmarcação e conferência do CNPJ no resumo), não por navegador. Ver Evidências.

## Critérios de aceite

- Nenhuma regra de negócio no cliente: o vínculo Filial×matriz é validado pelo servidor; o front só valida forma.
- Marcar uma Filial troca o CNPJ do resumo para o dela; desmarcar volta para o da matriz (RN-053).
- Digitar o CNPJ de uma Filial na busca do Tomador deixa aquela Filial marcada; nos demais casos a lista abre desmarcada.
- Retomar um Rascunho que já registrou Filial traz a Filial marcada.
- Nenhum type de API à mão; só design tokens.
- Gates verdes: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; cobertura ≥ 80%.

## Evidências

Verificado em 2026-07-28, na worktree `C:\wt\ab-0005\smartinsure-frontend`, após o último commit da branch.

- **Lint**: `pnpm lint` → limpo.
- **Typecheck**: `pnpm typecheck` → limpo.
- **Testes**: `pnpm test` → `Test Files 31 passed (31)`, `Tests 226 passed (226)`. Baseline da branch era 202. Saída sem ruído em stderr.
- **Harness**: `python scripts/check-harness.py` → `harness ok`.
- **E2E**: `pnpm test:e2e` → **29 passaram, 3 falharam**. As três falhas são `tests/e2e/smoke.spec.ts` (a landing não exibe o heading "SmartInsure") e os dois casos de `tests/e2e/login.spec.ts`. **Não são atribuíveis a esta atividade**: a branch não altera nenhum arquivo de landing, login, middleware de autenticação ou spec de E2E (`git diff --name-only bc8c135..HEAD` confirma), e as três falham de forma idêntica e determinística em duas execuções. Tentei um baseline em `main` no clone do workspace para provar que são pré-existentes, mas o `webServer` do Playwright não subiu lá dentro do timeout — **então a atribuição está fundamentada no diff, não em uma execução comparativa**. Precisa ser confirmado antes do merge.
- **Cobertura**: não medida localmente — o gate de 80% roda no CI.
- **Jornada**: coberta por teste de componente com montagem real, não por navegador: marcar uma Filial e ver o resumo trocar para o CNPJ dela, desmarcar e ver voltar ao da matriz, nascer marcada via `preSelectedBranchId`, trocar o Tomador e a Filial ser limpa, e os três desfechos do cadastro (registrada / CNPJ não localizado no Birô / erro). Falta a gravação da jornada no navegador — pendente junto do spec de E2E acima.
- **Contrato**: types regenerados de `../smartinsure-backend/docs/generated/openapi.json`; nenhum type de API escrito à mão. `pnpm types:gen` foi corrigido nesta branch para rodar também no Windows — a forma `${VAR:-default}` era POSIX e falhava no `cmd.exe`, o que já estava obrigando a invocar o `openapi-typescript` na mão.
- **Review**: cada tarefa passou por review dedicado com correção e re-review, e a branch inteira por um review final. Achados corrigidos, entre eles: dois asserts que passavam independentemente do comportamento funcionar, um comentário que afirmava falsamente que a Filial não tem razão social no contrato — e que justificava mostrar o CNPJ da Filial sob o rótulo "CNPJ do tomador" —, e uma Filial marcada que ficava invisível e impossível de desmarcar quando a listagem falhava, mas seguia sendo enviada ao servidor.
