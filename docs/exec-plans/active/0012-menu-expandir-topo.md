# Exec-plan 0012 — Reabrir o menu recolhido: logo do topo vira "Expandir menu"

> Front-only, atividade de UI (sem `AB#`). Branch: `fix/menu-expandir-topo`.
> Origem: pedido do dono — "o menu, quando fechado, não está abrindo" (desktop, notebook maximizado:
> recolhe com 'Recolher menu' e não consegue reabrir pela seta do rodapé).

Status: concluído
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **006** (tokens),
**013** (kit `Si`), **015** (css `si-*`), **017** (mobile-first). Referência do shell: exec-plan 0005.

## Diagnóstico

Não reproduzi uma falha funcional: recolher/expandir pela seta do rodapé (`rail = !rail`) funciona em
1280/1366/1440 × alturas 560/657/900, sem erro de console, e o menu de conta e o hambúrguer (mobile)
também abrem. O que sobra é **descoberta/alcance**: o único jeito de reabrir era uma seta pequena,
escura, no rodapé, colada no avatar de conta — fácil de não achar ou errar o alvo. Percepção: "não abre".

## Objetivo

Tornar **óbvio e robusto** reabrir o menu recolhido, sem remover o controle atual nem mudar o
comportamento expandido.

## Escopo

**Dentro:** no `app/layouts/shell.vue`, quando o menu está **recolhido** (`rail`), o **logo do topo
vira um botão "Expandir menu"** (alvo grande, no lugar onde se procura). Realce no hover para ler como
clicável; `aria-label`/`title` "Expandir menu". Tudo por token (ADR-006). A seta do rodapé continua
funcionando (recolher **e** expandir). Expandido, o logo é só a marca (não recolhe pelo logo, pra não
surpreender).

**Fora (e por quê):**
- Mover/remover a seta do rodapé — evita mexer no layout decidido no exec-plan 0005; a mudança é
  **aditiva**.
- `expand-on-hover` do Vuetify — muda o modelo de interação (auto-expande ao passar o mouse); fica
  como opção futura se ainda faltar.
- Mobile — não tem rail; o hambúrguer no topo já abre/fecha (sem mudança).

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok` (sem hex cru; identificadores em inglês; css `.si-*`).
- [x] `pnpm lint` 0 · `pnpm typecheck` 0.
- [x] Recolhido: clicar no logo do topo expande o menu. Seta do rodapé segue recolhendo/expandindo.
- [x] Sem cor/medida hardcoded (hover e raio por token).

## Evidências

- **Gates:** `python scripts/check-harness.py` → `harness ok` · `pnpm lint` 0 · `pnpm typecheck` 0.
- **Fluxo (medido via árvore de acessibilidade, desktop 1440×900):** recolher → o topo passa a expor
  `button "Expandir menu"` (envolve o símbolo) → clicar nele reexpande (labels + wordmark +
  "Recolher menu" de volta). A seta do rodapé continua alternando normalmente. **0 erros** no console.
- **Recolhido (rail) com logo-botão no topo:** `docs/exec-plans/evidence/0012-menu-rail-logo-expand.png`.
- **Arquivos:** `app/layouts/shell.vue` (logo vira `button "Expandir menu"` no rail + estilo `--toggle`).

**Nota:** a falha dura relatada não foi reproduzida em teste; esta mudança ataca a causa mais provável
(descoberta/alcance do controle). Confirmar no notebook do dono após o deploy.
