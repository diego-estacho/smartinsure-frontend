# ADR-006: Design tokens e whitelabel por corretora

## Status
Aceito (dono do front)

## Contexto
O produto é whitelabel: N corretoras, cada uma com sua identidade visual, desde o dia 1. Valor visual hardcoded em componente impede a troca por tenant e provoca flash de tema na hidratação.

Opções consideradas:
1. Um build por corretora.
2. Um único build; tema por tenant via design tokens (CSS variables) e `data-theme`.

## Decisão
- **Nenhum valor visual hardcoded** em componente: cor, fonte, espaçamento, raio, sombra e movimento vêm de design tokens (CSS variables), em `styles/tokens/`.
- Whitelabel = trocar os **valores** das variáveis por tenant; `data-theme` injetado antes da hidratação (zero flash). **Um único build para N corretoras.**

## Consequências
- Uma corretora nova = novo conjunto de valores de token, sem novo build.
- Componente que hardcoda valor visual é rejeitado no review.
- Rejeitado: um build por corretora (não escala e diverge com o tempo).
