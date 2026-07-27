import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): cria o Grupo de Cotação em Rascunho (POST /api/v1/quotation-groups, RN-050).
 * O browser nunca fala direto com o backend; a sessão vai no cabeçalho a partir do cookie httpOnly.
 * Erros do backend (ex.: validação 400 com ProblemDetails) são repassados com status + corpo, para
 * a tela mostrar a mensagem real em vez de um erro genérico.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await proxyBackend(event, '/api/v1/quotation-groups', {
    method: 'POST',
    body,
  })
})
