# ADR-019: Design system como fonte de marca + de-para de tokens

## Status
Aceito (ratificado pelo dono, 2026-07-21)

## Contexto

Existe um design system oficial do SmartInsure, autorado no Claude design e **exportado** para a
pasta `design system/` no diretório-pai do workspace (namespace `SmartInsureDesignSystem_019e0d`). Ele
traz a marca (README), os tokens (`colors_and_type.css`), os specimens (`preview/`) e **protótipos**
navegáveis (`ui_kits/web/` — dashboard do parceiro, login).

Dois problemas observados:

1. **Devs tentaram "simular" telas do DS e não conseguiram.** Causa: os protótipos são **HTML cru** —
   usam nomes de token "pelados" (`--accent`, `--fs-h1`, `--fg-muted`), elementos crus
   (`<button>`, `<input>`), ícones **Lucide** via CDN e Plus Jakarta por outro caminho. Nada disso
   existe 1:1 no app (Nuxt + Vuetify + kit `Si` + `@mdi/js` + tokens `--si-*` + tema Vuetify).
   Copiar/colar o HTML **não pode** funcionar — falta **traduzir** para o nosso stack.

2. **O DS não era fonte de verdade nomeada no harness.** A pasta ficava solta no diretório-pai, sem
   link, sem mapa de tokens e sem trava mecânica — então "seguir o DS" dependia de disciplina/skill.

Fato importante: o DS do projeto (`app/assets/styles/tokens/base.css` + `tokens.ts`) **já é uma porta
fiel** do DS exportado — os valores batem 1:1 (verde `#22C55E`, carvão `#0F172A`, `radius-md` 10px,
`fs-h1` 40px, sombras, motion, escala tipográfica). A divergência é só de **nomenclatura** (o projeto
prefixa a escala com `--si-` e integra as cores no tema Vuetify). Não é problema de valores.

## Decisão

1. **O DS exportado (`design system/`) é a fonte de verdade da marca.** Ele entra na cadeia de "Fonte
   de verdade" do [AGENTS.md](../../AGENTS.md). O que muda a marca é o DS; o `base.css`/`tokens.ts` é a
   sua implementação fiel. Quando o design no Claude mudar, re-exporta-se a pasta e reconcilia-se o
   `base.css`/`tokens.ts`.

2. **Protótipo é planta, não obra.** Todo protótipo do DS é lido como **especificação** e **traduzido**
   para o stack do app (kit `Si` + Vuetify + tokens `--si-*` + `@mdi/js`), seguindo ADR-013 (composição),
   ADR-017 (mobile-first) e ADR-018 (página fina). É **proibido** colar HTML cru do protótipo em `.vue`.

3. **O de-para é versionado.** [docs/design-system-map.md](../design-system-map.md) mantém a tabela
   de tradução (token do DS → token/tema do projeto), o mapa de ícones (Lucide → mdi) e as regras de
   tradução. É o mapa que qualquer dev/IA usa — **independe de skill**.

4. **Enforcement no repo (a trava, não a skill).** A regra "só design token, nada de valor visual
   hardcoded" (ADR-006) passa a ser **cobrada mecanicamente**: o `check-harness.py` rejeita **hex cru**
   em CSS de componente e em folhas globais fora de `styles/tokens/` (onde os hex são legítimos, por
   serem a fonte). Assim o DS é respeitado mesmo por quem não usa nenhuma skill/ferramenta de IA.

## Consequências

- Qualquer dev/IA implementa protótipo do DS pelo mesmo mapa — sem "chutar" nomes de token nem
  depender de ferramenta específica (ADR-003 do produto: harness valida resultado, não ferramenta).
- Hex cru em componente é rejeitado no `check-harness` (hoje o código passa limpo — só os dois
  arquivos de `styles/tokens/` têm hex, que são a fonte). Cor nova = token novo em `tokens.ts`/`base.css`.
- Uma **skill** por-dev pode automatizar a tradução (opcional, gitignore por ADR-003) — mas ela é
  acelerador, não requisito: a fonte, o de-para e a trava são versionados.
- Rejeitado: tratar a pasta do DS como referência informal (mantém o problema de "não consigo simular");
  rejeitado também trava de `px` cru (px estrutural — largura de drawer, coords de SVG — é legítimo;
  ficaria ruidoso; fica a cargo do review).
