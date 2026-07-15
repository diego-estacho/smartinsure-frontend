# Exec-plan 0002 — Design system + kit de componentes UI (`Si`)

> Trabalho front-only (+1 dia). Camada de UI, sem código de domínio (OPEN-01 aberta).
> Branch: `feat/design-system-kit-ui` (sem AB# — atividade interna de fundação).

Status: em andamento
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, os ADRs em `docs/adr/` (em especial **013**, e 003/006/010/012), o grill em `.grill/design-system-kit-ui.md`, e a camada de produto em `../smartinsure-backend/docs/`.

## Objetivo

Entregar a camada base do design system: os design tokens preenchidos com a identidade real do InsurePoint + o kit de ~30 wrappers `Si` sobre o Vuetify (ADR-013), com uma vitrine viva (`/dev/ui`) que renderiza e valida todos eles. Ao fim, dá para construir qualquer tela de layout em cima do kit — sem tocar em domínio (bloqueado pela OPEN-01).

## Escopo

**Dentro:** harvest dos valores reais do InsurePoint (cores de marca + fonte) para `tokens.ts`/`base.css` com estrutura racionalizada; wrappers `Si` (layout/shell, ação, campos, dados, feedback/overlay); família de form native-first + `maska`; vitrine `/dev/ui` (fora do build de prod); testes de comportamento dos wrappers; screenshot E2E da vitrine.

**Fora:** componentes/rotas/telas de domínio (OPEN-01); mecanismo de troca de tema em runtime e tela de config de whitelabel da corretora (só a costura fica pronta — ADR-013 §3); dark mode; i18n multi-idioma (ADR-012, UI é pt-BR fixo).

## Tarefas

### Onda 1 — tokens + shell + primitivos secos + vitrine no ar
- [x] Harvest dos valores reais do InsurePoint: cores de marca (verde `#22C55E` / slate `#64748B`) → 9 slots Vuetify + fonte Plus Jakarta Sans; espaçamento/raio/elevação/motion racionalizados na escala do `base.css` (ADR-013 §5)
- [x] Preencher `tokens.ts` (paleta padrão SmartInsure, split marca/semântica) + `base.css` (nomes em inglês — código utilitário)
- [x] Vitrine `/dev/ui` (rota fora do build de prod via `pages:extend`)
- [x] Wrappers de shell/estrutura: `SiAppBar`, `SiNavigationDrawer`, `SiDivider` (grid do Vuetify isento — ADR-013)
- [x] Wrappers de ação: `SiButton`, `SiChip`, `SiIcon`
- [x] Wrappers de dados: `SiCard`, `SiDataTable`, `SiList`, `SiListItem`, `SiBadge`, `SiAvatar`, `SiExpansionPanels`/`SiExpansionPanel`, `SiTabs`/`SiTab`
- [x] Wrappers de feedback/overlay: `SiDialog`, `SiAlert`, `SiTooltip`, `SiMenu`, `SiProgressCircular`/`SiProgressLinear`
- [x] Campos secos: `SiTextField`, `SiSelect`, `SiTextarea`, `SiCheckbox`, `SiRadioGroup`/`SiRadio`, `SiSwitch`
- [x] Testes de comportamento dos wrappers da onda 1 — smoke (todos montam) + focados (SiButton curado/passthrough, SiTextField v-model)
- [x] Migrar a landing `pages/index.vue` para usar os wrappers `Si` (`SiCard`/`SiIcon`/`SiChip`; grid mantido, é estrutural)

### Onda 2 — família pesada de form
- [x] `maska` instalada + `lib/masks.ts` (CPF/CNPJ com token alfanumérico 2026, telefone, CEP) — a diretiva `v-maska` acha o `<input>` interno do Vuetify
- [x] `SiCurrencyField` (BRL) — `VNumberInput` nativo não formatou BRL; trocado por `vue-currency-input` (decisão do dono), function-ref extrai o `<input>` interno; exibe `R$ 1.240,50`, v-model = number
- [x] `SiDateField` (`VDateInput` labs, habilitado no nuxt.config + composable de data)
- [x] `SiDocField` (documento mascarado, cpf/cnpj/auto) + `SiForm` (wrapper de VForm) + `lib/rules.ts` (required/email/cpfCnpjFormat — pt-BR)
- [x] Form de exemplo real na vitrine (composição dos campos `Si`) validando as APIs
- [x] Testes da onda 2 — `masks.spec` (CPF/CNPJ alfanumérico/CEP/telefone), `rules.spec`, SiCurrencyField (formata R$ 1.240,50), SiForm (validate reprova obrigatório vazio)

## Critérios de aceite

- `pnpm build`, `pnpm typecheck`, `pnpm lint` e `pnpm test` verdes; cobertura ≥ 80% nos wrappers (gate de CI).
- Nenhum valor visual hardcoded fora de `styles/tokens/` (ADR-006); nenhum componente Vuetify **tematizável** usado direto fora de `components/ui/` (ADR-003). Exceção: grid (`v-container`/`v-row`/`v-col`), `v-spacer` e seções de conteúdo do card — estruturais (ADR-013).
- Nenhum termo de domínio em rota/pasta/componente (respeita OPEN-01).
- `/dev/ui` fora do build de produção; screenshot E2E da vitrine como evidência.
- `python scripts/check-harness.py` verde.

## Evidências

**Onda 1 (build da camada) — concluída; testes de wrapper e migração da landing pendentes.**

Harvest: valores reais colhidos de `InsurePoint-Front/layers/shared/plugins/vuetify/theme.ts` e `layers/shared/styles/tokens/*.scss` (o InsurePoint já era um DS `--si-*` limpo). Marca = verde `#22C55E` + slate `#64748B`; fonte Plus Jakarta Sans; escalas 4pt / raios (nunca 0) / sombras neutras / motion. `success` mantido como literal próprio (não referencia `primary`) para o whitelabel não recolorir semântica (ADR-013 §3).

Wrappers criados em `app/components/ui/` (auto-import sem prefixo de pasta via `components` no nuxt.config): ~30 componentes `Si*` (curado + passthrough `$attrs`/slots, `inheritAttrs: false`).

Gates (branch `feat/design-system-kit-ui`):
- `pnpm typecheck` → exit 0.
- `pnpm lint` → exit 0, sem warnings.
- `pnpm test` → 3/3 (tokens.spec: paleta base + split marca/semântica).
- `pnpm build` → `✨ Build complete!`; rota `/dev/ui` confirmada **ausente** do `.output` de produção.

Runtime (dev server :3000, console limpo):
- `GET /dev/ui` → 200; `SiButton` renderiza `v-btn` com defaults curados (`bg-primary`, `rounded-md`, tamanhos, `bg-error`, `text-primary`, `v-btn--loading/--disabled`).
- Screenshots full-page da vitrine capturados (todos os componentes on-brand: verde de marca, cores semânticas corretas, fonte aplicada, SiDataTable com paginação, overlays, progresso).

Pendências (fora do concluído): testes de comportamento por wrapper (gate de 80%); migração da landing; `SiAppBar`/`SiNavigationDrawer` construídos mas ainda sem demo de shell na vitrine (precisam de contexto de layout).

**Onda 2 (família de form) — concluída; testes pendentes.**

Dependências: `maska` 3.2.0 (máscara) e `vue-currency-input` 3.2.2 (moeda BRL). `flatpickr`/`vuelidate` não entraram.

Verificado em runtime (dev server :3000, console limpo, screenshots):
- `SiDocField`: digitado `12abc34501de35` → `12.ABC.345/01DE-35` (máscara alfanumérica do CNPJ 2026, letras em maiúsculo). Bug corrigido em `cpfCnpjFormat` (contava só dígitos com `\D`, o que reprovava CNPJ alfanumérico — passou a remover só a pontuação e contar 11/14).
- `SiCurrencyField`: digitado `1240,5` → exibe `R$ 1.240,50` (símbolo + milhar + vírgula). `VNumberInput` nativo mostrava `1240.50` (sem milhar/vírgula) → decisão do dono de usar `vue-currency-input`.
- `SiDateField`: `VDateInput` (labs) renderiza com ícone de calendário e validação `required`.
- `SiForm` + `rules`: validação nativa dispara mensagens em pt-BR.

Gates após onda 2 (typecheck 0, lint 0, test 3/3) — mantidos verdes.

**Testes (abordagem híbrida) — 48 testes verdes.**

- Puros (happy-dom): `tokens.spec` (3), `masks.spec` (5 — inclui CNPJ alfanumérico 2026), `rules.spec` (4).
- Componente (ambiente `nuxt` via `@nuxt/test-utils`, `// @vitest-environment nuxt`): `smoke.nuxt.spec` (todos os wrappers montam, inclui composições e shell em layout) + `behavior.nuxt.spec` (SiButton defaults/override/passthrough, SiTextField v-model, SiCurrencyField formata BRL, SiForm.validate reprova obrigatório vazio).
- `vitest.config.ts` migrado para `defineVitestConfig` (permite o ambiente `nuxt` por arquivo).
- Cobertura atual: ~68% geral / ~71% linhas no kit. Abaixo dos 80% por: (a) funções de slot-forwarding não invocadas sem slots nomeados; (b) arquivos fora do kit no cálculo (vitrine `dev/ui.vue`, `index.vue`, `stores/ui.ts`, `server`). O gate de 80% segue **não forçado** no config (decisão do scaffold: ligar com código de domínio). Recomendação: ao ligar o gate, escopar/exercitar conforme necessário.
