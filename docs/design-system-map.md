# Design system — mapa de tradução (de-para)

Este doc conecta o **design system exportado** (`design system/` no diretório-pai, autorado no Claude
design) ao **stack do app** (Nuxt + Vuetify + kit `Si` + tokens `--si-*` + `@mdi/js`). É o mapa que
qualquer dev/IA usa para implementar telas e protótipos do DS **sem chutar**. Decisão em
[ADR-019](adr/019-design-system-fonte-e-de-para.md).

> **Regra de ouro:** protótipo do DS é **planta, não obra**. Leia-o como especificação e **traduza**
> para o kit `Si` + tokens do projeto. Nunca cole HTML cru do protótipo num `.vue`.

## Onde o DS vive

- Pasta: `../design system/` (irmã do repo). Fonte de marca (ADR-019).
- Peças: `README.md` (marca/voz), `colors_and_type.css` (tokens), `preview/` (specimens),
  `ui_kits/web/` (protótipos: `index.html` dashboard, `login.html` login), `_ds_manifest.json`
  (inventário de tokens/cards), `SKILL.md` (skill de geração de HTML).
- Claude design: a URL do design é a origem; a pasta local é o **export** dela (mesmo namespace
  `019e0d…`). Trabalhamos do arquivo local (versionável, offline, "lintável"); quando o design mudar,
  re-exporta-se a pasta e reconcilia-se `base.css`/`tokens.ts`.

## Como implementar um protótipo (passo a passo)

1. **Triagem (Passo 0 do AGENTS.md):** o protótipo é só-visual ou embute fluxo/domínio/permissão? Se
   embute (ex.: "workspace picker" = multi-corretora), a parte de fluxo é **cross-repo** (contrato no
   backend primeiro) — só o visual entra como front-only.
2. **Traduza os tokens** pela tabela abaixo. Cor sempre por token/tema; nunca hex cru (o
   `check-harness` rejeita).
3. **Troque elementos crus pelo kit `Si`** (ADR-013): `<button>`→`SiButton`, `<input>`→`SiTextField`,
   card→`SiCard`, etc. Página fina orquestra; cada bloco vira componente de domínio (ADR-018).
4. **Use os ícones Lucide** (`lucide-vue-next`, tabela abaixo), re-exportados em `lib/icons.ts` (ADR-021). Ícone do protótipo → mesma peça Lucide no projeto (traço 1.5); sem tradução para outro set.
5. **Mobile-first** (ADR-017): grids densos (KPIs 4-col, split 2fr/1fr) empilham no mobile.
6. **Gates + evidência:** `check-harness` + `lint` + `typecheck`; screenshot desktop **e** mobile.

## De-para de tokens (DS → projeto)

### Cores — o DS usa hex/apelidos; o app usa o **tema Vuetify** (`rgb(var(--v-theme-*))`) ou o token neutro

| DS (`colors_and_type.css`) | Projeto | Uso |
|---|---|---|
| `--si-verde` / `--accent` | `color="primary"` ou `rgb(var(--v-theme-primary))` | ação primária, acento, marca |
| `--accent-hover` | `rgb(var(--v-theme-primary-darken-1))` | hover do CTA |
| `--si-carvao` / `--bg-inv` | `color="charcoal"` ou `rgb(var(--v-theme-charcoal))` | superfície escura (menu, hero, card escuro) |
| texto sobre carvão | `rgb(var(--v-theme-on-charcoal))` | — |
| `--si-fundo` / `--bg` | `rgb(var(--v-theme-background))` | fundo do app |
| `--si-branco` / `--bg-elev` | `rgb(var(--v-theme-surface))` | superfície de card |
| `--fg` | `rgb(var(--v-theme-on-surface))` | texto principal |
| `--fg-muted` / `--si-cinza` | `var(--si-cinza)` ou `rgba(var(--v-theme-on-surface), 0.6–0.72)` | texto secundário |
| `--border` / `--si-cinza-claro` | `var(--si-cinza-claro)` | hairline, divisória, borda de card |
| `--success` / `--warning` / `--danger` / `--info` | `color="success|warning|error|info"` (tema) | estados semânticos (⚠️ `danger`→`error`) |

### Escala (espaço, raio, tipografia, sombra, motion) — **mesmo valor, só prefixa `--si-`**

| DS | Projeto |
|---|---|
| `--space-N` | `--si-space-N` |
| `--radius-xs…pill` | `--si-radius-xs…pill` |
| `--fs-* / --lh-* / --ls-*` (display, h1–h4, body, small, caption, eyebrow) | `--si-fs-* / --si-lh-* / --si-ls-*` |
| `--fw-regular/medium/semibold/bold` | `--si-font-weight-regular/medium/semibold/bold` |
| `--shadow-1/2/3/glow` | `--si-shadow-1/2/3/glow` |
| `--dur-fast/base/slow`, `--ease-out/in-out` | `--si-dur-*`, `--si-ease-*` |
| `--font-sans` / `--font-mono` | `--si-font-family` / `--si-font-mono` |

