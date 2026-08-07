import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type QuotationDetailResponse = components['schemas']['QuotationDetailResponse']

// RN-081: detalhe read-only da Cotação — proxy fino ao backend (ADR-008). A identidade é o id (guid),
// nunca o número; o Escopo ativo e o 404 fora do escopo são decididos no servidor.
export default defineEventHandler(async (event): Promise<QuotationDetailResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<QuotationDetailResponse>(event, `/api/v1/quotations/${id}`, {
    method: 'GET',
  })
})
