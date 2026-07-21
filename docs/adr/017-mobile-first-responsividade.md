# ADR-017: Mobile-first e estratégia responsiva

## Status
Aceito (ratificado pelo time, 2026-07-20).

## Contexto
O SmartInsure é operado por corretor e tomador tanto em desktop quanto em celular; a jornada precisa ser boa em qualquer dispositivo. Componentes densos do domínio de seguros (tabelas de listagem, formulários longos, toolbars com filtros) não cabem bem em telas pequenas e, sem uma premissa, cada tela resolve isso ad hoc (o `corretoras/index.vue` já tinha `@media` pontual com número mágico). Nenhum dos ADRs de UI (001–016) fixa responsividade. O Vuetify já expõe breakpoints e `useDisplay()` (o `shell.vue` usa `mobile`), o que dá uma fonte única de verdade para os limites.

## Decisão

1. **Mobile-first como premissa.** Desenha-se do menor para o maior: o layout base é o mobile e o desktop é *progressive enhancement*. Toda tela nova nasce pensando os dois estados.

2. **Breakpoints via Vuetify (`useDisplay()`), não números mágicos.** A decisão de layout por tamanho usa `useDisplay()` no script (`mobile`, `smAndDown`, `mdAndUp`…). Quando for inevitável CSS, usar os mesmos limites do Vuetify — nunca um `@media (max-width: 713px)` arbitrário. `mobile` = `< md` (960px) por padrão.

3. **Padrões de fallback para componentes densos:**
   - **Tabela → cards no mobile:** listagem vira uma lista de cards empilhados (rótulo + valor por registro). Proibido scroll horizontal de tabela no celular.
   - **Ações de linha → agrupadas no mobile** (menu/bottom-sheet) em vez de vários botões lado a lado.
   - **Toolbar/filtros → empilham** no mobile; navegação lateral usa drawer temporário (o `shell.vue` já faz).
   - **Formulário → uma coluna** no mobile, múltiplas colunas no desktop via grid do Vuetify.

4. **Toque e overflow.** Alvos de toque confortáveis (~44px) nos controles primários; o `body` nunca rola na horizontal — conteúdo largo rola dentro do próprio container.

5. **Verificação em dois viewports.** Toda entrega com UI nova traz evidência em **mobile (~390px)** e **desktop**; o E2E da jornada afetada roda nos dois tamanhos.

6. **Sem valor hardcoded.** Espaçamento, tamanho e raio por token (ADR-006); nada de px mágico para adaptar layout.

## Consequências
- Componentes densos ganham uma variação mobile — ex.: `BrokeragesTable` (tabela no desktop, cards no mobile) é o **exemplo de referência**, entregue junto desta decisão.
- Custo por tela: pensar os dois estados desde o início — mais barato que refazer depois.
- A régua de evidência de PR/exec-plan passa a incluir o viewport mobile.
- Consome ADR-006 (tokens), ADR-010 (Vuetify/`useDisplay`), ADR-013 (kit `Si`), ADR-018 (componentização — onde a variação responsiva mora).
- Rejeitado: desktop-first com "ajeita depois"; scroll horizontal de tabela no mobile; `@media` com breakpoints mágicos fora da escala do Vuetify.
