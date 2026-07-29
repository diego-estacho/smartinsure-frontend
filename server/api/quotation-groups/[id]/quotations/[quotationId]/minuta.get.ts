import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): lê a minuta (Tags do objeto + Cláusulas particulares) da Cotação
 * (GET /api/v1/quotation-groups/{id}/quotations/{quotationId}/minuta — RN-062).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const quotationId = getRouterParam(event, 'quotationId')

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/quotations/${quotationId}/minuta`, {
    method: 'GET',
  })
})
