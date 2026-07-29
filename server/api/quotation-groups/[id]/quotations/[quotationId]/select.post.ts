import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): marca a Cotação escolhida do Grupo
 * (POST /api/v1/quotation-groups/{id}/quotations/{quotationId}/select — RN-059).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const quotationId = getRouterParam(event, 'quotationId')

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/quotations/${quotationId}/select`, {
    method: 'POST',
  })
})
