# AGENTS.md — SmartInsure Frontend

Este arquivo é o mapa do harness deste repositório. Todo agente (e todo dev) lê este arquivo antes de alterar código, configuração ou documentação. Este é o repo do frontend — **o domínio do produto NÃO mora aqui**: mora na camada de produto, no repositório do backend.

## Fonte de verdade (ordem de precedência)

A camada de produto vive no `smartinsure-backend`, clonado lado a lado (ADR-001 do produto):

1. [Glossário canônico](../smartinsure-backend/docs/product-specs/glossario.md) — vale na UI, nas rotas e nos nomes de componente/tipo de domínio.
2. [Catálogo de RNs](../smartinsure-backend/docs/product-specs/regras-de-negocio/README.md) — fonte única de regra de negócio.
3. [Decisões abertas](../smartinsure-backend/docs/product-specs/open-decisions.md) — o que está aberto NÃO é implementável.
4. [Constituição](../smartinsure-backend/docs/constitution.md) e [Segurança](../smartinsure-backend/docs/SECURITY.md) do produto — princípios e regras obrigatórias.
5. [docs/FRONTEND.md](docs/FRONTEND.md) — convenções deste repo (arquitetura Nuxt decidida).
6. [docs/adr/](docs/adr/) — ADRs específicos de UI (numeração própria; ADRs de produto ficam no backend).
7. [Design system](docs/design-system-map.md) — fonte de marca (tokens, componentes, protótipos) em `../design system/`; de-para para o stack em docs/design-system-map.md (ADR-019). Protótipo é planta: traduzir, nunca colar HTML cru.

Conflito entre chat, memória e arquivos: **prevalecem os arquivos versionados**. Regra ambígua ou inexistente: **pare e registre em open-decisions.md** (camada de produto) com dono sugerido. Nunca invente regra de negócio.

## Regras de trabalho

- Idioma: **identificador de código é sempre inglês** — variável, função, método, arquivo, componente, tipo, composable, classe CSS (`submitting`/`signIn`/`drawerOpen`, nunca `enviando`/`entrar`/`drawerAberto`). Só **rota de página** e **texto de UI** ficam em pt-BR. Termo de domínio no código usa o nome técnico inglês mapeado 1:1 no glossário (ADR-058 do produto); não-domínio usa inglês idiomático. O `check-harness.py` cobra.
- Types da API: SEMPRE gerados do contrato OpenAPI do backend — proibido escrever ou editar type de API à mão (o CI falha em drift).
- Status: renderizado pelo **nome estável** vindo do contrato; label/cor num único mapa por domínio. Nunca por posição ordinal.
- Nenhuma regra de negócio no cliente: dinheiro, transição de status e permissão são decididos no servidor; o front valida forma, não decisão.
- Nenhuma cor/fonte/espaçamento hardcoded em componente — só design tokens (whitelabel por corretora desde o dia 1).
- **Tela é DS-first (ADR-022):** toda tela — **com ou sem protótipo** do Claude design — é composta pelo kit `Si` (vitrine `/dev/ui` = catálogo vivo; [docs/design-system-map.md](docs/design-system-map.md) = de-para). Nada de elemento HTML cru estilizado à mão. Componente que falta entra **no kit primeiro** (wrapper/apresentacional + skin + vitrine + de-para), nunca como acabamento one-off na página. Com protótipo, ele é planta: traduzir, não colar (ADR-019).
- Toda classe CSS autoral leva prefixo `si-`; CSS de componente é escopado sob `.si-*` (isolamento de microfrontend, ADR-015). O harness cobra.
- Segredo nunca em arquivo versionado; token nunca em localStorage (SECURITY do produto).
- Pasta de trabalho de framework não é versionada (ADR-004 do produto); o resultado é aterrissado nos docs.
- Cobertura mínima de 80% é gate de CI; teste sem asserção de comportamento não conta (QUALITY_SCORE do produto).
- Antes de criar abstração/utilitário novo, procurar padrão existente no repo (componente, composable, token) — utilitário compartilhado antes de helper à mão.
- Menor incremento vertical verificável; PR pequeno, um assunto.

