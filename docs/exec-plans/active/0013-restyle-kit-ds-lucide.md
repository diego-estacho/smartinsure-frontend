# Exec-plan 0013 — Re-skin do kit `Si` pelo Design System + adoção de Lucide

> Trabalho front-only, atividade interna de fundação visual (sem `AB#`).
> Branch/worktree: `restyle-si-kit-ds` (`C:\wt\restyle-si-kit-ds\smartinsure-frontend`).
> Base de decisão: **ADR-014** (skin), **ADR-019** (DS fonte de marca + de-para) e o novo
> **ADR-021** (adotar Lucide, substitui a parte de ícones do 019). Continua o 0003 (skin).

Status: em andamento
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, os ADRs em `docs/adr/` (em especial **014**, **013**, **015**, **019**, **021**, 006, 010, 012), o DS em `../design system/` (HANDOFF.md, colors_and_type.css, `components/*.card.html` e `*.jsx`, `preview/`), e o exec-plan 0003 (skin anterior).

## Objetivo

Deixar todos os wrappers `Si` do kit `components/ui/` aderentes ao **SmartInsure Design System** (HANDOFF.md), validando cada família contra o `components/<Nome>.card.html` correspondente. Inclui: fechar as lacunas do tema global (tokens faltantes, anel de foco em todo focável), **trocar o set de ícones de `@mdi/js` para Lucide** (ADR-021) e criar o wrapper que faltava (`SiSnackbar`). Ao fim, `/dev/ui` renderiza o kit no padrão do DS, comprovado por screenshot desktop + mobile.

## Escopo

**Dentro:**
- Tema global (nuxt.config + tokens): tokens cromáticos faltantes do DS (`verde-800`/pressed, `verde-100`/tint, `border-strong`, `divider`, tints de alert, carvão elevado do snackbar, iniciais de avatar) — todos em `styles/tokens/` (ADR-006/019, o hex só é legítimo lá); anel de foco verde em **todo** elemento focável (botão, campos, checkbox, radio, switch, tabs, paginação); `text-none`/peso já ok.
- **Ícones → Lucide (ADR-021):** `lucide-vue-next`; set customizado no Vuetify + `aliases` para os `$`-internos (checkbox, radio, chevrons, close, sort, prev/next…); reescrita de `lib/icons.ts` (registry Lucide, nomes estáveis em inglês); `SiIcon` renderizando Lucide (traço 1.5); migração dos ~25 consumidores; atualização do de-para de ícones em `design-system-map.md`.
- Skin componente a componente sob `.si-*` (ADR-015), na ordem do HANDOFF §5: botões e campos → feedback → dados → superfícies. Cada wrapper ganha classe raiz `.si-*` se ainda não tiver.
- **Novo:** `SiSnackbar` (VSnackbar, superfície carvão, ação verde) — o de-para já o previa.

**Fora:** reconstruir componentes ou mudar a API curada dos wrappers (ADR-013); dark mode (ADR-013 §4); importar `@core`/mixins do template antigo (ADR-014); DS **Stepper** (fora do checklist do HANDOFF, sem wrapper); componentes de domínio (só re-skin do kit `ui/`, que as telas herdam).

## Tarefas

- [x] **Gate:** worktree (feito), exec-plan (este), ADR-021 + de-para de ícones.
- [x] Deps: `pnpm install` na worktree; `pnpm add lucide-vue-next`; remover `@mdi/js`.
- [x] Fundação de ícones: set Lucide + aliases no Vuetify; `lib/icons.ts` reescrito (deep-import por subpath + shim de tipos); `SiIcon` Lucide; migrados os ~25 consumidores; `mdi` zerado no `app/`.
- [x] Tema global: tokens faltantes em `tokens/` (verde-800/100, border-strong, divider, carvao-800, tints de alert); anel de foco do botão no `skin.css`; raio do botão fixado (`rounded="md"` não é token do Vuetify).
- [x] Campos: classe `.si-*` (checkbox/radio/switch), raio `md` do shell, anel de foco dos controles de seleção.
- [x] Ação + feedback: Button raio 10px; Alert tint+texto por variante; `SiSnackbar` criado.
- [x] Dados: Pagination (ativo verde sólido + setas prev/next + hairline + tabular); Tabs underline (label verde-800 + sublinhado 2.5px). Table mantida (validada no 0003, próxima do DS). **Tabs `segmented` fica para follow-up** (construto VBtnToggle, sem consumidor hoje).
- [x] Superfícies: ExpansionPanel (container hairline+raio, divisórias, tipografia); Avatar (iniciais tint verde-100/verde-800). Card mantido (default `elevated` validado; variantes hairline/charcoal disponíveis).
- [~] Vitrine `/dev/ui`: `SiSnackbar` adicionado; screenshots desktop + mobile em captura.

