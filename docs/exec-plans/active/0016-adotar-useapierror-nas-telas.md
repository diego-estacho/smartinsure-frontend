# Exec-plan 0016 — Adotar `useApiError` nas telas restantes (débito técnico)

> Modelo de exec-plan **front-only**. Débito técnico registrado a partir do refactor de erros
> (a mensagem tratada do backend, ADR-011/012): o composable `app/composables/useApiError.ts` já
> existe e foi adotado no `Step4Quotations.vue`, mas as demais telas ainda repetem o padrão
> `loading`/`try`/`catch`/`finally` + `extractApiErrorMessage` inline. Migrar em incrementos
> pequenos (um assunto por PR), sem misturar com feature.

Status: não iniciado
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, `app/composables/useApiError.ts`, `app/lib/apiError.ts`.

## Objetivo

Remover o boilerplate de tratamento de erro das chamadas ao `$api` nas telas, trocando o
`loading` + `try/catch/finally` + `extractApiErrorMessage` manual pelo composable `useApiError`
(`{ loading, error, run, reset }`), sem alterar comportamento visível (mesmas mensagens, mesmos
estados de carregamento, mesmo fluxo de sucesso).

## Como migrar (por arquivo)

- Trocar `const loading = ref(false)` + `const error = ref<string|null>(null)` pela instância:
  `const { loading, error, run } = useApiError()` (aliasar quando houver mais de uma ação:
  `run: runX`). Instanciar **um por ação independente** (ex.: carga vs. submit).
- Trocar o corpo `try { ... } catch (err) { error.value = extractApiErrorMessage(err, 'msg') } finally { loading.value = false }`
  por `const ok = await run(() => chamada(), 'msg')` e seguir com o resultado (lembrar: `run`
  devolve `undefined` em erro; para `fn` que retorna `void`, retornar `true` no fim e testar `if (ok)`).
- Manter mensagens de fallback e ramos específicos (ex.: sucesso, "sem retorno") como estão.
- Onde o nome do flag é `submitting`/`saving`/`draftLoading`, aliasar o `loading` do composable
  para esse nome e ajustar o template — **não** renomear o binding do template sem necessidade.
- Remover o `import { extractApiErrorMessage }` que ficar órfão.

## Tarefas (telas a migrar)

- [ ] `app/pages/tomadores/nova.vue`
- [ ] `app/pages/tomadores/index.vue`
- [ ] `app/pages/tomadores/[id].vue`
- [ ] `app/pages/corretoras/index.vue`
- [ ] `app/pages/corretoras/[id].vue`
- [ ] `app/pages/modalidades/index.vue`
- [ ] `app/pages/mapa-de-modalidades/index.vue`
- [ ] `app/pages/coberturas-adicionais/index.vue`
- [ ] `app/pages/consulta-credito.vue`
- [ ] `app/pages/usuarios/novo.vue`
- [ ] `app/components/policy-holders/AddressesPanel.vue`
- [ ] `app/components/policy-holders/AppointmentsPanel.vue`
- [ ] `app/components/brokerages/InsurerEnablementsPanel.vue`
- [ ] `app/components/brokerages/EditDialog.vue`
- [ ] `app/components/brokerages/HistoryTab.vue`
- [ ] `app/components/quotation-groups/Wizard.vue`
- [ ] `app/components/quotation-groups/Step1PolicyHolder.vue`
- [ ] `app/components/quotation-groups/Step2Insured.vue`
- [ ] `app/components/quotation-groups/Step3Risk.vue`
- [ ] `app/components/quotation-groups/Step5Issuance.vue`

Referência já migrada (usar de modelo): `app/components/quotation-groups/Step4Quotations.vue`.

## Critérios de aceite

- `pnpm typecheck`, `pnpm lint` e `pnpm test` verdes; `python scripts/check-harness.py` verde.
- Nenhuma tela migrada muda a mensagem exibida nem o estado de carregamento (comparar antes/depois).
- Nenhum `extractApiErrorMessage` importado sem uso; nenhuma tela da lista com `try/catch` de `$api` inline.
- (Opcional) Teste unitário do `useApiError` cobrindo sucesso, erro (mensagem tratada) e `loading`.

## Evidências

(preencher durante a execução: comandos rodados, resultados, links de PR, screenshots)
