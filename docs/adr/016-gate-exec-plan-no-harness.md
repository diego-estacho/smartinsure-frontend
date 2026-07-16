# ADR-016: Gate de exec-plan no harness (decisão de triagem cobrada)

## Status
Aceito (dono do front, 2026-07-16)

## Contexto
O "Fluxo por tarefa" (AGENTS.md) manda ler o harness e decidir se a tarefa leva
exec-plan antes de codar. Por ser só prosa no meio do arquivo, o passo foi pulado
repetidas vezes — código de produto entrou sem a triagem ser feita. Reforçar o texto
não resolve: pelo ADR-003 (agnóstico de IA) o harness valida o resultado, não a boa
vontade da ferramenta; a garantia tem de ser algo que roda e reprova.

Ao mesmo tempo, exigir exec-plan para **toda** mudança geraria documentação inútil:
tarefa trivial (ex.: trocar a cor de um botão) não merece um plano.

Opções consideradas:
1. Só reforçar o AGENTS.md (prosa) — já existia e furou 3x.
2. Gate rígido: todo diff de código exige exec-plan — gera doc desnecessária, atrito.
3. Gate que cobra a **decisão de triagem**, não o artefato: código de produto exige OU
   exec-plan ativo OU dispensa declarada. (escolhida)

## Decisão
- O `check-harness.py` reprova quando o diff da branch (vs `main`) toca `app/**` ou
  `server/**` **sem** (a) um exec-plan em `docs/exec-plans/active/`, **ou** (b) uma
  declaração de dispensa em algum commit da branch: trailer `Exec-plan: dispensado — <motivo>`
  (também aceita `Exec-plan: <slug-do-plano>`).
- Base indeterminada (sem git, sem `main`) → **aviso**, não erro: não trava dev local nem
  o CI que clona só um repo. O gate morde no PR/CI, onde há base.
- O AGENTS.md ganha um "Gate de entrada (bloqueante)" no topo do fluxo. Registrar a decisão
  de exec-plan é obrigatório; **o plano em si só quando o trabalho é não-trivial.**

## Consequências
- Trivial passa com uma linha no commit; não-trivial exige o plano antes de implementar.
- A decisão (plano ou dispensa justificada) fica auditável no histórico — agnóstica de IA.
- Rejeitado: gate rígido (doc desnecessária) e reforço só documental (não é blindagem).
