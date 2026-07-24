# Exec-plan 0015 — Nova oferta (QuotationGroup): fluxo de cotação de Seguro Garantia

> **Cross-repo** (front-only na maior parte; etapas 2/3 reais dependem de contrato — ver Dependências).
> Branch/worktree: `quotation-group-wizard` (`C:\wt\quotation-group-wizard\smartinsure-frontend` + irmã `smartinsure-backend`). Sem `AB#` — o slug faz o papel.
> Origem: protótipo do Claude design `prototipos/nova oferta/design_handoff_nova_oferta/` (README + `Nova Oferta - publico.html` + `Nova Oferta.dc.html` + `colors_and_type.css`). Protótipo é **planta**: traduzir para o kit `Si` + tokens, nunca colar HTML (ADR-019/022).
> Predecessor: **0014** (app shell — a tela usa o `layout/shell.vue`; o item de menu "Cotações" nasce navegável aqui).

Status: em andamento

Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`; ADRs **002** (Pinia só UI), **004** (contrato/status por nome), **006** (tokens), **008** (BFF Nitro), **013** (kit `Si`), **015** (css `si-*`), **017** (mobile-first), **018** (página fina), **019** (DS de-para), **021** (Lucide), **022** (DS-first); `docs/design-system-map.md`; camada de produto: `glossario.md`, `open-decisions.md`.

## Objetivo

Recriar no stack do app (Nuxt + Vuetify + kit `Si` + tokens `--si-*` + Lucide) o fluxo **nova oferta** de Seguro Garantia: tela de entrada (escopo de cotação) + Stepper de 5 etapas + resumo lateral, mobile-first, alta fidelidade ao protótipo. **Etapas 1–3 funcionais** (integradas ao backend na medida em que o contrato existir); **tela de entrada, etapa 4 (Cotações) e etapa 5 (Emissão) como MOCK**, com os pontos de integração isolados atrás de uma interface de serviço (`TODO`), para outro dev "só remover o mock e ligar a API" quando o backend existir.

## Nomenclatura (decisão do dono — 2026-07-24)

- Código: **`QuotationGroup`** (o pedido/estudo criado no wizard — o que o glossário chama de Oferta/`Offer`) e **`Quotation`** (o retorno de uma seguradora, item do passo 4 — glossário: Cotação/`Quote`).
- "Oferta" fica **só como texto de UI** até definição concreta. Sem identificador ad hoc em pt-BR (ADR-058).
- ⚠️ O glossário canônico ainda diz `Offer`/`Quote` e `OPEN-01`/`OPEN-07` constam abertas; a PO **já aprovou** renomear e liberar. A **formalização** (renomear glossário, fechar OPEN-01/07) é passo do backend (PR-0) — como prevalece o arquivo versionado, o código de domínio de `QuotationGroup` só é legítimo depois disso.

## Triagem (Passo 0) → cross-repo

Toca dinheiro/cálculo/status/RN e precisa de contrato novo (`QuotationGroup`). As partes **front-only** (moldura do wizard, tela de entrada mock, etapas 4/5 mock, store de UI, etapa 1 sobre contrato existente) avançam já; as partes **cross-repo** (etapas 2/3 reais, salvar `QuotationGroup`) plugam quando o contrato existir. Nenhuma RN/dinheiro/status decidido no cliente (ADR-004/FRONTEND).

## Decisões-chave (do grill — ver `.grill/nova-oferta-grupo-cotacao.md`)

- **Etapa 4 = espera → lote** (~até 2 min, com timeout/erro), não streaming parcial. Mock imita: `carregando` → `recebidas` | `erro`.
- **Recálculo inteligente por assinatura**: ao gerar as cotações, snapshot dos dados que alimentam o motor (tomador, segurado, endereço, modalidade, IS, vigências, prazos, coberturas, escopo). Voltar a 1/2/3 é **livre**; se algum valor mudou, `SiAlert` de aviso nas etapas 1–3 ("as cotações serão recalculadas") — **sem modal** (segue o protótipo, não a descrição inicial do chat). Ao retornar à etapa 4: assinatura mudou → recalcula e descarta a seleção; nada mudou → preserva. Detecção por **comparação de valor** (diff do payload de 1/2/3), não por "tocou". Vale só na fronteira 3→4; voltar 5→4 (reescolher) não dispara.
- **Persistência**: um único `QuotationGroup` por passada — **POST** cria no 1º "continuar" do passo 3, **PUT** atualiza nas voltas; nada persiste antes disso (só Pinia). Cotações são geradas **na entrada do passo 4**, não no salvar do passo 3.
- **Sentada única**; listagem/re-entrada de `QuotationGroup` **fora de escopo** (salvar/retomar rascunho = 2ª etapa).
- Rota: **`/ofertas/nova`** (pt-BR de UI; provisória — pode virar `/cotacao/nova`, documentar).

## Escopo

**Dentro:**
- Rota `/ofertas/nova` sob o `layout/shell.vue` (0014); habilitar o item de menu "Cotações" quando fizer sentido (ver Aberto).
- **Moldura do wizard** (página fina, ADR-018): topo com título "Nova oferta" + `SiStepper` de 5 passos; **resumo lateral** "Resumo da oferta" (desktop, carvão, só campos preenchidos); **rodapé de navegação** ("Voltar" + primário "Continuar"/"Emitir"), validação bloqueia avanço (inline + `SiAlert` de resumo). Mobile: coluna única, stepper compacto "Passo X de 5", resumo colapsável no topo, modais viram bottom-sheets, tabela vira cards, alvo ≥44px. Breakpoint via `useIsMobile` (1024, como o shell).
- **Store Pinia** do wizard (`stores/`, só estado de UI): passo atual, dados por etapa, snapshot/assinatura para o recálculo, seleção de cotação. SSR-safe.
- **Camada de serviço** por composable (ADR-002/008): `useQuotationGroups()` (POST/PUT via `server/api/` Nitro), `useQuotations()` (etapa 4) e `useIssuance()` (etapa 5) — **etapas 4/5 com mock isolado atrás da interface** (fixtures do README), marcado `TODO` no ponto de integração.
- **Tela de entrada (mock):** RadioGroup "Cotar todas" (padrão) × "Escolher seguradoras específicas" (grid selecionável); "Iniciar oferta" valida (específico exige ≥1); escopo acompanha o `QuotationGroup` e filtra a etapa 4. Sem alterar escopo dentro da etapa 4.
- **Etapa 1 — tomador (real):** busca por CNPJ/razão social (`/persons`, `/policy-holders`), card do tomador, "adicionar filial" (modal CNPJ), "ver limites e taxas" → modal placeholder. Validação: tomador selecionado.
- **Etapa 3 — dados de risco (parcial-real):** modalidade (`GET /modalities` — já existe), IS (`SiCurrencyField`), início/fim de vigência (`SiDateField`) + prazo derivado, coberturas adicionais (checkbox), modalidade complementar. Salvar `QuotationGroup` no "continuar" (quando o contrato existir).
- **Etapa 4 (mock):** barra de escopo (read-only), skeleton "Consultando seguradoras…", resultado (desktop `SiDataTable` / mobile cards) ordenável (prêmio/comissão/limite), status pill (`emissão automática`/`requer análise`), indisponíveis colapsadas, painel accordion "Cotação selecionada" (tags da minuta inline + cláusulas particulares), "Baixar minuta". Fixtures do README.
- **Etapa 5 (mock):** contrato (nº), tags/cláusulas sincronizadas com a 4, prêmio/comissão, forma de pagamento; modal "Termo e declaração" (aceite obrigatório); estado "Emitindo apólice"; resultado via `SiSnackbar`/`SiAlert`.
- Ícones Lucide novos que faltarem em `lib/icons.ts` + de-para.

**Fora (e por quê):**
- Etapa 2 (segurado) **real** e salvar `QuotationGroup` **real** → contrato inexistente (ver Dependências). Entram como UI + serviço mockado/placeholder até o contrato.
- Backend real das etapas 4 e 5 (cotar/emitir) — outro dev, sobre o protótipo (o mock marca os `TODO`).
- Listagem/inbox de `QuotationGroup`, re-entrada entre sessões, salvar/retomar rascunho.
- Tela "ver limites e taxas" (só o modal placeholder "em construção").

## Dependências de contrato (backend-primeiro)

| Etapa / uso | Endpoint | Situação |
|---|---|---|
| 1 — busca tomador | `/persons`, `/policy-holders` (+addresses) | **existe** ✓ |
| 3 — modalidade | `GET /modalities` | **existe** ✓ (ab-0002 mergeada) |
| 3 — coberturas | `GET coberturas?modalidade=` | em `ab-0003-coberturas-adicionais` (branch aberta) |
| 4/5 — tags/cláusulas | `minuta-tags`, `clausulas` | em `ab-0004-tags-e-clausulas` (branch aberta) — usadas mockadas na 4/5 |
| 2 — segurado | `segurado?query=`, `segurado/{id}/enderecos` | **gap** — cross-repo (papel `Insured` da `Person`) |
| 3 — salvar | `POST/PUT quotation-groups` | **feito** ✓ (backend + BFF real; ver Incremento 8) |
| glossário | Offer→QuotationGroup, Quote→Quotation; fechar OPEN-01/07 | **feito** ✓ (renomeado; OPEN-01/07 resolvidas em parte) |
| 5 — emissão | `POST emissao` → apólice | mock (fora desta fase) |

## Incrementos (cada um = 1 PR pequeno, verticalmente verificável)

1. **Casca do fluxo** — rota `/ofertas/nova` + moldura do wizard (stepper + resumo lateral + rodapé nav, mobile-first) + store Pinia + camada de serviço com interfaces (mock isolado) + tela de entrada mock, navegável entre passos com placeholders. Habilita/prepara o item "Cotações".
2. **Etapa 1 (tomador) real** — sobre `/persons` + `/policy-holders`.
3. **Etapa 3 (dados de risco)** — modalidade real (`/modalities`) + coberturas (quando `ab-0003`) + IS/vigência/prazo; salvar `QuotationGroup` (quando PR-0); dirty-tracking/assinatura.
4. **Etapa 4 (mock)** — tabela/cards, ordenação, status, indisponíveis, painel de seleção, tags/cláusulas inline; loop espera→lote com fixtures.
5. **Etapa 5 (mock)** — emissão, termo/aceite, pagamento, resultado.
6. **Etapa 2 (segurado)** — UI + serviço; vira real quando o contrato de segurado existir.

## Critérios de aceite (por incremento)

- `python scripts/check-harness.py` → `harness ok` (sem hex fora de `tokens/`; identificadores inglês; css `.si-*`; exec-plan válido).
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (cobertura ≥80%), `pnpm build` verdes.
- Nenhum valor visual hardcoded fora de `styles/tokens/`; toda UI via kit `Si` (componente que faltar entra no kit primeiro).
- Nenhuma RN/dinheiro/status decidido no cliente; status por nome estável do contrato.
- Etapas 4/5: nenhum ponto de integração sem `TODO`; mock atrás de interface de serviço, com fixtures do README (nomes de seguradora reais; logos placeholder — não embarcar logotipo de terceiro).
- Evidência: screenshots desktop (~1280) e mobile (~390) da jornada afetada, via Playwright (dev-auth ADR-009); testes de comportamento `.nuxt.spec.ts`.

## Evidências

### Incremento 1 — Casca do fluxo (2026-07-24)

**Arquivos:** `app/layouts/shell.vue` (item "Cotações" → `/cotacoes`); novos: `app/pages/cotacoes/index.vue`, `app/pages/ofertas/nova.vue`, `app/stores/quotationGroupWizard.ts`, `app/components/quotation-groups/{Wizard,EntryStep,SummarySidebar,StepPlaceholder}.vue`, `tests/unit/components/quotation-group-wizard.nuxt.spec.ts`; ajustado `tests/unit/components/shell.nuxt.spec.ts` ("Cotações" agora habilitado; "Apólices" segue desabilitado).

**Gates (worktree `quotation-group-wizard`):**
- `pnpm typecheck` → exit 0.
- `pnpm lint` → exit 0.
- `python scripts/check-harness.py` → `harness ok`.
- `pnpm test` → **137/137** (22 arquivos; +10 no novo spec).
- `pnpm build` → exit 0.

**Runtime (dev :3100, dev-auth ADR-009), Playwright:**
- `0015-cotacoes-desktop.png` — "Cotações" ativo no menu; "em construção" + botão "Nova oferta".

**Ajuste de layout (2026-07-24, pedido do dono):** o fluxo "nova oferta" é **focado** — NÃO renderiza o menu de navegação da app. Passou a usar o layout `default` (blank) + cabeçalho próprio (marca + conta neutra OPEN-03 + "Sair e cancelar oferta"); o **resumo da oferta ocupa a coluna carvão à esquerda** (no lugar do menu) e o conteúdo fica à direita, conforme o protótipo. Novo `components/quotation-groups/Header.vue`; `Wizard.vue`/`EntryStep.vue`/`SummarySidebar.vue` reescritos; textos alinhados ao handoff ("Como você quer cotar esta oferta?"). Validado contra `Nova Oferta - publico.html` (desktop 1280 / mobile 390):
- `0015b-nova-entrada-desktop.png` — cabeçalho próprio; resumo carvão à esquerda; pergunta de escopo com sub-textos.
- `0015b-nova-stepper-desktop.png` — resumo carvão (altura total) + stepper de 5 passos na coluna de conteúdo; Voltar/Continuar.
- `0015b-nova-entrada-mobile.png` — cabeçalho + resumo colapsável no topo (sem menu / sem bottom-nav).
- `0015b-nova-stepper-mobile.png` — stepper compacto "Dados do tomador · Passo 1 de 5" + barra de progresso.
- `0015c-mobile-colapsado.png` — resumo mobile nasce **colapsado** (conteúdo movido para o slot `#text` do `SiExpansionPanel`, que é o que colapsa), fiel ao protótipo.

