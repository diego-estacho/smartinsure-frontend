import type { components } from '~/types/gen/api'

type InsurerListResponse = components['schemas']['PagedResponseOfInsurerListItemResponse']

export default defineEventHandler(async (event): Promise<InsurerListResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<InsurerListResponse>('/api/v1/insurers', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
