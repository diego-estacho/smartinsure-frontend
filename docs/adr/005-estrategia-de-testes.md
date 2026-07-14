# ADR-005: Estratégia de testes — Vitest + Playwright

## Status
Aceito (dono do front)

## Contexto
Grandes seguradoras exigem cobertura mínima de testes. Precisamos cobrir lógica de componente/composable e as jornadas do corretor de ponta a ponta, com um gate mecânico no CI.

## Decisão
- **Vitest** para componente/composable com lógica.
- **Playwright** para E2E de jornada: o E2E das jornadas afetadas é **gate de merge**; a suíte completa roda no noturno. E2E que depende de serviço externo real usa sandbox — nunca identidade de produção.
- Cobertura mínima de **80%** é gate de CI; cobertura é piso, não alvo — teste sem asserção de comportamento não conta.
- Teste de RN de UI carrega o ID no `describe` (`describe('RN-NNN ...')`) — o mapa de rastreabilidade cruza os dois repos.

## Consequências
- A régua completa de qualidade vive no [QUALITY_SCORE.md do produto](../../../smartinsure-backend/docs/QUALITY_SCORE.md).
- Os gates reais entram no scaffold (Fase B), sem `continue-on-error`.
- Rejeitado: cobertura como alvo (vira teste sem asserção que infla número).