### Incremento 2 — Etapa 1 (Dados do tomador) (2026-07-24)

**Arquivos:** `stores/quotationGroupWizard.ts` (+ `SelectedPolicyHolder`, `setPolicyHolder`, `validateCurrentStep`); novo `components/quotation-groups/Step1PolicyHolder.vue` (busca real + card + modais de filial/limites); `Wizard.vue` (passo 1 renderiza o Step1 + validação de avanço no rodapé); `SummarySidebar.vue` (passa a mostrar o tomador); spec `+5` testes.

**Integração (contrato existente):** busca `usePolicyHolders().listPolicyHolders({ search })`; detalhe `getPolicyHolder(id)` → card (razão social + CNPJ + endereço principal), mesmo padrão de `tomadores/index`/`nova`. "Adicionar filial" e "Ver limites e taxas" abrem modais — filial: TODO(backend), endpoint Branch inexistente; limites: placeholder (tela à parte).

**Gates:** typecheck ✓ · lint ✓ · check-harness `harness ok` ✓ · test **142/142** ✓ · build ✓.

**Runtime (dev :3000, backend :5158, dev-auth):**
- `0015d-step1-busca.png` — passo 1 fiel ao protótipo: campo "CNPJ ou razão social" + "Buscar", stepper no passo 1, resumo carvão.
- `0015d-step1-validacao.png` — "Continuar" sem tomador bloqueia e mostra "Busque e selecione o tomador para continuar.".
- **Busca com dados reais:** exige sessão autenticada no backend (Casdoor). Com o dev-auth sintético o backend retorna **401** e o app redireciona ao login (auth global) — a chamada chega ao backend (integração conectada); a lógica de busca/seleção/card + resumo é coberta pelos testes unitários.