## Fluxo por tarefa

> **Gate de entrada (bloqueante — ADR-003, ADR-016, ADR-002).** Nenhuma alteração de código,
> config ou doc começa antes de: (a) ler este arquivo inteiro; (b) fazer a triagem abaixo (define
> se é só-front, só-back ou cross-repo); (c) criar a(s) **worktree(s)** da tarefa e trabalhar nelas
> — nunca na checkout principal (ADR-002); (d) decidir e **registrar** se a tarefa leva exec-plan.
> Vale para qualquer IA ou dev — o `check-harness.py` cobra a decisão de exec-plan; o `doctor.py`
> avisa se você não está numa worktree.

**Passo 0 — triagem.** A tarefa toca dinheiro, transição de status, permissão, cálculo ou regra de negócio — ou precisa de contrato novo/alterado?
- **Não → front-only:** fica neste repo; siga direto para a implementação, mantendo o vocabulário do glossário.
- **Sim → cross-repo:** a RN/contrato entra no **backend primeiro** (refinada com a PO e catalogada antes do código — ADR-003 do produto); só então o front consome. PRs linkados pelo mesmo `AB#NNNNN` (ADR-001 do produto).

1. Ler este arquivo + somente os docs relevantes ao tema; confirmar que nenhuma dependência está aberta em open-decisions.md (camada de produto).
2. **Decisão de exec-plan (obrigatória; o plano, não).** Trabalho não-trivial (≈+1 dia ou decisão a documentar) ganha exec-plan em `docs/exec-plans/active/` ANTES de implementar (Evidências preenchida ao concluir). Trivial (ex.: trocar cor de botão) dispensa — mas a dispensa é **declarada** no commit: `Exec-plan: dispensado — <motivo>`. Registrar a decisão nunca é opcional (ADR-016).
3. ADR de UI (em docs/adr/) quando houver decisão difícil de reverter.
4. Implementar o menor incremento vertical.
5. Rodar lint, typecheck e testes; E2E da jornada afetada.
6. Evidência no PR: teste rodando + screenshot/gravação da jornada.

## Convenções

- Toda tarefa nasce numa worktree do(s) repo(s) da triagem (cross-repo = worktrees irmãs sob a mesma pasta da atividade); branch `ab-NNNNN-slug-curto` (sem `#`), `AB#NNNNN` no commit/PR; worktrees nativas em `C:\wt\<id>\<repo>` (raiz curta: MAX_PATH, ADR-002 do produto). **Provisório até o AB#:** o `<slug>` da tarefa faz o papel de `ab-NNNNN` (branch e pasta-pai das irmãs). No **início de cada tarefa** (e após o merge), rodar `python scripts/worktree-gc.py` — remove as worktrees já mergeadas (merge commit, squash ou rebase) e libera o disco; o `doctor.py` avisa quando há alguma ocupando espaço. **Antes do `git push`/abrir PR**, `git pull origin main` na branch — nenhuma branch abre PR atrás da main (o `worktree-gc` avisa quando a branch atual está atrás de `origin/main`).
- Workspace lado a lado: `smartinsure-backend` e `smartinsure-frontend` na mesma pasta — `../smartinsure-backend/docs/` precisa resolver (o lint valida).
- Mudança cross-repo: backend primeiro (contrato publicado), front consome — PRs linkados pelo mesmo `AB#NNNNN` (ADR-001 do produto).
- Ferramenta de IA e framework de desenvolvimento são livres: o harness valida o resultado, não a ferramenta (ADR-003 do produto). `CLAUDE.md` e equivalentes são apenas ponteiros para este arquivo.
- UI, mensagens e commits em pt-BR (Conventional Commits).

## Comandos

Preenchidos quando o scaffold do app existir — até lá, não assumir scripts inexistentes.

```
python scripts/doctor.py          # valida o ambiente e o layout de workspace
python scripts/check-harness.py   # lint do próprio harness
python scripts/worktree-gc.py     # remove worktrees de branches já mergeadas (ADR-002)
```
