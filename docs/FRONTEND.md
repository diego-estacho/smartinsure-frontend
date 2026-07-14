# Convenções do frontend (smartinsure-frontend)

**Arquitetura decidida: Nuxt 4** ([ADR-001](adr/001-arquitetura-nuxt.md)). Este é o mapa operacional do front: o que a stack é, onde as coisas ficam e as regras não-negociáveis. O *porquê* de cada decisão vive nos ADRs de UI ([docs/adr/](adr/)) — este doc aponta, não duplica.

## Stack

Política de versão: a **última versão estável** de cada dependência-chave, fixada no `package.json` no scaffold.

- **Nuxt 4** + **Vue 3.5** + TypeScript `strict` ([ADR-001](adr/001-arquitetura-nuxt.md)). Não há Vue 4 estável — a linha estável é a 3.5, que já vem com o Nuxt 4.
- Camada de servidor do Nuxt (**Nitro**) como BFF: o browser nunca fala direto com o backend ([ADR-008](adr/008-bff-nitro-server-routes.md)).
- Pinia só para estado de UI; dado de servidor por composable ([ADR-002](adr/002-estado-cliente-pinia-ui.md)).
- Vitest + Playwright ([ADR-005](adr/005-estrategia-de-testes.md)).
- UI kit **Vuetify 3** ([ADR-010](adr/010-ui-kit-vuetify.md)); gerador de types **openapi-typescript** ([ADR-011](adr/011-gerador-de-types-openapi.md)); **pt-BR fixo**, sem i18n ([ADR-012](adr/012-i18n-ptbr-fixo.md)).

## Estrutura de pastas ([ADR-003](adr/003-estrutura-de-pastas-simples.md))

```
pages/            # rotas — nomes do glossário (/ofertas, /apolices)
components/
  ofertas/        # componentes do domínio (OfertaWizard.vue, CotacaoCard.vue)
  ui/             # básicos sem domínio (botão, modal, tabela)
composables/      # useOfertas(), useCotacoes() — acesso a dados por domínio
stores/           # Pinia: estado de UI apenas
types/gen/        # types GERADOS do contrato OpenAPI — nunca editar à mão
styles/tokens/    # design tokens: cores, tipografia, espaçamento, raio, elevação, movimento
```

Um domínio novo = o mesmo desenho.

## Regras não-negociáveis

- **Vocabulário:** só termos do glossário na UI, nas rotas e nos nomes de componente/tipo de domínio (`OfertaWizard`, nunca `QuoteWizard`).
- **Nenhuma regra de negócio no cliente:** cálculo, transição de status, permissão e validação de dinheiro decididos no servidor (SECURITY do produto); o front valida forma (obrigatório, formato, máscara), nunca decisão.
- **Nenhum valor visual hardcoded:** só design tokens ([ADR-006](adr/006-design-tokens-whitelabel.md)).
- **Contrato:** types de API sempre gerados do contrato, nunca à mão (ADR-001 do produto); status por nome estável, acesso a dados só por composable ([ADR-004](adr/004-consumo-do-contrato-status-por-nome.md)).
- **Backend só via BFF:** composable chama `server/api/` do Nitro, nunca o backend .NET direto ([ADR-008](adr/008-bff-nitro-server-routes.md)).
- **Ícones** centralizados num módulo único (`lib/icons.ts`) — sem SVG inline espalhado pelos componentes.
- **Sessão:** token nunca em `localStorage`; cookie httpOnly, guarda de rota em middleware ([ADR-007](adr/007-estrategia-de-sessao.md)).
- **Testes:** cobertura 80% é gate de CI; teste de RN carrega o ID no `describe` ([ADR-005](adr/005-estrategia-de-testes.md)); E2E autentica via dev-auth gated por env, proibido em produção ([ADR-009](adr/009-dev-auth-bypass-testes.md)).
- UI, mensagens e commits em pt-BR.

## Decisões de UI (ADRs)

O log de decisões do front é o próprio diretório [docs/adr/](adr/) — uma decisão por arquivo, formato Nygard. Decisão registrada só muda com novo ADR.

| ADR | Decisão |
|---|---|
| [001](adr/001-arquitetura-nuxt.md) | Frontend em Nuxt 4 |
| [002](adr/002-estado-cliente-pinia-ui.md) | Estado: Pinia só para UI |
| [003](adr/003-estrutura-de-pastas-simples.md) | Estrutura de pastas simples |
| [004](adr/004-consumo-do-contrato-status-por-nome.md) | Consumo do contrato: status por nome estável |
| [005](adr/005-estrategia-de-testes.md) | Estratégia de testes |
| [006](adr/006-design-tokens-whitelabel.md) | Design tokens e whitelabel |
| [007](adr/007-estrategia-de-sessao.md) | Estratégia de sessão |
| [008](adr/008-bff-nitro-server-routes.md) | BFF no servidor Nuxt (Nitro) |
| [009](adr/009-dev-auth-bypass-testes.md) | Dev-auth (bypass para testes, gated por env) |
| [010](adr/010-ui-kit-vuetify.md) | UI kit: Vuetify 3 (tema por design tokens) |
| [011](adr/011-gerador-de-types-openapi.md) | Gerador de types: openapi-typescript |
| [012](adr/012-i18n-ptbr-fixo.md) | i18n: pt-BR fixo |