### Incremento 3 — Etapa 3 (Dados de risco) (2026-07-24)

**Arquivos:** `stores/quotationGroupWizard.ts` (+ `RiskData`, estado `risk`, validação do passo de risco); novo `components/quotation-groups/Step3Risk.vue` (modalidade real + IS + vigência + prazo derivado + coberturas); `Wizard.vue` (passo de risco renderiza o Step3); `SummarySidebar.vue` (mostra modalidade/IS/vigência); spec `+3`.

**Integração:** modalidade via `useModalities().listModalities()` (contrato existente); IS `SiCurrencyField` (number BRL), vigência `SiDateField` (ISO) + prazo derivado; coberturas com os rótulos do handoff enquanto `GET coberturas` (ab-0003) não é publicado (TODO). O *salvar* do QuotationGroup no avanço (POST/PUT) é backend-primeiro (PR-0) — dados coletados, persistência pendente do contrato.

**Gates:** typecheck ✓ · lint ✓ · check-harness ✓ · test **145/145** (+3) ✓ · build ✓.

**Validação visual — limitação de ambiente:** o banco local está **vazio** (0 tomadores, 0 modalidades) e o cadastro via Birô retorna 500 (não configurado localmente). O **login real** (form email/senha) foi confirmado (200) e destrava as chamadas de dados (`policy-holders`/`modalities` passam de 401 para 200) — integração conectada. Sem dados no banco não dá para navegar até o passo de risco no browser (o passo 0 exige selecionar um tomador). A lógica e o resumo das etapas 1 e 3 ficam cobertos pelos 145 testes; o campo de busca e a validação da etapa 1 têm evidência visual (0015d).

