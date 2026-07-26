import type { components } from '~/types/gen/api'

type BrokeragePreviewResponse = components['schemas']['BrokeragePreviewResponse']

// RN-052: consulta de CNPJ somente leitura — o BFF apenas repassa; nada é gravado.
export default defineEventHandler(async (event): Promise<BrokeragePreviewResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<BrokeragePreviewResponse>('/api/v1/brokerages/preview', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
