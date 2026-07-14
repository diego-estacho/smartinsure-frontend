# ADR-010: UI kit — Vuetify 3

## Status
Aceito (dono do front)

## Contexto
O front precisa de um kit de componentes para acelerar a UI da plataforma do corretor, sem abrir mão do whitelabel por corretora (ADR-006: nenhum valor visual hardcoded, só design tokens). Era proposta em aberto na [FRONTEND.md](../FRONTEND.md), a ratificar no início do scaffold.

Opções consideradas:
1. Vuetify 3 (Material 3, cobertura ampla de componentes, tema programático).
2. PrimeVue / Naive UI (bons, mas tema menos alinhado ao nosso pipeline de tokens).
3. Sem kit (componentes próprios desde o zero — custo alto, sem ganho no início).

## Decisão
**Vuetify 3** como UI kit, com o **tema dirigido pelos design tokens** (ADR-006): as cores/tipografia/raio/elevação do tema Vuetify são lidas de `styles/tokens/`, nunca hardcoded no componente. A troca de corretora troca os tokens, não o código.

## Consequências
- Cobertura de componentes pronta; o time foca no domínio, não em reinventar botão/modal/tabela.
- O whitelabel continua válido: o tema é uma função dos tokens (um único ponto de verdade visual).
- Componentes básicos sem domínio ficam em `components/ui/` (ADR-003), encapsulando o Vuetify — o resto do app depende da nossa camada, não diretamente do kit.
- Rejeitados: outros kits (tema fora do nosso pipeline de tokens); sem kit (custo sem retorno no início).