### Incremento 4 — Etapa 4 (Cotações), MOCK (2026-07-24)

**Arquivos:** novo `composables/useQuotations.ts` (mock isolado: fixtures do handoff + espera→lote + `quotationStatusView`); novo `components/quotation-groups/Step4Quotations.vue` (barra de escopo, loading, tabela desktop / cards mobile, ordenação, indisponíveis colapsadas, painel da cotação selecionada); `stores/quotationGroupWizard.ts` (+ `selectedQuotation`, validação do passo, reset); `Wizard.vue` (passo de cotações); `SummarySidebar.vue` (mostra a cotação); spec `+5`. Escopo do **4a**; as tags da minuta + cláusulas particulares (inline) ficam para o **4b**.

**Mock (costura isolada):** `useQuotations().fetchQuotations()` simula "espera → lote" (~1,5s) e devolve as fixtures; ligar `POST cotacao/motor` (OPEN-07) troca só o composable — a tela não muda. TODO marcado.

**Gates:** typecheck ✓ · lint ✓ · check-harness ✓ · test **150/150** (+5) ✓ · build ✓.

**Runtime (dev :3000, dev-auth), Playwright — desktop 1280 / mobile 390:** como o banco local está vazio (não dá para navegar até o passo 4 pela busca), o estado do wizard foi injetado via Pinia no browser (dev) para alcançar a etapa 4 mock:
- `0015f-step4-desktop.png` — escopo, tabela ordenada por prêmio (Sancor/Newe/Mitsui) com status pills (emissão automática / requer análise), indisponíveis (4).
- `0015f-step4-selecionada.png` — cotação selecionada (Sancor), indisponíveis expandidas com motivos, painel "Cotação selecionada" + "Baixar minuta"; resumo lateral acumulando do tomador à cotação.
- `0015f-step4-mobile-fix.png` — cards; corrigido o corte do Limite (prêmio em destaque + comissão/limite em duas colunas).

