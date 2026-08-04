import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ListAvailableAdditionalCoveragesResponse =
  components['schemas']['ListAvailableAdditionalCoveragesResponse']

/**
 * RN-104/RN-046: Coberturas Adicionais canônicas ofertáveis para uma Modalidade. A Corretora é a do
 * Escopo ativo do acesso, resolvida pelo servidor (RN-103) — o cliente não a informa.
 */
export default defineEventHandler(async (event): Promise<ListAvailableAdditionalCoveragesResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<ListAvailableAdditionalCoveragesResponse>(
    event,
    `/api/v1/modalities/${id}/additional-coverages`,
    { method: 'GET' },
  )
})