## Critérios de aceite

- `python scripts/check-harness.py` → `harness ok` (sem hex cru fora de `tokens/`, tudo sob `.si-*`, sem `mdi` órfão).
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` verdes.
- Cada família do checklist do HANDOFF §2 confere visualmente com seu `components/<Nome>.card.html`.
- Nenhum valor visual hardcoded fora de `styles/tokens/` (ADR-006); nenhum ícone `mdi` restante no `app/`.
- Screenshots da vitrine (desktop ~1280 e mobile ~390) em `docs/exec-plans/evidence/`.

## Evidências

**Gates (worktree `restyle-si-kit-ds`):**
- `pnpm typecheck` → **exit 0** (limpo).
- `pnpm lint` → **0 erros, 0 avisos**.
- `python scripts/check-harness.py` → **`harness ok`** (sem hex fora de `tokens/`; todo seletor sob `.si-*`; sem `mdi` órfão; ADR-021 e exec-plan válidos).
- `pnpm test` → **83/83** (14 arquivos).
- `pnpm build` → **`✨ Build complete!`** (client + Nitro) — confirma que os deep-imports de ícone por subpath + o set customizado + o skin compilam em bundle real.

**Nota de engenharia (ícones):** adicionar `lucide-vue-next` estourou um limite latente do `tsc`
(TS2321, "excessive stack depth") na tipagem de rotas do `$fetch` em vários composables — o barril
do Lucide (1000+ ícones num `.d.ts`) inflava o grafo de tipos. Confirmado por teste isolado (stub
sem tipos do Lucide → typecheck verde). Resolvido **na raiz**, sem tocar `api.ts`/composables:
importa-se cada ícone por subpath (`lucide-vue-next/dist/esm/icons/<nome>`) com um shim de tipos leve
(`app/types/lucide-vue-next.d.ts`); o barril nunca é carregado e o tree-shaking melhora.

**Arquivos principais tocados:**
- Ícones: `app/lib/icons.ts` (registry deep-import), `app/plugins/vuetify-icons.ts` (set + aliases),
  `app/types/lucide-vue-next.d.ts` (shim), `app/components/ui/SiIcon.vue`, `nuxt.config.ts`
  (`defaultSet: 'custom'`), ~25 consumidores migrados, `package.json` (−@mdi/js +lucide-vue-next).
- Tokens: `app/assets/styles/tokens/base.css` (verde-800/100, border-strong, divider, carvao-800,
  tints de alert).
- Skin: `app/assets/styles/skin.css` (botão raio+foco, campos raio, controles de seleção foco,
  alert por variante, snackbar, tabs, avatar, expansion panels).
- Wrappers: classes `.si-*` em SiCheckbox/Switch/RadioGroup/Radio/Avatar/ExpansionPanel(s)/Tabs/Alert;
  `SiSnackbar.vue` novo; `SiPagination.vue` (verde sólido + setas + tabular).
- Docs: ADR-021, `design-system-map.md` (de-para de ícones), `FRONTEND.md` (índice de ADRs).

**Runtime + validação visual (dev :3000):** `GET /dev/ui` → 200. Screenshots desktop (1280) e
mobile (390) em `docs/exec-plans/evidence/0013-vitrine-*.png`; recorte dos botões em
`0013-botoes-crop.png`. A revisão visual pegou e corrigiu um **bug de tamanho de ícone** (o SVG
Lucide estourava fora do box do `VIcon`) — resolvido dimensionando o SVG a `1em` via style inline
no plugin (`vuetify-icons.ts`).

**Decisões do dono (aplicadas nesta leva):**
- **Botões `secondary`/`danger` → estilo sutil do DS** (fundo branco, borda, texto colorido; só o
  primário é preenchido). Usa `!important` no skin (`.si-button--secondary/danger`) — única forma de
  vencer o utilitário `.bg-*` de cor do Vuetify, que também é `!important`.
- **Default do `SiCard` → hairline** (variant `flat` + elevation 0), alinhado ao default do DS. As
  variantes `elevated` (shadow-2) e `charcoal` (dark) seguem disponíveis.

**Aberto (sob demanda):** Tabs `segmented` — variante do DS via VBtnToggle; sem consumidor hoje, fica
para quando surgir a necessidade.
