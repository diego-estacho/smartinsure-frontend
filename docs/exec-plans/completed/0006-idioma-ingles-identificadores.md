# Exec-plan 0006 — Idioma: identificadores de código em inglês (ADR-058)

> Front-only, atividade interna de conformidade (sem `AB#`). Origem: feedback do dono na sessão
> de 16/07 — identificadores pt-BR (`enviando`, `entrar`, `drawerAberto`) apareceram em código.
> Cross-repo parcial: o backend recebeu a regra análoga no próprio harness (ADR-058 lá já existia).

Status: concluído
Contexto obrigatório: `AGENTS.md`, `docs/FRONTEND.md`, ADR-058 do produto (artefatos em inglês,
docs/UI em pt-BR).

## Objetivo

Cravar de forma executável a regra "**identificador de código é sempre inglês; só rota de página e
texto de UI em pt-BR**" (ADR-058) e limpar os identificadores pt-BR já existentes no repo. A regra
existia amarrada a *termos de domínio/glossário*; não cobria identificadores não-domínio — por isso
`senha`/`enviando`/`drawerAberto` passavam.

## Escopo

**Dentro:** regra geral e explícita no `AGENTS.md` (§Idioma) e `docs/FRONTEND.md`; **enforcement** no
`check-harness.py` (checagem #10: rede conservadora que quebra identificadores declarados em segmentos
camelCase e reprova palavras pt-BR inequívocas); limpeza dos identificadores pt-BR em
`app/pages/login.vue`, `app/pages/usuarios/novo.vue`, `app/pages/dev/ui.vue`; token de cor
`carvao`→`charcoal` em `tokens.ts`/`shell.vue`.

**Fora:** mudar qualquer comportamento (é renomeação); rotas de página (pt-BR do glossário é permitido);
tocar o backend (o backend tem ADR-058 próprio); tornar a rede de idioma exaustiva (é conservadora,
complementa o review).

## Tarefas

- [x] `AGENTS.md` §Idioma + `docs/FRONTEND.md`: regra geral (identificador inglês; rota/UI pt-BR) com exemplos.
- [x] `check-harness.py` checagem #10: denylist pt-BR sobre nomes declarados (`const/let/var/function`) em `.vue`/`.ts` de `app/`+`server/`.
- [x] Limpeza: `login.vue` (`senha`→`password`, `enviar`→`submit`, `erro`→`error`, …), `usuarios/novo.vue` (`nome`→`name`, `enviando`→`submitting`, …), `dev/ui.vue` (`enviarForm`→`submitForm`, `selecionado`→`selected`, `fValor`→`fAmount`, …), `shell.vue` (`drawerAberto`→`drawerOpen`).
- [x] Token `carvao`/`on-carvao`→`charcoal`/`on-charcoal`; token morto `carvao-lighten-1` removido.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok` (a checagem #10 pega o flagrante).
- [x] `pnpm lint` 0 · `pnpm typecheck` 0 · `pnpm test` 68/68.
- [x] Nenhum identificador de código pt-BR declarado em `app/`; rotas/labels seguem pt-BR.

## Evidências

- **Gates:** lint 0 · typecheck 0 · test 68/68 · harness ok.
- **A rede provou valor:** a checagem #10, ao ser adicionada, reprovou `app/pages/dev/ui.vue`
  (`enviarForm`, `enviado`) que a varredura manual não tinha pego — corrigido junto (a vitrine
  inteira foi para inglês).
- **Honestidade sobre o limite:** a rede é conservadora (denylist curada), não prova de idioma;
  a garantia final segue no review. Ex.: `charcoal` foi validado à mão (a #10 varre só nomes
  declarados, não chaves de objeto de token).
- **Arquivos:** `AGENTS.md`, `docs/FRONTEND.md`, `scripts/check-harness.py`, `app/pages/login.vue`,
  `app/pages/usuarios/novo.vue`, `app/pages/dev/ui.vue`, `app/layouts/shell.vue`, `app/assets/styles/tokens/tokens.ts`.

**Relacionado:** ADR-058 (produto). O gate de exec-plan (ADR-016) exige que este trabalho — que tocou
`app/` — tenha exec-plan: é este 0006.
