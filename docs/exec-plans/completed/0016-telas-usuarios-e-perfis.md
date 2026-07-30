# Exec-plan 0016 — Telas de Usuários e Perfis de acesso (listagem + detalhe)

> **Cross-repo.** Backend primeiro: exec-plan irmão `0014-listagem-usuarios-e-perfis` no `smartinsure-backend` publica os `GET` que estas telas consomem.
> Branch/worktree: `perfis-permissoes` (`C:\wt\perfis-permissoes\smartinsure-frontend` + irmã `smartinsure-backend`). Sem `AB#` — o slug faz o papel.
> Predecessor: **0014** (app shell) — os itens de menu "Usuários" e "Perfis de acesso" nasceram sem rota e por isso renderizam desabilitados; aqui eles passam a navegar.

Status: **concluído** (2026-07-30) — começou como listagem + detalhe e cresceu, a pedido do dono do produto, para todas as telas dos cinco contextos: primeiro acesso, seletor de escopo ativo, criação de usuários por CA e TA, manutenção de perfis customizados e edição das permissões dos perfis fixos pelo Administrador do Sistema. PR ainda não aberto.

Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`; ADRs **004** (contrato/status por nome), **006** (tokens), **008** (BFF Nitro), **013** (kit `Si`), **015** (css `si-*`), **017** (mobile-first), **018** (página fina), **021** (Lucide), **022** (DS-first); `docs/design-system-map.md`; camada de produto: `glossario.md`, RN-012 (`usuarios.md`), RN-062/RN-063/RN-064 (`perfis-e-permissoes.md`), `open-decisions.md` ([OPEN-17](../../../../smartinsure-backend/docs/product-specs/open-decisions.md), OPEN-19).

## Objetivo

Materializar as duas telas que faltavam para o menu deixar de ter itens desabilitados: **Usuários** (listagem paginada com busca e filtro de situação + detalhe com Perfil e Vínculos) e **Perfis de acesso** (catálogo com Escopo + detalhe com Permissões marcadas). Somente leitura — o que existe de escrita nesta jornada é ação de gestão, fora desta fatia.

## Escopo

**Dentro:**
- `app/composables/useUsers.ts`: `listUsers` + `getUser` ao lado do `createUser` existente; `app/composables/useProfiles.ts`: `listProfiles` + `getProfile`.
- BFF Nitro (ADR-008): `server/api/users.get.ts`, `server/api/users/[id].get.ts`, `server/api/profiles.get.ts`, `server/api/profiles/[id].get.ts` — o browser nunca fala com o .NET direto.
- `app/types/gen/api.ts` regenerado do contrato publicado (`pnpm types:gen`) — nunca editado à mão.
- Páginas: `usuarios/index.vue`, `usuarios/[id].vue`, `perfis/index.vue`, `perfis/[id].vue` no padrão de `pages/tomadores` (kit `Si`, `SiDataTable` + `SiPagination` server-side, hero + breadcrumb no detalhe).
- `app/lib/status/users.ts`: incluir `Inactive` (situação criada na fatia 5 do backend) e um mapa de cor por situação; `app/lib/status/profiles.ts` para o rótulo de Escopo do Perfil (RN-062) — label num único mapa por domínio (ADR-004).
- `app/layouts/shell.vue`: `to` nos itens `usuarios` e `perfis`; ajustar `tests/unit/components/shell.nuxt.spec.ts` (a expectativa hoje é que ambos estejam desabilitados).
- Ícones novos, se necessários, centralizados em `app/lib/icons.ts` (ADR-021).

**Acrescentado depois (pedido do dono, mesma rodada):**
- **Convite de Corretor Administrador (RN-066)**: botão "Convidar corretor administrador" na listagem de Usuários + `UsersInviteBrokerageAdministratorDialog` (nome, e-mail, multisseleção de Corretoras) + `useUsers.inviteBrokerageAdministrator` + BFF `server/api/users/brokerage-administrators.post.ts`. A lista oferece só Corretoras na situação **Ativa** (a RN-066 recusa as demais) — a recusa continua no servidor; o front só evita oferecer opção já inválida. Mensagem de recusa passou a vir do ProblemDetails do servidor (`app/lib/errors.ts`), em vez de texto genérico do cliente.

**Fora (e por quê):**
- Demais ações de gestão (reenviar convite, atribuir/revogar Perfil, inativar/reativar, editar Permissões): decisão do dono para esta rodada — listagem + detalhe + o convite acima. Parte delas também depende de [OPEN-18](../../../../smartinsure-backend/docs/product-specs/open-decisions.md)/OPEN-20.
- Filtro/visibilidade por Corretora ativa: [OPEN-19](../../../../smartinsure-backend/docs/product-specs/open-decisions.md) (mecânica do Escopo ativo) — no backend a leitura é Admin-only, e a tela reflete isso.
- Seletor de Corretora ativa e identidade real no shell: seguem como no 0014 (OPEN-03/OPEN-19).
- Dado mockado: nenhum. Lista vazia é renderizada como estado vazio honesto.

## Tarefas

- [x] Contrato regenerado a partir do `openapi.json` publicado pelo backend.
- [x] BFF: 4 rotas `GET` (padrão `proxyBackend`).
- [x] Composables `useUsers` (list/get) e `useProfiles` (list/get), tipados pelo contrato gerado.
- [x] Mapas de label: situação do Usuário (com `Inactive`) e Escopo do Perfil.
- [x] Telas `usuarios/index` + `usuarios/[id]`, `perfis/index` + `perfis/[id]` com kit `Si` e classes `si-*`.
- [x] Estado de erro de autorização: mensagem honesta quando a leitura é recusada (leitura Admin-only no backend).
- [x] `shell.vue` com rotas nos dois itens + teste do shell atualizado.
- [x] Testes unit dos composables e das rotas BFF com `describe('RN-…')`; `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- [x] Convite de Corretor Administrador (RN-066): BFF + composable + dialog + botão na listagem, com mensagem de recusa vinda do ProblemDetails.
- [x] Correção da suíte: `vitest.config.ts` passou a coletar `app/**/*.test.ts` e `server/**/*.test.ts` (havia 3 arquivos que nunca rodavam) e os timeouts de hook/teste subiram (30s → 90s / 5s → 30s) porque o `setupNuxt` + `mountSuspended` estouravam o default e reprovavam arquivos aleatórios por tempo.

