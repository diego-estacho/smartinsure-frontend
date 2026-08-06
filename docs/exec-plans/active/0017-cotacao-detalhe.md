# Exec-plan 0017 — Página de Detalhes da Cotação (Fatia 1, read-only — front)

Status: **em andamento** (2026-08-04). Slug `detalhe-cotacao`, AB# pendente. Consome o contrato do backend (`GET /quotations/{id}`, exec-plan 0018 no `smartinsure-backend`), linkado pelo mesmo AB#. Protótipo hi-fi: `prototipos/detalhes cotacao/handoff-cotacao-detalhe/01-cotacao-detalhe.md` (planta — traduzir ao kit `Si`, não colar).
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, os ADRs em `docs/adr/` (ADR-019 de-para, ADR-022 DS-first, ADR-021 ícones, ADR-017 mobile-first), `docs/design-system-map.md`, a camada de produto em `../smartinsure-backend/docs/` (**RN-081**, RN-077/078, glossário, open-decisions), `.grill/detalhe-cotacao.md`, `00-fundamentos.md` do handoff.

## Objetivo

Entregar a **tela de detalhes da Cotação** read-only na rota `/cotacoes/:id`, dentro do `AppShell` com **Cotações** ativo, consumindo `GET /quotations/{id}`. A tela abre pra qualquer Cotação do livro (clique na linha / "Ver detalhes"), mostra **Resumo + Cronologia**, e o voltar preserva filtros e página da listagem. Desktop e mobile.

## Escopo e não-escopo

- **No escopo:**
  - Página `app/pages/cotacoes/[id].vue` (`:id` = `quotationId`, guid); dentro do `AppShell`. Número é **só exibição** (cabeçalho/breadcrumb via `SiPageBack`).
  - **Entrada:** fiar o clique na linha e o "Ver detalhes" do kebab da listagem → `navigateTo('/cotacoes/{quotationId}')`. **Saída:** back + breadcrumb devolvem à listagem preservando o recorte.
  - **Preservação de filtro/página (URL-sync):** a listagem (`cotacoes/index.vue`) passa a sincronizar `situation/search/page/filters` na **query da URL** (lê no mount, escreve na mudança); o detalhe volta pra essa URL. Reverter se não render bem.
  - `useQuotationDetail` (composable, fetch tipado pelo contrato via BFF do Nitro, ADR-008).
  - **View-model de situação de detalhe** (inglês) mapeando `(result, requiresCcg, ccgSigned) → { stepper?, alert, hasSituationCard }`, **reusando `lib/status/quotations.ts`** para pill/rótulo (fonte única, eixo-1). `ccg` = `requiresCcg && !ccgSigned`.
  - **Card de situação (Stepper + Alert) só em pronta/ccg.** `pronta` → `SiAlert success` "Emissão liberada"; `ccg` → `SiAlert warning` "Pendência de CCG" (copy verbatim). `Analysis`/`Unavailable`/`Unrecognized` = read-only puro (pill + Resumo + Cronologia, sem stepper/alert).
  - **Botões Emitir + Cancelar** visíveis e **habilitados em pronta/ccg**, **sem ação** nesta fatia (dev; integração nas fatias seguintes). **CCG não desabilita Emitir.**
  - **Aba Resumo:** faixa de números (IS · Prêmio · **Comissão R$** do contrato · Vigência em dias, aritmética de exibição) via `SiMetric`; card "Dados da cotação" (Partes com CNPJ; "Objeto e cobertura" **sem `objeto`**, com Cobertura adicional; "Vigência e emissão" **sem `propostaValidaAte`**).
  - **Cronologia** (aside sticky no desktop, colapsável no mobile) renderizando a `timeline[]` do contrato.
  - **Mobile (<1024px):** cabeçalho escuro, `Stepper` vertical, ações empilhadas largura total ≥44px, cronologia colapsável (superfície reduzida: só Resumo + Cronologia).
  - **DS-first:** kit `Si` (`SiStepper`, `SiAlert`, `SiTabs/SiTab`, `SiAvatar`, `SiMetric`, `SiCard`, `SiChip`, `SiPageBack`, `SiButton`, `SiSnackbar` p/ toasts read-only como copiar número). Componente que faltar entra no kit primeiro (ADR-022).
  - Regenerar types do OpenAPI (`types:gen`) após o contrato do backend.
- **Fora do escopo (com motivo):**
  - **Abas Documentos e Follow-up, cenário `subscricao`** (subsistemas inexistentes) — fatias próprias.
  - **Modais de emissão/cancelamento e seus POSTs** — fatias próprias (os botões ficam sem ação por ora).
  - **Cenários `cancelada`/`emitida`** (eixo-2, não modelado). **`objeto`/`propostaValidaAte`** (não vêm no contrato).
  - Badge de mensagens não lidas; ação própria de CCG.

## Tarefas