### Incremento 4b — Minuta e cláusulas inline (2026-07-24)

**Arquivos:** novo `lib/minuta.ts` (defs de tags/cláusulas, `buildObjetoTemplate`, `parseTemplate`); novos `components/quotation-groups/MinutaText.vue` (texto com tokens inline) e `MinutaClauses.vue` (blocos "Tags da minuta" + "Cláusulas particulares"); `useQuotations.ts` (+ `tags[]` por seguradora); `stores/quotationGroupWizard.ts` (+ `minuta`/`clauses` + reset); integrado no painel do `Step4Quotations`; spec `+5`. Reaproveitável na etapa 5 (sincronizado pela store).

**Comportamento (fiel ao handoff):** tags variam por seguradora (Sancor 4 / Mitsui 3 / Newe 0 → sem bloco); o texto do objeto é montado conforme as tags e mostra os valores **inline** — preenchido em verde, vazio como marcador tracejado `[nome]`. Cláusulas com checkbox (Dolo marcada por padrão) + texto inline + tags próprias (Retenção: percentual/prazo).

**Gates:** typecheck ✓ · lint ✓ · check-harness ✓ · test **155/155** (+5) ✓ · build ✓.

**Runtime (Playwright, estado injetado via Pinia — banco local vazio):**
- `0015g-minuta-clausulas-desktop.png` — painel completo (Sancor): tags da minuta + cláusulas.
- `0015g-minuta-zoom.png` — tokens inline verde (preenchido) × tracejado (vazio); cláusula Retenção com campos próprios.