## Critérios de aceite

- Os itens "Usuários" e "Perfis de acesso" navegam no menu (desktop e mobile) e ficam ativos na rota correspondente.
- Listagem de Usuários pagina server-side, busca por nome/e-mail e filtra por situação; situação renderizada pelo nome estável do contrato (nunca por índice).
- Detalhe do Usuário mostra Perfil de Escopo System (ou "sem perfil", RN-012) e os Vínculos de Corretora/Tomador com o Perfil de cada um (RN-064).
- Catálogo de Perfis mostra Escopo e se é fixo; detalhe mostra as Permissões marcadas e, com catálogo vazio, um estado vazio honesto (RN-063).
- Nenhum type de API escrito à mão; nenhum valor visual hardcoded; nenhuma cor fora de token.
- Recusa de autorização não quebra a tela: mostra mensagem de acesso restrito.

## Acréscimos de 2026-07-30 (escopo ditado pelo dono)

- **Primeiro acesso (RN-065)**: `app/pages/invite.vue` (rota pública no `auth.global.ts`), BFF anônimo
  `server/api/users/invitations/accept.post.ts`, composable `useInvitations` (usa `$fetch` cru — quem
  aceita convite ainda não tem sessão). Concluída a senha, entra logado. O painel de marca do login
  saiu para `components/auth/BrandPanel.vue`, usado pelas duas telas sem sessão.
- **Escopo ativo (RN-064)**: BFF `server/api/me.get.ts` e `server/api/me/active-scope.post.ts` (troca
  reemite o acesso e substitui o cookie httpOnly); `useWorkspaces` deixou de ser placeholder do 0014
  e passou a consumir `/api/me`; o switcher do shell lista as corretoras vinculadas, marca a ativa,
  troca de verdade e mostra a recusa do servidor; o rodapé de conta exibe nome real e Perfil.

- **Criação de Usuário pelo Corretor Administrador (RN-068/RN-069/RN-072)**: BFF
  `users/policy-holder-administrators.post.ts`, `users/brokerage-users.post.ts` e
  `profiles/assignable.get.ts`; `useUsers.invitePolicyHolderAdministrator`/`inviteBrokerageUser`,
  `useProfiles.listAssignableProfiles`; `UsersCreateScopedUserDialog` — um formulário só, onde o
  **escopo do perfil escolhido** decide a rota (perfil de Tomador pede o Tomador e cai na RN-068;
  os demais vinculam à corretora ativa pela RN-069). O botão "Novo usuário" da listagem passou a
  abrir esse dialog. Nenhum identificador de corretora sai do cliente — o escopo vem do acesso.

- **Perfis customizados (RN-069/RN-070/RN-074/RN-063)**: BFF `profiles.post.ts`,
  `profiles/[id].put.ts`, `profiles/[id].delete.ts` e `permissions.get.ts`; `useProfiles` ganhou
  `listPermissions`/`createProfile`/`updateProfile`/`deleteProfile`; `ProfilesFormDialog` (nome +
  checkboxes do catálogo de permissões, rolando dentro do próprio bloco). A tela de Perfis ganhou
  "Novo perfil" e as ações editar/remover por linha, **desabilitadas em perfil fixo** com tooltip
  explicando o motivo — a recusa continua sendo do servidor, o disable é só cortesia de UI.