- [x] BFF `server/api/quotations/[id].get.ts` (proxy fino ao backend, ADR-008) — não havia catch-all.
- [x] Fiar navegação da listagem (clique na linha via `@click:row` + "Ver detalhes") para `/cotacoes/{quotationId}`.
- [x] `cotacoes/index.vue`: sincroniza `situation/search/page/filters` na URL-query (hidrata no mount, escreve na mudança) + `useQuotationBookReturn` guarda o `fullPath` para o voltar.
- [x] `useQuotationDetail` (fetch `/api/quotations/{id}` via `$api`, tipado pelo contrato gerado).
- [x] View-model `lib/quotations/detailView.ts` (inglês) reusando `lib/status/quotations.ts` p/ a pill; `getQuotationScenario`/`getDetailSituationView`/`getTimelineEventView`; regra `ccg = requiresCcg && !ccgSigned` (CCG **não** trava as ações).
- [x] `app/pages/cotacoes/[id].vue`: breadcrumb (`SiPageBack`→`returnTo`), cabeçalho (avatar/iniciais, título, pill + badge CCG, meta, copiar número), card de situação (só pronta/ccg), botões Emitir/Cancelar (visíveis, inertes), aba Resumo, Cronologia. Estados carregando/erro/**404**.
- [x] Componentes por bloco (ADR-018): `QuotationSituationCard`, `QuotationDetailSummary`, `QuotationTimeline`. `lib/dates.ts` ganhou `toBrDateOnly`/`toBrDateTimeAt`/`coverageDays` (reuso). Ícone `copy` no registry + de-para.
- [x] Mobile: cabeçalho escuro (`on-charcoal`), stepper vertical, ações empilhadas largura total, cronologia colapsável.
- [x] `types:gen` (do contrato local mesclado — `openapi.json` fica pro CI), `pnpm install`, `typecheck` (0), `lint` (0), `check-harness` (limpo dos meus arquivos), `vitest`.

## Critérios de aceite

- `python scripts/check-harness.py` verde; `lint`, `typecheck` e `vitest` verdes (cobertura ≥80% no que for testável).
- A tela abre pra qualquer Cotação do livro (clique/`Ver detalhes`); URL direta por guid carrega; back e breadcrumb voltam preservando filtro/página.
- Situação por **nome estável** (reuso do status lib); card de situação só em pronta/ccg; Emitir habilitado inclusive no `ccg`. Alerts com copy **verbatim**.
- Comissão em R$ vem do contrato (não recalculada); `objeto`/`propostaValidaAte` **não** aparecem; Cronologia renderiza só a `timeline[]` do servidor.
- **Evidência:** screenshot/gravação desktop **e** mobile das situações pronta e ccg + uma read-only (ex. Análise).

## Evidências

- `pnpm typecheck` (nuxt typecheck): **0 erros**.
- `pnpm lint` (eslint): **0** (exit 0).
- `pnpm exec vitest run`: **362 passed (54 files)** — inclui `tests/unit/lib/quotations/detailView.spec.ts` (6, traits RN-081: cenário por eixos reais, copy verbatim dos alerts, CCG não trava ações, cronologia por tipo estável).
- `python scripts/check-harness.py`: **limpo dos meus arquivos**. Resta 1 erro **pré-existente na `origin/main`** — `app/components/quotation-groups/Step4Quotations.vue` (`const nomes`, pt-BR), do AB#0007 (não deste PR; confirmado em `git show origin/main:...`). Meus `.vue` usam só design tokens (hex removido: cronologia → `--si-verde-*`/`--si-warning-*`; hero escuro → `on-charcoal`).
- Contrato: types gerados de um contrato local mesclado (endpoint `/api/v1/quotations/{id}` + schemas); `docs/generated/openapi.json` fica para o CI (não sobrescrito — CRLF/CI).
- **Validação ao vivo** (backend real :5158 + front :3000, corretora FINN, 23 cotações reais): jornada listagem → clique na linha → detalhe por **guid** → voltar **preservando `?situation&page`** (histórico e breadcrumb); **URL-hydration** (entrada direta em `?situation=ReadyForEmission&page=2` reidrata aba+página); cenários **pronta** (stepper + alert "Emissão liberada"), **ccg** (stepper "Assinatura do CCG" + alert warning + **Emitir habilitado**), **análise** (read-only, sem card/ações), **404** (guid inexistente → "Cotação não encontrada"); **mobile 390px** (cabeçalho escuro, stepper vertical, ações empilhadas, cronologia colapsável). Console **0 erros** nos fluxos válidos. Evidências: `docs/exec-plans/evidence/cotacao-{desktop-pronta-v2,desktop-ccg,desktop-analise,mobile-ccg}.png`.
- **Bug pego na validação (só em runtime):** componentes em `components/quotations/` auto-importam com prefixo do diretório (`QuotationsFoo`); a página referenciava sem prefixo → "Failed to resolve component" + corpo vazio, **sem** typecheck/lint/vitest acusarem. Corrigido (rename `SituationCard`/`DetailSummary`/`Timeline` + tags `Quotations*`). Reforça a regra: validar ao vivo antes de dar por pronto.
- **Follow-up menor:** no mobile a Cronologia inicia expandida (o `open` é semeado no SSR onde `collapsible=false`); o toggle funciona. Ajuste cosmético opcional.
