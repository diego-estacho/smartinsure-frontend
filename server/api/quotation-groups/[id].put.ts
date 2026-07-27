import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): atualiza o Grupo de Cotação em Rascunho (PUT /api/v1/quotation-groups/{id}, RN-051).
 * O id vem da rota; o corpo é o contrato do grupo. A sessão vai no cabeçalho a partir do cookie httpOnly.
 * Erros do backend (ex.: validação 400) são repassados com status + corpo, para a tela mostrar a mensagem real.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}`, {
    method: 'PUT',
    body,
  })
})
