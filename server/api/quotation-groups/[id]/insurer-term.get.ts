import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): Termo e declaração vigente da Seguradora da Cotação escolhida
 * (GET /api/v1/quotation-groups/{id}/insurer-term — RN-506). O texto vem do servidor porque é o mesmo
 * conteúdo que o aceite registra — a tela não guarda texto próprio.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/insurer-term`)
})
