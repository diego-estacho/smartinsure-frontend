# ADR-008: BFF no servidor Nuxt (Nitro) — browser nunca fala direto com o backend

## Status
Aceito (dono do front)

## Contexto
Um **BFF proxy** faz toda chamada ao backend passar pela camada de servidor do front, de modo que o browser nunca fala direto com a API. Em Nuxt 4 o equivalente nativo é o **Nitro** (server routes em `server/api/`).

Isso costura três decisões já tomadas: a sessão em cookie httpOnly (ADR-007) exige que o token seja lido e injetado no servidor, nunca no browser; o acesso a dados por composable (ADR-004); e nenhuma regra de negócio no cliente (SECURITY do produto).

Opções consideradas:
1. Browser chama o backend .NET direto (CORS aberto + token acessível ao JS).
2. BFF: browser → Nitro (`server/api/`) → backend; o servidor injeta o header de auth a partir do cookie httpOnly.

## Decisão
Toda chamada ao backend passa pelo **BFF no Nitro** (`server/api/`). O browser nunca fala direto com o backend .NET. O servidor lê o cookie httpOnly e injeta o header de autenticação na chamada ao backend; o composable de domínio (ADR-004) consome o BFF, não a API externa.

## Consequências
- O token nunca precisa existir no browser (reforça ADR-007) — superfície de XSS para roubo de token reduzida.
- Um único ponto para injeção de auth, resolução de tenant (ADR-006) e tratamento de erro de backend.
- CORS deixa de ser problema do cliente (mesma origem).
- Custo: uma camada de proxy a manter no Nitro; o contrato de types (ADR-001 do produto) continua valendo ponta a ponta.
- Rejeitado: browser direto ao backend (força token acessível ao JS e CORS aberto).
