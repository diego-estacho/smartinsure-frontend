import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): lê o leque de Cotações do Grupo para acompanhamento por polling
 * (GET /api/v1/quotation-groups/{id}/quotations — RN-057/RN-058). Leitura barata do estado persistido.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/quotations`, {
    method: 'GET',
  })
})
