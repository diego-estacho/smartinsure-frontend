# Exec-plan 0016 — Cotação de filial do tomador (front)

Status: ativo — AB#0005 (`ab-0005-cotacao-filial-tomador`). Depende do contrato publicado pelo backend.
Contexto obrigatório: RN-052 em `../smartinsure-backend/docs/product-specs/regras-de-negocio/tomadores.md`; RN-053 e RN-050/RN-051 em `../smartinsure-backend/docs/product-specs/regras-de-negocio/grupo-de-cotacao.md`; `../smartinsure-backend/docs/adr/063-filial-como-pessoa-vinculada-a-matriz.md`; `docs/FRONTEND.md`; exec-plan base da jornada: `0015-nova-oferta-quotation-group.md`. Exec-plan irmão no backend: `../smartinsure-backend/docs/exec-plans/active/0013-cotacao-filial-tomador.md`.

## Objetivo

Substituir o botão "Adicionar filial" cosmético do wizard (`Step1PolicyHolder.vue:87-92`, que hoje descarta o
CNPJ digitado) pela lista real de Filiais com marcação exclusiva, refletir o estabelecimento escolhido no
resumo da jornada e enviá-lo ao backend; e listar Filiais na ficha do Tomador (RN-052, RN-053).

## Tarefas

- [ ] `pnpm types:gen` após o contrato do backend ser publicado — nenhum type de API escrito à mão.
- [ ] BFF proxies (ADR-008 — o browser nunca fala com o backend direto): `GET`/`POST` de `policy-holders/{id}/branches` em `server/api/`.
- [ ] Composable `usePolicyHolderBranches` — listar e cadastrar Filial por CNPJ, no padrão de `usePersons`.
- [ ] `stores/quotationGroupWizard.ts`: `SelectedPolicyHolder` ganha as Filiais e a Filial marcada; `setBranch`/`clearBranch`; a Filial entra no payload e na **assinatura de recálculo** (RN-051); trocar o Tomador limpa a Filial (RN-053).
- [ ] `Step1PolicyHolder.vue`: remover `addBranch()` e o aviso falso "Filial adicionada ao tomador"; lista de Filiais com checkbox **exclusivo** (marcar outra desmarca a anterior; desmarcar volta à matriz); consumir `preSelectedBranchId` da busca para nascer marcada; modal "Adicionar filial" passando a chamar o endpoint real e a exibir o aviso do backend quando o CNPJ não for localizado.
- [ ] `SummarySidebar.vue`: exibir o CNPJ do estabelecimento — da Filial marcada, ou o da matriz quando nenhuma estiver marcada.
- [ ] `composables/useQuotationGroups.ts`: enviar `branchId` no POST e no PUT; ao retomar um Rascunho com Filial, ela volta marcada.
- [ ] Ficha de detalhe do Tomador: seção Filiais (lista + cadastrar por CNPJ), consumindo `branches[]` do detalhe (RN-025).
- [ ] Testes vitest na store e no composable; E2E Playwright marcando e desmarcando a Filial e conferindo o CNPJ no resumo.

## Critérios de aceite

- Nenhuma regra de negócio no cliente: o vínculo Filial×matriz é validado pelo servidor; o front só valida forma.
- Marcar uma Filial troca o CNPJ do resumo para o dela; desmarcar volta para o da matriz (RN-053).
- Digitar o CNPJ de uma Filial na busca do Tomador deixa aquela Filial marcada; nos demais casos a lista abre desmarcada.
- Retomar um Rascunho que já registrou Filial traz a Filial marcada.
- Nenhum type de API à mão; só design tokens.
- Gates verdes: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`; cobertura ≥ 80%.

## Evidências

_A preencher na execução, antes do PR — evidência antes de afirmação._

- **Lint**: `pnpm lint` → (pendente)
- **Typecheck**: `pnpm typecheck` → (pendente)
- **Testes**: `pnpm test` → (pendente)
- **E2E**: `pnpm test:e2e` → (pendente)
- **Cobertura**: (pendente)
- **Jornada**: gravação/screenshot marcando e desmarcando a Filial no wizard → (pendente)