### Incremento 5 — Etapa 5 (Emissão), MOCK (2026-07-24)

**Arquivos:** novo `composables/useIssuance.ts` (mock: emite e devolve `policyId`); novo `components/quotation-groups/Step5Issuance.vue` (form: contrato + minuta/cláusulas reusadas + prêmio/comissão com valor da comissão derivado + forma de pagamento; modal "Termo e declaração" com aceite; estados emitindo/sucesso); `stores/quotationGroupWizard.ts` (+ `issuance`/`issuanceState`/`policyId`/`termOpen`/`termAccepted` + validação do passo + reset); `Wizard.vue` (passo de emissão; "Emitir" abre o termo; rodapé some ao emitir/concluir); spec `+5`.

**Nota de nomenclatura:** o handoff usava `apoliceId`; o harness cobra inglês (Apólice = `Policy`, ADR-058) → renomeado para `policyId`.

**Gates:** typecheck ✓ · lint ✓ · check-harness `harness ok` ✓ · test **160/160** (+5) ✓ · build ✓.

**Runtime (Playwright, estado injetado via Pinia — banco local vazio):**
- `0015h-emissao-form.png` — form completo (contrato, minuta/cláusulas, prêmio/comissão com valor da comissão derivado, forma de pagamento); resumo lateral acumulado.
- `0015h-termo-modal.png` — modal "Termo e declaração"; "Emitir apólice" desabilitado até o aceite.
- `0015h-emissao-sucesso.png` — "Apólice emitida" (contrato 2026/0481-SP) + "Baixar apólice"/"Nova oferta"; rodapé escondido.

### Incremento 6 — Etapa 2 (Dados do segurado) (2026-07-24)

**Correção de premissa:** a etapa 2 havia sido marcada como bloqueada por falta de contrato — estava **errado**. O Segurado é o papel `Insured` de uma `Person`, e `GET /api/v1/persons?term=&role=Insured` existe (retorna itens já com `mainAddress` + `roles`). A etapa 2 é **real**.

**Arquivos:** novo `server/api/persons.get.ts` (BFF proxy); novo `composables/usePersons.ts` (`searchPersons({ term, role })`); `stores/quotationGroupWizard.ts` (+ `SelectedInsured`, `insured`, `setInsured`, validação do passo, reset); novo `components/quotation-groups/Step2Insured.vue` (busca + card: razão social, CNPJ, nome fantasia, endereço principal); `Wizard.vue` (passo de segurado); `SummarySidebar.vue` (mostra o segurado); spec `+5`. Gerenciar endereços do segurado (adicionar/selecionar/excluir) fica como TODO — não há endpoint de endereço de Pessoa; por ora mostra o endereço principal.

