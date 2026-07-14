# ADR-011: Gerador de types — openapi-typescript

## Status
Aceito (dono do front)

## Contexto
Os types de API são sempre gerados do contrato OpenAPI do backend, nunca escritos à mão (ADR-001 do produto; o CI falha em drift). Faltava ratificar a ferramenta de geração — era proposta em aberto na [FRONTEND.md](../FRONTEND.md).

Opções consideradas:
1. openapi-typescript (só types + um fetch fino; sem runtime pesado).
2. Geradores de cliente completos (openapi-generator, orval) — trazem SDK/runtime que não queremos acoplar.
3. Types à mão — proibido (drift silencioso, viola o contrato como fonte de verdade).

## Decisão
**openapi-typescript** como gerador, saída em `types/gen/` (nunca editada à mão — ADR-004 de UI). O acesso a dados usa um **fetch fino** tipado por esses types, sempre via composable e via BFF do Nitro (ADR-008), nunca um SDK gerado gordo.

## Consequências
- Types sempre derivados do contrato; drift vira erro de CI, não bug em produção.
- Sem runtime de cliente acoplado — a superfície é só tipo + fetch, trocável.
- `types/gen/` fica vazio até o contrato OpenAPI existir; o script de geração já entra no scaffold, apontando para o contrato do backend quando publicado.
- Rejeitados: geradores de SDK completo (acoplamento a runtime); types manuais (proibidos pelo contrato).