- **Usuário do Tomador ativo e permissões dos fixos (RN-070/RN-073)**: BFF
  `users/policy-holder-users.post.ts` e `profiles/[id]/permissions.put.ts`;
  `useUsers.invitePolicyHolderUser` e `useProfiles.updateFixedProfilePermissions`. O dialog de
  usuário passou a distinguir os dois atores pelo escopo ativo: **com** corretora ativa, perfil de
  Tomador pede o tomador (RN-068); **sem** corretora ativa, o ator é o TA e o tomador é o ativo dele
  (RN-070). O dialog de perfil ganhou o modo `fixed-profile`: nome só de leitura, edita apenas as
  permissões, com aviso de efeito global — e a ação de editar perfil fixo só habilita para o
  Administrador do Sistema (`systemProfileName` de `/api/me`).

## Evidências

- `pnpm test` → **261/261** em 38 arquivos, **3 rodadas seguidas verdes** (a suíte era flaky por timeout: hook de 30s e teste de 5s não cabiam o `setupNuxt` do Vuetify (~9s) nem o `mountSuspended` do shell (~5,2s) em máquina carregada — falhava arquivo diferente a cada execução). A contagem saltou de 231 para 261 porque `app/**/*.test.ts` e `server/**/*.test.ts` entraram no `include`: `useCreditInquiries.test.ts` e `usePolicyHolders.test.ts` (pré-existentes) nunca eram executados.
- Convite (RN-066): `tests/unit/useUsers.spec.ts` (envio via BFF + propagação da recusa), `tests/unit/invite-brokerage-administrator-bff.nuxt.spec.ts` (rota do BFF) e `tests/unit/lib/errors.spec.ts` (403 → acesso restrito; 409/400 → `detail`/`title` do ProblemDetails; sem status → fallback da tela).
- Histórico da rodada anterior: `rtk pnpm test` → **222/222** em 31 arquivos (novos: `tests/unit/useUsers.spec.ts` com `RN-012` (listagem com busca/filtro; omissão de parâmetros vazios) e `RN-064` (vínculos no detalhe); `app/composables/useProfiles.test.ts` com `RN-062`/`RN-063`; `tests/unit/users-profiles-bff.nuxt.spec.ts` cobrindo as 4 rotas do BFF — query, id de rota e token da sessão encaminhados; `tests/unit/components/shell.nuxt.spec.ts` passou a exigir "Usuários" e "Perfis de acesso" habilitados).
- `rtk pnpm lint` → sem violação. `rtk pnpm typecheck` → sem erro. `rtk pnpm build` → build completo (chunks `api/users.get`, `api/users/_id_.get`, `api/profiles.get`, `api/profiles/_id_.get` presentes no output do Nitro).
- `python scripts/check-harness.py` → `harness ok` (links cross-repo do exec-plan resolvidos a partir da pasta do arquivo: `../../../../smartinsure-backend/...`).
- `app/types/gen/api.ts` regerado pelo `openapi-typescript` (o script `types:gen` usa `${VAR:-default}`, que o shell do Windows não expande — rodado via `pnpm exec openapi-typescript ../smartinsure-backend/docs/generated/openapi.json -o app/types/gen/api.ts`, mesmo gerador do CI; nada escrito à mão).
- Acréscimos de 2026-07-30: `pnpm test` **268/268** em 41 arquivos, `lint`/`typecheck`/`build` limpos, `check-harness.py` → `harness ok`. Novos: `useInvitations.spec.ts` (RN-065), `components/invite.nuxt.spec.ts` (tela sem/com token + BFF anônimo), `useWorkspaces.spec.ts` (RN-064: carrega vínculos, troca preservando o outro escopo, estado vazio sem contexto). O `shell.nuxt.spec.ts` perdeu o teste de "selectWorkspace é no-op" — o placeholder do 0014 deixou de existir, e o comportamento real está no spec do composable.
- Fatia D (2026-07-30): `pnpm test` **272/272** em 42 arquivos, `lint`/`typecheck`/`build` limpos, `harness ok`. Novo `tests/unit/scoped-user-creation.spec.ts` (RN-068 sem vazar corretora no corpo; RN-069 com perfil escolhido; RN-072 lista do servidor).
- Fatia E (2026-07-30): `pnpm test` **279/279** em 43 arquivos, `lint`/`typecheck`/`build` limpos, `harness ok`. Novo `tests/unit/useProfilesScoped.spec.ts` (RN-069/070: cria sem escopo no corpo, recusa nome repetido, aceita perfil sem permissão; RN-074: edita, remove, propaga "em uso"; RN-063: catálogo do servidor).
- Fatias F e G (2026-07-30): `pnpm test` **284/284** em 44 arquivos, `lint`/`typecheck`/`build` limpos, `harness ok`. Novo `tests/unit/policy-holder-user-and-fixed-permissions.spec.ts` (RN-070 sem vazar tomador no corpo + recusa propagada; RN-073 envia só permissões, aceita desmarcar tudo, propaga 403).
- **Verificação em app rodando ainda não feita**: depende de aplicar as migrations da jornada no banco de dev (gate do exec-plan 0014 no backend). Sem isso o backend não tem as tabelas `Profiles`/`Permissions`/`UserBrokerageMemberships` e as telas mostram apenas o estado de erro. Screenshot da jornada fica pendente para o PR.
