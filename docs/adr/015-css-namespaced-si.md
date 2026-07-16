# ADR-015: CSS namespaced com prefixo `si-` (isolamento de microfrontend)

## Status
Aceito (dono do front)

## Contexto
O skin de componentes (ADR-014) na sua primeira forma estilizou classes do Vuetify
**globalmente** (`.v-btn`, `.v-data-table th`, …). Isso funciona numa SPA isolada, mas
é um risco concreto se o front for plugado como **microfrontend**: um seletor global
`.v-btn { … }` re-estiliza *todo* botão Vuetify da página host — inclusive de outros
times/MFEs — e sofre o inverso (estilos do host vazando pra cá). O acabamento deixa de
ser propriedade do nosso design system e vira efeito colateral global.

Além disso, faltava uma regra de projeto sobre nomenclatura de classe CSS, análoga à de
código em inglês (AGENTS.md): sem prefixo, colisões de classe entre MFEs são questão de
tempo.

## Decisão

1. **Todo CSS autoral de componente é escopado sob uma classe `.si-*`.** Cada wrapper
   `Si` carrega na raiz uma classe estável (`si-button`, `si-table`, `si-card`,
   `si-chip`, `si-field`, `si-tab`, …). O skin (`app/assets/styles/skin.css`) só tem
   seletores que contêm uma `.si-*`; as classes do Vuetify (`.v-btn`, `.v-field--focused`)
   aparecem apenas como **co-classe** (`.si-button.v-btn`) ou **descendente**
   (`.si-table th`) — nunca sozinhas no escopo global.

2. **Prefixo `si-` é obrigatório para qualquer classe que a gente cria.** Não se pode
   renomear a classe do Vuetify (`.v-*` é dela), mas toda classe **nossa** — em `.css`,
   `<style>` de `.vue` ou atributo `class` que adicionamos ao wrapper — começa com `si-`.

3. **Exceção — folha de tokens.** `app/assets/styles/tokens/base.css` define `:root` e o
   corpo-base (font-family/size no `body`/`.v-application`); é infraestrutura de tokens,
   não estilo de componente, e fica fora da regra.

4. **Enforcement no harness.** `scripts/check-harness.py` (checagem #8) falha se uma folha
   autoral em `app/assets/styles` (fora de `tokens/`) tiver seletor sem `.si-*`. É regra
   de desenvolvimento, cobrada mecanicamente — como o harness fino já faz com ADRs,
   exec-plans e pastas de framework.

## Consequências
- Estende o ADR-014: o skin lá descrito passa a viver escopado sob `.si-*`.
- Estilos do design system só tocam componentes do design system; plugar como MFE não
  vaza nem sofre vazamento de/para o host.
- Custo: cada wrapper novo precisa expor sua classe `si-*` na raiz e o skin correspondente
  entra escopado. O harness cobra.
- `<style scoped>` de `.vue` já é isolado pelo Vue (atributo de dado), mas a regra do
  prefixo `si-` vale igual para classes autorais lá, por consistência e legibilidade.
- Rejeitados: estilizar `.v-*` global (vazamento de MFE); um único escopo raiz
  (`.si-app .v-btn`) — resolve o vazamento mas não dá nome semântico por componente nem
  atende ao pedido de `.si-button`/`.si-table`; adotar stylelint (dependência nova fora do
  padrão de harness fino — a checagem coube no harness Python existente).
