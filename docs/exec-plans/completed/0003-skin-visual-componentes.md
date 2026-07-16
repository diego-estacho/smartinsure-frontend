# Exec-plan 0003 — Skin visual dos componentes `Si`

> Trabalho front-only, atividade interna de fundação (sem `AB#`, como o 0002).
> Branch: `feat/skin-visual-componentes`.
> Base de decisão: **ADR-014** (skin de componentes + fonte-de-verdade visual) e o
> grill em `.grill/adequacao-visual-componentes.md`.

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, os ADRs em `docs/adr/` (em especial **014**, **013**, 006, 010), o grill em `.grill/adequacao-visual-componentes.md`, o DS em `../design system/`, e o InsurePoint em `../../SmartInsure Repo/SmartInsure-Knowledge/InsurePoint-Front` (referência de aparência; ignorar `.claude/worktrees` e `@core` como motor).

## Objetivo

Dar aos wrappers `Si` o **acabamento visual** que faltava: recuperar o look & feel validado em produção do InsurePoint e re-expressá-lo com os tokens do DS (ADR-014), sem reconstruir componente nem importar o motor do template. Ao fim, `/dev/ui` renderiza os componentes com o acabamento esperado, comprovado por screenshot.

## Escopo

**Dentro:** camada de skin global — `defaults` de componente no `nuxt.config` + folha de override (`app/assets/styles/skin.css`) consumindo `var(--si-…)`; skin das famílias que estavam cruas, priorizando tabela → botões → cards → fields → resto; verificação por screenshot da vitrine.

**Fora:** reconstruir componentes ou mudar API dos wrappers; dark mode (ADR-013 §4); importar `@core`/mixins do template antigo; componentes de domínio; mudar tokens (os valores já batem com o DS).

## Tarefas

- [x] Consolidar as duas referências: specs de componente do DS (`preview/components-*.html`, `README.md`, `_ds_manifest.json`) + efeitos validados do InsurePoint (`@core/scss/template/libs/vuetify/components/_table.scss`, `plugins/vuetify/defaults.ts`).
- [x] Camada de skin: `defaults` de componente no `nuxt.config` (`vuetifyOptions.defaults`) + `app/assets/styles/skin.css` por token, carregado após `base.css`.
- [x] **Tabela** (dor confirmada): header em CAIXA ALTA (`--si-fs-caption` + `--si-ls-eyebrow`), padding de borda (`--si-space-6`), header content `space-between`, célula em `--si-fs-small`, numérico `tabular-nums`.
- [x] Ação: `SiButton`/`.v-btn` — fim da caixa-alta forçada do Vuetify (via `.v-btn.v-btn`, sem `!important`), peso 600, `scale(.98)` no press, glow verde no hover do primário. Variantes DS (primary/secondary/ghost/danger) já cobertas pela API do wrapper.
- [x] Dados/superfície: `.v-card` radius `lg`, hairline nas variantes secas, `shadow-2` na elevada; chips em pill (DS vence o `label` quadrado do InsurePoint); tabs sem caixa-alta.
- [x] Campos: foco = borda de marca + ring 3px; erro = danger + ring; família outlined/comfortable/`hideDetails:auto` via defaults.
- [x] Feedback/overlay/shell: defaults validados (`VTooltip` top, `VMenu` offset, `VSwitch` inset+ripple:false, `VList` compact, `VProgressLinear` height 6 rounded, `VNavigationDrawer` touchless, `VBadge`/`VTabs`/`VCheckbox`/`VRadio` cor primária).
- [x] Verificação: `/dev/ui` renderizado no ar (dev :3000), screenshots capturados.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok`.
- [x] `pnpm build` (✨ Build complete!), `pnpm typecheck` (exit 0), `pnpm lint` (exit 0), `pnpm test` (58/58).
- [x] Nenhum valor visual hardcoded fora de `styles/` (ADR-006) — cor por var do tema, medida por `var(--si-…)`; nenhum `@core`/mixin do template importado (ADR-014).
- [x] Screenshot da vitrine com o skin como evidência.

## Evidências

**Gates (branch `feat/skin-visual-componentes`):**
- `pnpm lint` → exit 0.
- `pnpm typecheck` → exit 0.
- `pnpm test` → **58/58** (8 arquivos).
- `pnpm build` → `✨ Build complete!` (re-rodado após o ajuste final de CSS).
- `python scripts/check-harness.py` → `harness ok`.

**Arquivos tocados:**
- `app/assets/styles/skin.css` (novo) — skin por token.
- `nuxt.config.ts` — `css` inclui `skin.css`; `vuetifyOptions.defaults` com os defaults validados.
- `docs/adr/014-skin-componentes-fonte-verdade-visual.md` (novo).

**Runtime (dev :3000, console sem erros):** `GET /dev/ui` → 200. Screenshots em `docs/exec-plans/evidence/`:
- `0003-vitrine-com-skin.png` — estado final: botões/tabs em caixa mista (DS), tabela com header uppercase + padding de borda + divisórias + paginação (look do InsurePoint recuperado), cards com hairline, campos outlined, chips pill, alerts tonais.
- `0003-vitrine-antes-fix-botao.png` — estado intermediário que expôs o problema de cascade do `.v-btn` (Vuetify uppercaseava por cima); corrigido subindo a especificidade.

**Comparação com o InsurePoint:** ancorada na **spec-fonte** lida direto (`_table.scss` e `defaults.ts`), reproduzida em tokens. A subida do InsurePoint ao vivo (:3100) não completou o build do Nitro nesta janela (app grande, provável dependência de `.env`/backend) — o lado-a-lado renderizado fica para o ambiente de review do dono, que roda o InsurePoint com dados.

**Follow-up do review (dono, 16/07):**
- **Namespacing `si-*` (novo ADR-015).** O skin foi refeito escopado sob classes `.si-*` (raiz de cada wrapper: `si-button`/`si-table`/`si-card`/`si-chip`/`si-field`/`si-tab`), corrigindo o risco de microfrontend do skin global em `.v-*`. Regra virou padrão de dev: prefixo `si-` obrigatório em classe autoral, cobrado pela **checagem #8 do `check-harness.py`** (verificada: flagra seletor sem `.si-`, exit 1) + linha no `AGENTS.md`.
- **Header da tabela cinza.** Texto no token neutro `--si-cinza` (#64748B) — neutro, não o slate de marca, pra não recolorir no whitelabel. Borda de card idem via `--si-cinza-claro`.
- **Faixa de fundo cinza no header** (comparação com a tabela de produção do InsurePoint): `.si-table thead th` recebe `--si-cinza-suave` (#F1F5F9), token neutro novo. Linhas com mais respiro (`padding-block: --si-space-3`). Screenshot `0003-tabela-header-cinza-fundo.png`.
- Screenshot final: `0003-vitrine-namespaced-header-cinza.png`. Gates re-rodados: lint 0 (após `lint:fix` de ordem de atributo) · typecheck 0 · test 58/58 · build ✨ · harness ok.
- Arquivos adicionais tocados: 11 wrappers `Si` (classe raiz `si-*`), `base.css` (tokens neutros), `scripts/check-harness.py` (#8), `docs/adr/015-css-namespaced-si.md`, `AGENTS.md`.

**Aberto para o review:** raio exato de field — o DS usa 8px, fora da escala de tokens; hoje segue o do Vuetify outlined. Registrar aqui o que o dono decidir.
