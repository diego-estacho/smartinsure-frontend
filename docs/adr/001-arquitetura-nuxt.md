# ADR-001: Frontend em Nuxt 4

## Status
Aceito (dono do front)

## Contexto
O frontend precisa de um framework para a plataforma do corretor. O time tem fluência em Vue; há necessidade eventual de SSR/SEO (landing pages) e de theming por corretora (whitelabel) desde o início. A política de versão é usar a **última versão estável** de cada dependência-chave, fixada no scaffold (ver [FRONTEND.md](../FRONTEND.md)).

Opções consideradas:
1. Nuxt 4 (Vue 3.5, camada de servidor Nitro, SSR pronto).
2. Vue 3 puro (SPA, sem SSR pronto).
3. Outro ecossistema (React/Next, etc.).

## Decisão
**Nuxt 4 + Vue 3.5 + TypeScript `strict`**, com estrutura de pastas simples (ADR-003) e theming por corretora via design tokens desde o dia 1 (ADR-006).

Não há Vue 4 estável: a linha estável do Vue é a **3.5**, sobre a qual o Nuxt 4 roda; o Vue 3.6 permanece em beta e fica fora até estabilizar. Renderização universal (SSR) fica disponível (útil para landings/SEO); a modalidade por rota (SSR/SPA) é definida no scaffold.

## Consequências
- Aproveita a fluência do time em Vue.
- SSR/SEO disponível quando as landings voltarem, sem trocar de stack.
- A camada de servidor do Nuxt (Nitro) habilita o BFF (ADR-008): o browser nunca fala direto com o backend.
- As convenções de código (estrutura de pastas, Pinia só para UI, contrato de types, tokens) vivem em [docs/FRONTEND.md](../FRONTEND.md).
- Rejeitados: Vue puro (perde SSR/estrutura pronta); trocar de ecossistema (custo de aprendizado sem ganho claro para o time).
