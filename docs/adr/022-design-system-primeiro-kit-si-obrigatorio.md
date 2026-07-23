# ADR-022: Design system primeiro — toda tela usa o kit `Si` (vitrine `/dev/ui` como catálogo vivo)

## Status
Aceito (dono do front, 2026-07-22). Consolida o **procedimento de construção de tela** sobre o kit já existente: [ADR-013](013-camada-de-componentes-ui-si.md) (camada `Si`), [ADR-014](014-skin-componentes-fonte-verdade-visual.md) (skin), [ADR-015](015-css-namespaced-si.md) (namespacing `.si-*`), [ADR-018](018-pagina-fina-componentes-dominio.md) (página fina), [ADR-017](017-mobile-first-responsividade.md) (mobile-first) e [ADR-019](019-design-system-fonte-e-de-para.md) (DS fonte de marca / protótipo-é-planta). É o "como construir tela" que amarra os anteriores.

## Contexto

O kit `Si` (`app/components/ui/`) foi re-skinnado à risca pelo Design System (exec-plan 0013): campos (rótulo estático acima), botões, tabela, chips, checkbox/radio desenhados, tabs, avatar, **stepper**, paginação, calendário, alerts, etc. — cada família validada contra o `components/<Nome>.card.html`/`.jsx` do DS e **medida** (Playwright).

A vitrine `/dev/ui` (rota só-dev, ADR-013 §7) renderiza o kit inteiro no padrão do DS. Na prática ela virou o **catálogo vivo** — a referência de "o que existe e como se usa", complementando o de-para textual ([design-system-map.md](../design-system-map.md)).

As telas de produto vão ser prototipadas no Claude design, mas **nem toda tela terá protótipo pronto** quando for implementada. Sem uma regra, cada dev/IA reinventa (elemento HTML cru, estilo ad-hoc, acabamento one-off na página) e a UI diverge do DS — o mesmo problema que o ADR-019 atacou no nível de **token**, agora no nível de **componente**. O dono determinou que a construção de tela seja **DS-first por procedimento**, para qualquer dev (não depender de disciplina/ferramenta).

## Decisão

1. **DS-first é obrigatório em toda tela** (nova ou alterada): a UI é composta a partir do kit `Si` + tokens `--si-*`/tema (ADR-006). Não se usa elemento HTML cru estilizado à mão (`<button>`, `<input>`, tabela crua…) nem valor visual hardcoded na página.

2. **Com ou sem protótipo, o kit é o mesmo.**
   - **Com protótipo (Claude design):** protótipo é planta, não obra (ADR-019) → **traduz** para o kit `Si` pelo de-para; nunca cola HTML cru do protótipo no `.vue`.
   - **Sem protótipo:** monta a tela com os componentes do kit seguindo os padrões do DS. A ausência de protótipo **não** libera inventar componente/estilo — o catálogo (`/dev/ui`) e o de-para já dizem o que usar e como.

3. **A vitrine `/dev/ui` é o catálogo vivo do DS** e a **primeira parada** antes de construir tela: ver qual componente `Si` cobre a necessidade e como se usa (variantes, props, estados). Todo componente do kit aparece lá (ADR-013 §7); o [design-system-map.md](../design-system-map.md) dá o de-para textual (elemento/protótipo → componente `Si`).

4. **Componente que falta entra no kit primeiro.** Se a tela precisa de algo que o kit não tem, cria-se o componente `Si` **antes** de usá-lo na tela: wrapper Vuetify curado (ADR-013) — ou componente apresentacional próprio quando o Vuetify não tem primitivo equivalente (ex.: `SiStepper`) — com skin token-driven (ADR-014), namespacing `.si-*` (ADR-015), entrada na **vitrine** e no **de-para**. É **proibido** o acabamento "one-off" na página que deveria morar no kit (senão o próximo dev que copiar a tela diverge).

5. **Página fina + domínio em componente** (ADR-018) e **mobile-first** (ADR-017) continuam valendo: a página orquestra dados e compõe blocos de domínio (ADR-018), que por sua vez usam o kit `Si`. Regra de negócio nunca no cliente (SECURITY do produto).

6. **Procedimento para todo mundo.** Este fluxo vale para qualquer dev/IA e independe de ferramenta (ADR-003 do produto: o harness valida o resultado, não a ferramenta). Entra no **gate de entrada** do [AGENTS.md](../../AGENTS.md) (Regras de trabalho / Fluxo por tarefa), para ser lido antes de qualquer tela.

## Consequências

- **Consistência visual:** toda tela herda o acabamento do DS automaticamente; mudança no kit/skin propaga para todas as telas (provado nesta leva — ex.: neutralizar o ícone da tabela ou o dia do calendário valeu em todo lugar).
- **O kit cresce pela porta certa:** por necessidade real de tela, sempre como wrapper/apresentacional + skin + vitrine + de-para — nunca por gambiarra de página.
- **Onboarding:** dev novo abre `/dev/ui` + `design-system-map.md` e já sabe o que usar; o review cobra o uso do kit.
- **Enforcement:** o `check-harness` já trava hex cru (ADR-019) e exige `.si-*` (ADR-015) — cobre o **acabamento** mesmo sem skill. A **composição** (usar o kit em vez de elemento cru) fica no review, guiada por este ADR.
- **Rejeitado:** DS "recomendado mas opcional" (volta a divergir tela a tela); permitir acabamento one-off na página "por pressa" (o custo se paga no próximo que copiar a tela); exigir protótipo do Claude design para toda tela (nem sempre existe — o kit + de-para bastam).