**Gates:** typecheck ✓ · lint ✓ · check-harness ✓ · test **165/165** (+5) ✓ · build ✓.

**Runtime (Playwright, estado injetado via Pinia — banco local vazio):**
- `0015i-step2-segurado.png` — passo 2 com card do segurado (nome, CNPJ, nome fantasia, endereço principal); resumo lateral com Tomador + Segurado.

### Sincronização origin/main + Incremento 7 — Salvar + recálculo inteligente (2026-07-24)

**Sincronização:** `git pull origin main` (merge **limpo, sem conflitos**) nos dois repos trouxe a feature de **Coberturas Adicionais** (curadoria admin: composables, BFF, tela `/coberturas-adicionais`, tipos regenerados) + tags/cláusulas no backend. O `shell.vue` auto-mesclou (meu `cotacoes → /cotacoes` + item "Coberturas Adicionais"). **Nuance:** a curadoria NÃO oferece "GET coberturas da cotação por modalidade" (só POST/PUT/activate/inactivate + mapa) — a etapa 3 mantém as coberturas do handoff até esse endpoint existir. Suíte pós-merge: **194/194** (meu código + o do dev coexistindo).

**Salvar QuotationGroup (costura mock):** novo `composables/useQuotationGroups.ts` (`saveQuotationGroup(payload, existingId)` — POST sem id / PUT com id; mock, TODO backend). `Wizard.vue` salva ao avançar do passo de risco e guarda `quotationGroupId` (botão com loading).

**Recálculo inteligente:** store guarda `quotations` (preservadas) + `quotationSignature` + `quotationsGenerated` + `signatureChanged`. Assinatura = tomador, segurado, escopo, modalidade, IS, vigência, coberturas. `markQuotationsGenerated` grava a assinatura ao gerar; ao voltar às etapas 1–3 e mudar um dado, `SiAlert` avisa; ao reentrar na etapa 4, se a assinatura mudou recalcula e **descarta a seleção**, senão preserva (sem reprocessar).

**Gates:** typecheck ✓ · lint ✓ · check-harness ✓ · test **197/197** (+3) ✓ · build ✓.

**Runtime (Playwright, estado injetado via Pinia):**
- `0015j-recalculo-alert.png` — ao alterar a IS na etapa 3, o Alert "as cotações serão recalculadas" aparece; resumo reflete a IS nova.

### Incremento 8 — Backend do salvar `QuotationGroup` + integração real (2026-07-24) — cross-repo

Núcleo do PR-0: sai o mock, entra a persistência real. Cross-3-repos (backend + dbmigration + front), tudo no worktree/branch `quotation-group-wizard`.

**Fase 0 — formalização (backend `docs/product-specs`):** glossário renomeado `Oferta`/`Offer` → **`Grupo de Cotação`/`QuotationGroup`** e `Cotação`/`Quote` → **`Cotação`/`Quotation`** (só o nome técnico; UI mantém "oferta"); estado **`Rascunho`/`Draft`** adicionado à máquina de estados; **RN-050** (criação) e **RN-051** (atualização em Rascunho) catalogadas em `regras-de-negocio/grupo-de-cotacao.md`; `OPEN-01`/`OPEN-07` atualizadas (resolução parcial no escopo); exemplo defasado do ADR-058 corrigido.

**Fase 1 — backend .NET (`smartinsure-backend`, padrão `BrokerageInsurerEnablement` + pai-filho `CreditInquiry`):** `Core` — enums `EQuotationGroupStatus`/`EQuotationScopeMode`, entidade rica `QuotationGroup` (factory `Create` + `UpdateDraft`) + filha `QuotationGroupInsurer`, `IQuotationGroupRepository`; `Infra.Data` — 2 mappings Fluent, repositório, `DbSet`s, registro na DI; `Application.UseCase` — `CreateQuotationGroup` e `UpdateQuotationGroup` (Request/Response/Interface/Validator/UseCase); `Api` — `QuotationGroupsEndpoint` (POST 201 / PUT 200). Coberturas = 2 booleanos provisórios (Multa, Trabalhista/Previdenciária), decisão do dono, até o read de coberturas-por-modalidade existir.

