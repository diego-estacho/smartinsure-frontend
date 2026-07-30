# ADR-023: Helper único de mensagem de erro de API — `extractApiErrorMessage`

## Status
Aceito (dono do front)

## Contexto
O front traduz a recusa do backend em texto de UI a partir do ProblemDetails (RFC 9457) que o BFF repassa (ADR-008; ADR-011/012 do produto — o backend é o dono da mensagem, o front não inventa nem reimplementa regra). Três jornadas evoluíram em paralelo e cada uma criou seu próprio tradutor, divergindo no que liam:

1. `extractApiErrorMessage` (`app/lib/apiError.ts`) — jornada de cotações/erros: lia erro de campo (`errors`, validação 400), `detail`, `title`, `message` e os `detail`/`message` aninhados; sem olhar o status.
2. `describeRequestError` (`app/lib/errors.ts`) — jornada de perfis/permissões: gated por status (400/403/404/409), lia `detail`/`title`, e tinha um fallback específico de 403 sem corpo ("Você não tem permissão para esta operação."); ignorava `errors`, `message` e aninhados.
3. `getErrorMessage` (local em `brokerages/CreateWizard.vue`) — cadastro de corretora: só `detail`/`message`.

Três helpers que fazem quase o mesmo, cada tela escolhendo um (ou nenhum — havia caso com texto fixo). Resultado: mensagem inconsistente entre telas e três lugares para corrigir quando o contrato de erro muda. O AGENTS.md manda procurar padrão existente antes de criar utilitário — o divisor aqui é ter **um** só.

## Decisão
**Um único helper de mensagem de erro de API: `extractApiErrorMessage(error, fallback)` em `app/lib/apiError.ts`.** Ele reúne o melhor dos três e os demais são eliminados:

- **Extração completa** (de `extractApiErrorMessage`): erro de campo (validação) → `detail` → `title` → `message` → `detail`/`message` aninhados; primeiro não-vazio, pulando campos em branco.
- **Consciência de status + fallback de 403** (de `describeRequestError`): quando nada é extraído e o status é 403 (recusa da policy de rota, sem corpo), devolve "Você não tem permissão para esta operação." em vez do fallback específico da tela; lê o status tanto de `error.status` quanto de `error.response.status`.
- `getErrorMessage` (`detail`/`message`) já está contido no acima.

`fallback` genérico só quando o backend não disse nada (rede/timeout, resposta sem corpo). Toda tela/composable que traduz erro de API usa este helper (direto ou via o composable `useApiError`, que o encapsula). `app/lib/errors.ts` e o `getErrorMessage` local foram removidos, e todas as chamadas migradas.

## Consequências
- Uma fonte só de tradução de erro: mensagem consistente entre telas e um único ponto para evoluir quando o contrato de erro do backend mudar.
- Comportamento é superset do que existia: telas que usavam `describeRequestError` ganham `errors`/`message`/aninhados; telas que usavam `extractApiErrorMessage` ganham o fallback de 403 sem corpo.
- Mudança de comportamento consciente: para status fora de 400/403/404/409 (ex.: 500), agora exibimos o `detail` do ProblemDetails quando houver (o backend controla esse texto — ADR-011/012 do produto), em vez de cair direto no fallback como o `describeRequestError` fazia. É desejável: o 500 do backend traz mensagem tratada (com dica de correlationId).
- Testado em `tests/unit/lib/apiError.spec.ts` (extração por prioridade, campos em branco, 403 com e sem corpo, status por `status`/`response.status`, fallback). Rejeitados: manter tradutores por jornada (divergência) e texto de erro fixo na tela (não consome a mensagem do backend).
