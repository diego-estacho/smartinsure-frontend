import { proxyBackend } from "~~/server/utils/proxyBackend"
/**
 * BFF (ADR-008): solicita a emissão da Apólice da Cotação escolhida
 * (POST /api/v1/quotation-groups/{id}/policy — RN-500/RN-514). O corpo traz o parcelamento, o
 * vencimento da primeira parcela e o aceite do Termo. O agente de acesso é lido no backend a partir do
 * cabeçalho da requisição (RN-506), então nada de identidade viaja no corpo. Erros do backend são
 * repassados com status + corpo: as recusas do portão e o veredito da Seguradora chegam ao corretor
 * como a mensagem que o servidor escreveu (RN-511).
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await proxyBackend(event, `/api/v1/quotation-groups/${id}/policy`, {
    method: 'POST',
    body,
  })
})