**Fase 2 — migration (`smartinsure-dbmigration`, worktree a partir de `origin/develop`, branch `quotation-group-wizard`):** `V20260724173720__criar-tabelas-quotation-groups.sql` — tabelas `QuotationGroups` + `QuotationGroupInsurers`, espelhando os mappings 1:1. **Não commitada** (vai por branch → merge em develop depois).

**Fase 3 — integração real no front:** `useQuotationGroups` trocou o mock por `$fetch` via BFF (mapeia estado do wizard → contrato: escopo/risco achatados, `scopeMode` All/Specific, coberturas 2 bools); novos `server/api/quotation-groups.post.ts` e `server/api/quotation-groups/[id].put.ts` (proxy Nitro + sessão do cookie httpOnly, ADR-008); novo `tests/unit/quotation-groups-bff.nuxt.spec.ts` + costura do wizard spec atualizada (injeta `$fetch` mock, valida mapeamento POST/PUT).

**Contrato regenerado:** o feed privado morto (`gclaims`/`GeneralClaimsDotNet`) foi removido via novo `nuget.config` no worktree do backend (só `nuget.org`) — destravou o `restore`/build. A API subiu (config dummy só para passar o `ValidateOnStart`, sem tocar DB/Casdoor reais) e serviu o OpenAPI; `docs/generated/openapi.json` foi regenerado (com `/api/v1/quotation-groups` POST/PUT + schemas `Create/UpdateQuotationGroup*`) e o `app/types/gen/api.ts` do front regenerado a partir dele. `useQuotationGroups` passou a usar os **tipos gerados** (sem tipos locais provisórios).

**Gates:** **Front** — typecheck ✓ · lint ✓ · check-harness `harness ok` ✓ · test **199/199** ✓. **Backend** — `dotnet build` ✓ (`Build succeeded`, 0 erros `CS`) · check-harness `harness ok` ✓ · testes de unidade **8/8** (`CreateQuotationGroupUseCase` 5 = RN-050 · `UpdateQuotationGroupUseCase` 3 = RN-051) ✓.

**Pendente (infra/sessão real):** teste **E2E ao vivo** (salvar de verdade) — a API sobe, mas o fluxo real exige SQL + Casdoor configurados; o comportamento fica coberto pelos 8 testes de unidade do backend + 199 do front. Migration ainda **não aplicada** (vai por branch → merge em develop).

## Aberto (registrado)

- **Ponto de entrada (decidido 2026-07-24):** habilitar o item de menu "Cotações" → rota `/cotacoes` = página placeholder "em construção" (centro) + botão **"Nova oferta"** no canto superior direito que leva a `/ofertas/nova`. A listagem real de cotações segue fora de escopo.
- Reconciliar breakpoint: README da nova oferta cita ~960px; o shell (0014) usa 1024. Adotado **1024** (fonte real = shell).
- Endereços do segurado — adicionar/selecionar/excluir endereço de Pessoa não tem endpoint no contrato; a etapa 2 mostra o endereço principal (TODO backend).
- **Salvar o QuotationGroup**: **feito** (Incremento 8) — backend .NET (build ✓, 8/8 testes), migration, contrato regenerado (`openapi.json`/`api.ts`, tipos gerados), BFF real e recálculo inteligente. Resta só o E2E ao vivo (exige SQL + Casdoor reais).
- **Commits/PRs**: nada commitado; migration numa branch a partir de `develop` (merge depois, pedido do dono). Novo `nuget.config` no worktree do backend (remove o feed morto `gclaims`) — decidir se entra no repo ou fica local.
- **Coberturas da cotação por modalidade**: a etapa 3 usa os checkboxes do handoff; falta o endpoint de leitura de coberturas para o corretor (a curadoria admin veio, mas não serve para isso).
