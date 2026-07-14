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

Conflito entre chat, memória e arquivos: **prevalecem os arquivos versionados**. Regra ambígua ou inexistente: **pare e registre em open-decisions.md** (camada de produto) com dono sugerido. Nunca invente regra de negócio.

## Regras de trabalho

- Vocabulário: somente termos do glossário na UI, nas rotas e nos nomes de componente/tipo de domínio.
- Types da API: SEMPRE gerados do contrato OpenAPI do backend — proibido escrever ou editar type de API à mão (o CI falha em drift).
- Status: renderizado pelo **nome estável** vindo do contrato; label/cor num único mapa por domínio. Nunca por posição ordinal.
- Nenhuma regra de negócio no cliente: dinheiro, transição de status e permissão são decididos no servidor; o front valida forma, não decisão.
- Nenhuma cor/fonte/espaçamento hardcoded em componente — só design tokens (whitelabel por corretora desde o dia 1).
- Segredo nunca em arquivo versionado; token nunca em localStorage (SECURITY do produto).
- Pasta de trabalho de framework não é versionada (ADR-004 do produto); o resultado é aterrissado nos docs.
- Cobertura mínima de 80% é gate de CI; teste sem asserção de comportamento não conta (QUALITY_SCORE do produto).
- Antes de criar abstração/utilitário novo, procurar padrão existente no repo (componente, composable, token) — utilitário compartilhado antes de helper à mão.
- Menor incremento vertical verificável; PR pequeno, um assunto.

## Fluxo por tarefa

1. Ler este arquivo + somente os docs relevantes ao tema; confirmar que nenhuma dependência está aberta em open-decisions.md (camada de produto).
2. Se a atividade toca comportamento de negócio, o primeiro passo é a RN — refinada com a PO e catalogada no backend antes do código (ferramenta de entrevista livre — ADR-003 do produto). Ajuste sem regra de negócio (layout, cor, texto já no glossário) pula direto para a implementação, mantendo o vocabulário do glossário.
3. ADR de UI (em docs/adr/) quando houver decisão difícil de reverter.
4. Implementar o menor incremento vertical.
5. Rodar lint, typecheck e testes; E2E da jornada afetada.
6. Evidência no PR: teste rodando + screenshot/gravação da jornada.

## Convenções

- Branch `ab-NNNNN-slug-curto` (sem `#`); `AB#NNNNN` no commit/PR; worktrees nativas em `C:\wt\` (ADR-002 do produto).
- Workspace lado a lado: `smartinsure-backend` e `smartinsure-frontend` na mesma pasta — `../smartinsure-backend/docs/` precisa resolver (o lint valida).
- Mudança cross-repo: backend primeiro (contrato publicado), front consome — PRs linkados pelo mesmo `AB#NNNNN` (ADR-001 do produto).
- Ferramenta de IA e framework de desenvolvimento são livres: o harness valida o resultado, não a ferramenta (ADR-003 do produto). `CLAUDE.md` e equivalentes são apenas ponteiros para este arquivo.
- UI, mensagens e commits em pt-BR (Conventional Commits).

## Comandos

Preenchidos quando o scaffold do app existir — até lá, não assumir scripts inexistentes.

```
python scripts/doctor.py          # valida o ambiente e o layout de workspace
python scripts/check-harness.py   # lint do próprio harness
```
