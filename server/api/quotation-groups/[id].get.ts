import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): lê o Grupo de Cotação por id (GET /api/v1/quotation-groups/{id}, RN-050/RN-051) para
 * reidratar o wizard ao atualizar a página. Devolve os escalares do pedido, a Cotação escolhida e o
 * Tomador/Segurado/Modalidade já resolvidos. A sessão vai no cabeçalho a partir do cookie httpOnly.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}`, {
    method: 'GET',
  })
})
