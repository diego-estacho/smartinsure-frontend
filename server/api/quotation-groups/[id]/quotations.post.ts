import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): dispara o fan-out de Cotações do Grupo (POST /api/v1/quotation-groups/{id}/quotations,
 * 202 — RN-056/057). O id vem da rota; o corpo traz a Corretora (brokerageId). A sessão vai no cabeçalho
 * a partir do cookie httpOnly. Erros do backend são repassados com status + corpo.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/quotations`, {
    method: 'POST',
    body,
  })
})
