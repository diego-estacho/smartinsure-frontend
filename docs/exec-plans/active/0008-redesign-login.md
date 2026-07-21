# Exec-plan 0008 — Redesign da tela de login (formato QA)

> Front-only, atividade interna de UI (sem `AB#`). Branch: `feat/redesign-login`.
> Origem: pedido do dono — adequar a tela de login ao design aprovado em QA (SmartInsure).
> Referência de aparência: repo de conhecimento `SmartInsure-Knowledge/InsurePoint-Front` (mesmos
> tokens de tipografia/raio) + prints do dono.

Status: em andamento
Contexto obrigatório (ler antes de executar): `AGENTS.md`, `docs/FRONTEND.md`, ADRs **006** (tokens
whitelabel), **013** (composição `ui/`), **015** (css `si-*`), **017** (mobile-first); camada de
produto: `SECURITY.md` (o front valida forma, não decisão) e RN-005 (fluxo de login).

## Objetivo

Trazer a tela de login para o **layout aprovado em QA**: split-screen com painel de marca à esquerda
(fundo escuro da marca + marca-d'água do símbolo) e formulário à direita, tipografia e raio de input
idênticos ao QA. Sem mudar a regra: o front continua validando **forma**; credenciais, situação do
Usuário e validade da sessão são decisão do servidor (SECURITY do produto, RN-005).

## Escopo

**Dentro:** `app/pages/login.vue` — layout split (`aside` painel de marca + `main` formulário);
símbolo + wordmark; título/subtítulo do hero; labels externos "Email:"/"Senha:" com ícones
`prepend-inner`; toggle de visibilidade da senha; alertas de erro/aviso; link "Esqueceu a senha?"
(o fluxo ainda não existe → informa indisponibilidade, não navega para lugar nenhum). `app/lib/icons.ts`
— +`mdiAccountOutline`, `mdiLockOutline` (ícone novo entra aqui, não no componente). Mobile-first
(ADR-017): o painel de marca some ≤960px, sobra o formulário centralizado.

**Fora:** recuperação de senha real (rota/serviço a definir); SSO/Casdoor na UI; item "Início" no
menu lateral e realce por rota (evolução do shell/0005 — assunto próprio); qualquer dado real de
usuário/corretora (OPEN-03).

## Tarefas

- [x] `lib/icons.ts`: +`mdiAccountOutline`, `mdiLockOutline`.
- [x] `app/pages/login.vue`: layout split (`aside.si-login__hero` + `main.si-login__panel`); marca +
  wordmark; hero (título/subtítulo/rodapé); formulário com labels externos + ícones; alertas de
  erro/aviso; link "Esqueceu a senha?" (aviso de indisponibilidade). CSS autoral sob `.si-login*`
  (ADR-015); cor/fonte/espaço/raio por token (ADR-006); input no raio `md` (10px) igual ao QA.
- [x] Responsividade (ADR-017): `@media (max-width: 960px)` esconde o painel de marca.

## Critérios de aceite

- [x] `python scripts/check-harness.py` → `harness ok`.
- [x] `pnpm lint` 0 · `pnpm typecheck` 0.
- [x] Nenhum valor visual hardcoded (tipografia/raio/espaço/cor por `var(--si-…)` / `--v-theme-…`).
- [x] Nenhum termo de domínio em identificador de código; UI em pt-BR.
- [x] Evidência: login em **desktop** (split-screen) e **mobile ~390px** (só formulário).

## Evidências

- **Gates:** `python scripts/check-harness.py` → `harness ok` · `pnpm lint` 0 · `pnpm typecheck` 0.
- **Desktop (1440×900):** split-screen — painel de marca à esquerda (fundo escuro da marca +
  marca-d'água do símbolo no canto inferior + wordmark "smart/insure") e formulário à direita
  ("Faça seu login", labels externos "Email:"/"Senha:" com ícones `prepend-inner`, toggle de senha,
  "Entrar", "Esqueceu a senha?"). Tipografia/raio idênticos ao QA.
  - `docs/exec-plans/evidence/0008-login-desktop.png`
- **Mobile (~390px, ADR-017):** o painel de marca some (`@media max-width: 960px`); sobra o formulário
  centralizado, sem scroll horizontal.
  - `docs/exec-plans/evidence/0008-login-mobile.png`
- **Console:** 0 erros na `/login` (rota pública — sem o 401/hydration do fluxo autenticado).
- **Arquivos:** `app/pages/login.vue` (redesign), `app/lib/icons.ts` (+`mdiAccountOutline`, `mdiLockOutline`).

**Decisão (recuperação de senha):** o link "Esqueceu a senha?" existe no design QA, mas o fluxo
(rota/serviço) ainda não existe. Até lá o link informa a indisponibilidade (aviso) em vez de navegar
para uma rota inexistente — evita link morto sem materializar promessa de tela.

**Decisão (login sem CNPJ, 2026-07-21 — dono + design system):** o login pede **só e-mail e senha**,
sem CNPJ. O protótipo do design system (`design system/ui_kits/web/login.html`) documenta o porquê:
usuários com múltiplas corretoras tinham que deslogar/logar para trocar; a corretora passa a ser
escolhida **dentro** da plataforma (workspace picker pós-login — feature futura, fora deste escopo).
Subtítulo ajustado para "Acesse com seu e-mail e senha." (sem prometer o picker, que ainda não existe).
