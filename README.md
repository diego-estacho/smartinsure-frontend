# SmartInsure Frontend

Repositório do **frontend** do SmartInsure. Hoje ele carrega o **harness IA-first** — a fundação documental e mecânica que permite dev + agente trabalharem — e o código da aplicação (Nuxt 4) entra no scaffold (Fase B). O harness é uma camada do repo, não a identidade dele.

Por decisão de topologia (ADR-001 do produto), esse harness é **fino**: o domínio (glossário, RNs, decisões abertas, constituição, ADRs de produto) mora no repositório do backend e é **referenciado** daqui via workspace lado a lado — nunca duplicado (duplicar = drift garantido).

## O que tem aqui

- `AGENTS.md` — o mapa (máximo 100 linhas — o lint garante): regras locais + ponteiros para a camada de produto.
- `docs/FRONTEND.md` — convenções do front (arquitetura Nuxt 3 decidida — dono: front).
- `docs/adr/` — ADRs específicos de UI (formato Nygard, mesmo do backend; numeração própria). ADRs de produto ficam no backend.
- `scripts/check-harness.py` — lint mecânico: links quebrados, referências em prosa, AGENTS.md acima do limite, **ponteiros de workspace** (valida que `../smartinsure-backend/docs/...` resolve quando o irmão está presente; em CI vira aviso), formato dos ADRs de UI, e pasta de framework não versionada (ADR-004 do produto).
- `scripts/doctor.py` — valida o ambiente e o layout de workspace. Advisório, para o primeiro dia.
- `.github/CODEOWNERS` — roteia o review (front/design → Diego; harness → mantenedor); handles reais na criação do repo.
- Sem skills/frameworks vendorados: o harness é agnóstico (ADR-003 do produto) — cada dev usa a ferramenta que preferir no próprio ambiente.
- `azure-pipelines.yml` — CI que roda o lint hoje; gates reais (typecheck, testes, drift de types, E2E) entram no scaffold, sem `continue-on-error`.

## O que NÃO tem aqui (de propósito)

Código de aplicação — entra no scaffold (Fase B do exec-plan 0001 do produto). O modo de trabalho é **1 dev + 1 agente interativo, humano no loop, verificação mecânica no CI** ([PLANS.md do produto](../smartinsure-backend/docs/PLANS.md)).

## Contrato de workspace

Posicione este repo ao lado do `smartinsure-backend` (irmãos na mesma pasta) e rode `python scripts/check-harness.py` — os ponteiros de workspace devem resolver. Renomeie o repo irmão e rode de novo — deve avisar/falhar. Esse é o contrato que impede o front de divergir da camada de produto.
