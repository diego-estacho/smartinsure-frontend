import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type QuotationBookResponse = components['schemas']['QuotationBookResponse']

// RN-077: o "livro" de Cotações da Corretora ativa — proxy fino ao backend (ADR-008); o Escopo e os
// filtros são decididos no servidor. A Corretora ativa vem do acesso, não da query.
export default defineEventHandler(async (event): Promise<QuotationBookResponse> => {
  const query = getQuery(event)

  return await proxyBackend<QuotationBookResponse>(event, '/api/v1/quotations', {
    method: 'GET',
    query,
  })
})
