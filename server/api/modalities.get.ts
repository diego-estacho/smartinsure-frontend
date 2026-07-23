import type { components } from '~/types/gen/api'

type ModalityListResponse = components['schemas']['PagedResponseOfModalityListItemResponse']

export default defineEventHandler(async (event): Promise<ModalityListResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ModalityListResponse>('/api/v1/modalities', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
