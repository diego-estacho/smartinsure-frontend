# ADR-021: Iconografia em Lucide (substitui `@mdi/js`)

## Status
Aceito (dono do front, 2026-07-22). Refina e **substitui a parte de ícones** do [ADR-019](019-design-system-fonte-e-de-para.md) (§3, mapa Lucide→mdi). O restante do 019 (DS como fonte de marca, protótipo-é-planta, trava de hex) permanece.

## Contexto

O Design System oficial (pasta `../design system/`) foi autorado com **Lucide** — traço 1.5px, cantos arredondados: é a linguagem de ícone da marca, presente nos protótipos (`ui_kits/web/`), nos specimens (`preview/iconography.html`) e no `HANDOFF.md` (§3: "Set: Lucide").

O [ADR-019](019-design-system-fonte-e-de-para.md) §3, para não introduzir dependência nova, decidiu **traduzir** Lucide → `@mdi/js` via de-para versionado, e o [lib/icons.ts](../../app/lib/icons.ts) re-exportava `mdi*`. Na prática o mdi **aproxima** a forma, mas não reproduz o traço/peso do Lucide — diverge do acabamento validado no DS. O dono decidiu **adotar Lucide de fato** (fidelidade total ao DS, ao custo de uma dependência e da migração dos consumidores), em vez de manter a aproximação.

Restrição de stack: o `SiIcon` renderiza via Vuetify, e vários componentes Vuetify desenham ícones **internos** (`$checkboxOn`, `$dropdown`, `$prev`/`$next`, `$sortAsc`, `$close`…). Trocar o set só no `SiIcon` deixaria os internos em mdi — a troca tem de ser no **set padrão do Vuetify**.

## Decisão

1. **Lucide é o set de ícones do projeto**, via `lucide-vue-next` (ícones são componentes Vue, tree-shakeable). Substitui `@mdi/js` (removido das deps).

2. **Set customizado no Vuetify + aliases.** `vuetifyOptions.icons.defaultSet = 'lucide'`, com um `IconSet` que resolve o nome do ícone para o componente Lucide (traço 1.5, `currentColor`). Os `$`-internos do Vuetify são remapeados por `aliases` para nomes Lucide (checkbox, radio, chevrons, close, sort, prev/next, etc.). Assim o kit inteiro — inclusive internos — fala Lucide.

3. **`lib/icons.ts` continua a centralização única** (ADR-003, FRONTEND §Ícones): re-exporta os ícones Lucide usados sob **nomes estáveis em inglês**; nenhum SVG inline espalhado em componente. Ícone novo entra aqui.

4. **`SiIcon` renderiza Lucide** com traço 1.5 e tamanhos do HANDOFF §3 (24 padrão / 20 inline / 16 linha densa de tabela); cor por `currentColor` (ativo `primary`, inativo `--si-cinza`), mantendo a API curada do wrapper (ADR-013).

5. **De-para atualizado.** A tabela de ícones em [design-system-map.md](../design-system-map.md) passa a mapear **DS (Lucide) → nome Lucide no projeto** (fim do Lucide→mdi). O de-para continua versionado e independe de skill (ADR-019 §3, agora sobre Lucide).

## Consequências

- Fidelidade ao DS: mesmo traço/peso do protótipo, sem aproximação de forma.
- Bundle: só os ícones re-exportados em `lib/icons.ts` entram (tree-shaking do `lucide-vue-next`), como já era com `mdi-svg`.
- Migração: ~25 consumidores (`lib/icons.ts`, `SiIcon`, vitrine, páginas, shell, mapas de status) e os `aliases` internos do Vuetify. Feita nesta leva (exec-plan 0013).
- Whitelabel intacto: ícone não é cor de marca; a troca não mexe no tema (ADR-006/013).
- `@mdi/js` sai do `package.json`; `mdi*` deixa de existir no `app/`.
- Rejeitados: manter a aproximação mdi (perde o traço do DS); usar os dois sets (inconsistência visual); trocar só no `SiIcon` (deixa os internos do Vuetify em outro set).
