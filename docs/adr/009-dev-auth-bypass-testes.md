# ADR-009: Dev-auth — bypass de autenticação para testes e dev local

## Status
Aceito (dono do front)

## Contexto
O E2E (Playwright, ADR-005) e o desenvolvimento local precisam de uma sessão autenticada sem depender da jornada de login real — que é lenta, exige serviço externo e, aqui, ainda é decisão de produto em aberto (o provedor de identidade não está definido). O padrão para isso é um `dev-login` acionado por uma flag de ambiente.

Um bypass de autenticação é sensível: se vazar para produção, é falha grave. Por isso a decisão precisa fixar o guard-rail junto.

Opções consideradas:
1. E2E sempre pela jornada de login real (acopla o teste ao provedor, ainda indefinido, e a identidade externa).
2. Bypass de dev-auth, desligado por padrão e gated por variável de ambiente.

## Decisão
- Uma rota de `dev-login` **no BFF** (Nitro, `server/api/`, ADR-008) emite a sessão em cookie httpOnly (ADR-007) para uma **identidade sintética não-produtiva**, pulando o provedor real.
- A rota só existe/responde quando `ENABLE_DEV_AUTH=true`; **padrão desligado** e **proibida em produção** (garantido no build/CI, não só por convenção).
- O E2E usa o dev-auth para obter sessão; identidade e dados são sempre sintéticos — nunca de produção (SECURITY do produto; ver OPEN-02).

## Consequências
- O E2E não depende do provedor de identidade (em aberto) nem de identidade de produção — destrava as jornadas autenticadas antes de a login estar decidida.
- Exige guard-rail de build: com a flag desligada, a rota não pode ser acionável; em produção, jamais habilitada.
- Quando o provedor real for decidido, o dev-auth continua válido como atalho de teste — não o substitui.
- Rejeitado: E2E só pela login real (frágil, lento e acoplado a decisão ainda aberta).
