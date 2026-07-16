# ADR-014: Skin de componentes e fonte-de-verdade visual

## Status
Aceito (dono do front)

## Contexto
O ADR-013 criou os wrappers `Si` e, junto do ADR-006, harvestou do InsurePoint apenas os **valores** (cor de marca + fonte), declarando os componentes do template comercial de admin "não portáveis". Na prática, os wrappers ficaram como cascas quase cruas do Vuetify — `SiDataTable`, por exemplo, é `VDataTable` + `density` + `hover`, sem nenhum acabamento. O efeito colateral: as telas saem com cara de **Vuetify genérico**, divergindo do acabamento **validado em produção** do InsurePoint. A tabela foi o caso mais gritante (o InsurePoint tinha um `_table.scss`: header em CAIXA ALTA, padding de borda, densidade — nada disso existe aqui).

Em paralelo, passou a existir um **design system oficial** (pasta `design system/`, construída no claude.ai design), totalmente tokenizado. Seus tokens já coincidem com `base.css`/`tokens.ts` (verde `#22C55E`, carvão, slate, escala 4pt, raios, sombras, motion, Plus Jakarta Sans). Mas o DS **só especifica** buttons, cards, fields, pills e iconografia — **não define tabela** (ver `_ds_manifest.json`); o `README.md` do DS traz regras compatíveis (headers ALL-CAPS com letter-spacing, tabelas left-align, numéricos com `tabular-nums`, linhas densas).

Falta decidir: **de onde vem o acabamento visual** dos componentes, e **como aplicá-lo** sem reintroduzir o motor do template antigo.

## Decisão

1. **Existe uma camada de skin, aplicada globalmente.** O acabamento visual dos componentes vive em (a) `defaults` de componente do Vuetify no `nuxt.config` e (b) uma folha de overrides global consumida por `var(--si-…)` — nunca hardcoded dentro de um `.vue` (mantém ADR-006). Os wrappers `Si` continuam curados+passthrough (ADR-013); o skin não muda a API deles.

2. **O motor do template antigo não entra.** `@core/scss/template`, mixins e `@configured-variables` do InsurePoint (template comercial) permanecem fora — como já decidira o ADR-013. O que se aproveita é o **efeito** (casing de header, padding/densidade, hover, feedback de press, sensação de elevação), re-expresso em tokens do DS.

3. **Fonte-de-verdade dividida.** Layout/interação visual **validados** ← InsurePoint; **valores de marca** (cor, radius, escala de tipo, peso, identidade) ← DS. **Em conflito, o DS vence.** Onde o DS é omisso (ex.: tabela), o InsurePoint é a referência de aparência, sempre tokenizada.

4. **Refina o ADR-013.** O 013 dizia "template não portável, só valores"; isto continua verdade para o *motor*. A evolução: os **efeitos visuais validados** passam a ser recuperados como skin baseado em token — não como port de código. O §5 do 013 ("marca vence em cor/fonte, escala vence em espaçamento/raio/elevação") é estendido pela regra 3 acima para o nível de componente.

## Consequências
- O skin vive **escopado sob classes `.si-*`** (ADR-015), não em seletores globais `.v-*` — isolamento de microfrontend.
- A vitrine `/dev/ui` (ADR-013 §7) continua sendo o alvo de verificação; a evidência do skin é o **screenshot lado-a-lado** da vitrine contra o InsurePoint rodando.
- Nenhum valor visual hardcoded fora de `styles/` (ADR-006 preservado); o skin adiciona arquivo(s) em `app/assets/styles/` e `defaults` no `nuxt.config`, todos por `var(--si-…)`.
- Trocar de kit no futuro segue contido (o skin é CSS + defaults, não lógica).
- A pasta `design system/` é a referência de marca; sua relação com `tokens.ts`/`base.css` é: os tokens já foram destilados dela — o skin não reimporta o DS, apenas obedece aos tokens já espelhados.
- Rejeitados: portar o `@core` do template; hardcodar o acabamento em cada `.vue`; deixar os wrappers crus (cara de Vuetify genérico); emendar o ADR-013 em vez de registrar decisão própria.
