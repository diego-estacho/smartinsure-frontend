import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): submete a taxa nova da Cotação escolhida
 * (POST /api/v1/quotation-groups/{id}/quotations/selected/tax — RN-504). A Seguradora devolve prêmio,
 * comissão e opções de parcelamento recalculados, e é o servidor que aplica na Cotação — o cliente só
 * exibe o retorno (ADR-004). Recusa da Seguradora vem como erro com a mensagem dela.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/quotations/selected/tax`, {
    method: 'POST',
    body,
  })
})
