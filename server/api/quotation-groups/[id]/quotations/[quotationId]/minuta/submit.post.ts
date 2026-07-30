import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): envia os termos preenchidos e devolve a minuta ("Baixar minuta")
 * (POST /api/v1/quotation-groups/{id}/quotations/{quotationId}/minuta/submit — RN-063).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const quotationId = getRouterParam(event, 'quotationId')
  const body = await readBody(event)

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/quotations/${quotationId}/minuta/submit`, {
    method: 'POST',
    body,
  })
})
