# ADR-012: i18n — pt-BR fixo

## Status
Aceito (dono do front)

## Contexto
A UI, as mensagens e os commits são em pt-BR (FRONTEND.md; convenção do produto). Faltava decidir se o front entra já com uma camada de i18n (múltiplos idiomas) ou com pt-BR fixo — era proposta em aberto na [FRONTEND.md](../FRONTEND.md).

Opções consideradas:
1. pt-BR fixo (sem framework de i18n até o negócio pedir múltiplos idiomas).
2. @nuxtjs/i18n desde o dia 1 (estrutura de tradução mesmo com um idioma só).

## Decisão
**pt-BR fixo.** Sem framework de i18n no scaffold. Texto de UI vive em pt-BR direto (ou num único mapa de strings por domínio quando fizer sentido), seguindo o glossário. Uma camada de i18n só entra quando houver requisito real de segundo idioma — e aí vira um novo ADR.

## Consequências
- Menos cerimônia: nada de chaves de tradução e arquivos de locale para um idioma só.
- Vocabulário do glossário continua sendo a fonte dos termos na UI (regra não-negociável da FRONTEND.md).
- Se o negócio pedir múltiplos idiomas, a adoção de i18n é uma decisão registrada (novo ADR) — não uma migração improvisada.
- Rejeitado: i18n desde o dia 1 (custo estrutural sem demanda).
