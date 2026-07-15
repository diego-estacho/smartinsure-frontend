# ADR-013: Camada de componentes UI (kit `Si`)

## Status
Aceito (dono do front)

## Contexto
Com Vuetify 3 como kit (ADR-010) e o tema dirigido por design tokens (ADR-006), falta definir **como** a camada `components/ui/` (ADR-003) encapsula o Vuetify: filosofia de wrapper, nomenclatura, escopo do primeiro kit, tratamento de formulário e como isso será verificado. O produto é o antigo InsurePoint, refeito do zero em Nuxt 4; o InsurePoint foi construído sobre um **template comercial** de admin do Vuetify — logo, os componentes de lá **não são portáveis**: aqui a camada é criada, aproveitando apenas os **valores** (cores, fonte) da identidade real do InsurePoint. O entregável é o kit em si, para destravar a construção de telas em cima dele. Trabalho front-only, sem dependência da OPEN-01 (o kit é UI utilitária, não domínio).

## Decisão

1. **Filosofia de wrapper — curado + passthrough.** Cada `ui/` fixa os *defaults* de design (cor, variante, tamanho, estado) como API própria e curada; repassa o resto via `v-bind="$attrs"` + slots livres para o componente Vuetify. Contrato estável no que é política de design e blinda troca de lib; liberdade no detalhe.

2. **Nomenclatura — prefixo `Si` (PascalCase).** `SiButton`, `SiTextField`, `SiDataTable`, `SiDialog`. Não `SI` (ambiguidade de fronteira no PascalCase do ESLint). Utilitário → inglês (o domínio, esse sim em pt-BR do glossário — não se aplica a `ui/`). **Todo componente no template usa PascalCase, inclusive os do Vuetify** (`VAlert`, não `v-alert`) — imposto pelo lint (`vue/component-name-in-template-casing` com `registeredComponentsOnly: false`). Diretivas (`v-model`, `v-if`, `v-bind`) seguem em kebab, como manda o Vue.

3. **Whitelabel = só cor de marca.** A corretora troca apenas `primary`/`secondary` + logo (futuro: via `themeConfig` no backend, reaplicado no tema em runtime). As cores **semânticas** (`success`/`warning`/`error`/`info`) são lei da plataforma e não são whitelabel. Agora constrói-se só a **costura** (cor sempre por token do tema, nunca hex); o mecanismo de troca em runtime fica para quando existir a tela de config.

4. **Tema — só claro.** Dark mode fica fora por ora; a disciplina "cor por token, nunca hex" mantém barato ligá-lo depois.

5. **Valores — marca fiel, estrutura racionalizada.** Cores e fonte reais do InsurePoint são trazidas fiéis (identidade). Espaçamento, raio e elevação são encaixados na escala limpa já definida (`base.css`, 4pt), sem reproduzir valores ad-hoc do template. Em conflito: marca vence em cor/fonte, escala vence em espaçamento/raio/elevação.

6. **Formulário — Vuetify-native-first.** Data via `VDateInput` (labs, habilitado no nuxt.config), validação via `rules` nativo (sem vuelidate por ora). Máscara (CPF/CNPJ/telefone/CEP) via **`maska`** — leve, com token alfanumérico e máscara dinâmica (o CNPJ passa a ser alfanumérico em 2026). Moeda BRL via **`vue-currency-input`**: o `VNumberInput` nativo não formata BRL com milhar/vírgula ("R$ 1240.50"), então a exceção prevista foi acionada — a lib é escondida pelo `SiCurrencyField` (v-model = number), troca contida. O "formulário" é composição dos campos `Si`, não um componente monolítico.

7. **Vitrine viva.** Uma rota interna (`/dev/ui`), fora do build de produção e versionada, renderiza todos os componentes: é o consumidor que valida as APIs, o alvo do screenshot E2E (evidência de PR) e a documentação viva do kit.

## Consequências
- Escopo do primeiro kit: ~30 wrappers cobrindo o que a plataforma de fato usa (layout/shell, ação, campos, dados, feedback/overlay), construído em duas ondas dentro do mesmo esforço — (1) tokens + shell + primitivos secos + vitrine no ar; (2) família de form plugada num form real na vitrine.
- Nenhum `v-card`/`v-btn`/hex espalhado pela plataforma: telas dependem da camada `Si`, nunca de um componente Vuetify **tematizável** direto — troca de kit no futuro fica contida.
- **Exceção — primitivos estruturais de layout:** o grid do Vuetify (`v-container`/`v-row`/`v-col`) e `v-spacer` podem ser usados direto em qualquer página. São estrutura, não têm superfície de design a curar (cor/variante/estado), e envolvê-los não daria blindagem — só verbosidade. As seções de conteúdo do card (`v-card-title`/`v-card-text`/`v-card-actions`/`v-card-item`) são usadas dentro de `SiCard` para compor seu conteúdo.
- Cobertura de 80% (gate de CI) vale para os wrappers: os testes asseguram comportamento observável (default de design aplicado, cor por token, passthrough de `$attrs`/slots, mapeamento das props curadas).
- Consome ADR-003 (pasta `ui/` e direções de import), ADR-006 (tokens/whitelabel), ADR-010 (Vuetify), ADR-012 (UI em pt-BR fixo — sem i18n multi-idioma do template antigo).
- Dependências de form adicionadas: `maska` (máscara) e `vue-currency-input` (moeda BRL). `flatpickr` e `vuelidate` do stack antigo NÃO entraram (data = `VDateInput`, validação = `rules` nativo).
- Rejeitados: casca 100% fina (vaza a API do Vuetify) ou API 100% curada (engessa); prefixo `SI`/sem prefixo; dark mode de dia 1; `VNumberInput` nativo para BRL (não formata milhar/vírgula); vitrine descartável; catálogo completo do template.