Os valores são idênticos (conferido: `fs-h1` 40px, `radius-md` 10px, `space-4` 16px, sombras, motion).

### Ícones (Lucide — `lucide-vue-next`, re-exportar em `lib/icons.ts`) — ADR-021

O ícone do protótipo é a **mesma peça Lucide** no app. `lib/icons.ts` mapeia um **nome estável em inglês**
(chave do projeto) para o componente `lucide-vue-next`; o `SiIcon` e o set customizado do Vuetify resolvem
por essa chave. Ícone novo entra no registry de `lib/icons.ts`.

| DS (Lucide) | Componente `lucide-vue-next` | Chave no projeto |
|---|---|---|
| `layout-dashboard` | `LayoutDashboard` | `dashboard` |
| `file-text` | `FileText` | `fileText` |
| `shield-check` | `ShieldCheck` | `shieldCheck` |
| `building-2` | `Building2` | `building` |
| `users` / `user` / `user-round` | `Users` / `User` / `UserRound` | `users` / `user` / `userRound` |
| `user-plus` | `UserPlus` | `userPlus` |
| `key-round` | `KeyRound` | `keyRound` |
| `chart-column` (ex `bar-chart-3`, renomeado no Lucide 1.0) | `ChartColumn` | `barChart` |
| `settings` | `Settings` | `settings` |
| `search` | `Search` | `search` |
| `filter` | `Filter` | `filter` |
| `bell` | `Bell` | `bell` |
| `help-circle` | `CircleHelp` | `helpCircle` |
| `log-in` / `log-out` | `LogIn` / `LogOut` | `logIn` / `logOut` |
| `trending-up` / `trending-down` | `TrendingUp` / `TrendingDown` | `trendingUp` / `trendingDown` |
| `check` | `Check` | `check` |
| `x` | `X` | `close` |
| `chevron-down/left/right/up` | `ChevronDown/Left/Right/Up` | `chevronDown/Left/Right/Up` |
| `chevrons-left/right` | `ChevronsLeft/Right` | `chevronsLeft/Right` |
| `eye` / `eye-off` | `Eye` / `EyeOff` | `eye` / `eyeOff` |
| `pencil` | `Pencil` | `pencil` |
| `plus` | `Plus` | `plus` |
| `trash-2` | `Trash2` | `trash` |
| `calendar` | `CalendarDays` | `calendar` |
| `info` / `circle-check` / `triangle-alert` / `circle-x` | `Info` / `CircleCheck` / `TriangleAlert` / `CircleX` | `info` / `circleCheck` / `alertTriangle` / `circleX` |

Os `$`-internos do Vuetify (checkbox, radio, `dropdown`, `prev`/`next`, `sortAsc`, `clear`, `expand`…) são
remapeados por `aliases` para chaves Lucide (ADR-021 §2). Peça Lucide sem par óbvio: escolha a mais próxima
em forma e registre aqui.

## Elementos crus → kit `Si` (ADR-013)

| Protótipo (HTML) | Componente `Si` |
|---|---|
| `<button class="pill-btn/btn">` | `SiButton` (`color`, `variant`, `size`, `:prepend-icon`) |
| `<button class="iconbtn">` (ação de linha, ícone só) | `SiIconButton` (`:icon`, `tone="view"` = hover verde; ativador de SiMenu/SiTooltip via `v-bind="props"`) |
| `<input>` | `SiTextField` (`:prepend-inner-icon`, `:rules`) |
| card / `.panel` / `.kpi` | `SiCard` (`variant="outlined"` p/ hairline; `charcoal` p/ card escuro) |
| status pill | `SiChip` (`color`, `size`) |
| `<i data-lucide>` | `SiIcon :icon="<chave-lucide>"` (ADR-021) |
| `.toast` | `SiSnackbar` |
| popover / menu | `SiMenu` |
| trilha de etapas (`Stepper.jsx`) | `SiStepper` (`:steps`, `v-model:current`, `orientation`, `clickable`) — componente próprio (o Vuetify não tem primitivo equivalente ao dot-stepper do DS) |

## Voz (do README do DS)

pt-BR, **você** (formal-caloroso), **sentence case** ("Nova apólice", não "Nova Apólice"), sem emoji,
sem diminutivo, métrica concreta (R$/%/dias). Wordmark sempre minúsculo: "smartinsure".
