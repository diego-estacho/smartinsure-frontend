# ADR-002: Estado do cliente — Pinia só para UI

## Status
Aceito (dono do front)

## Contexto
O front precisa de uma política de estado no cliente. O risco conhecido é duplicar dado de servidor numa store: ela vira segunda fonte de verdade e dessincroniza do backend.

Opções consideradas:
1. Store global (Pinia) para tudo, inclusive dado de servidor.
2. Pinia só para estado de UI; dado de servidor por composable de fetch com cache.
3. Sem store — só composables.

## Decisão
**Pinia SOMENTE para estado de UI** (wizard, sidebar, filtros). Dado de servidor vem por composable de fetch com cache (`useOfertas()`, `useCotacoes()`) — nunca duplicado em store.

## Consequências
- Uma fonte de verdade para dado de servidor: o backend, via composable com cache.
- Store com dado de domínio é proibida — evita drift entre store e servidor.
- Rejeitado: Pinia para dado de servidor (dessincroniza nas primeiras semanas).
