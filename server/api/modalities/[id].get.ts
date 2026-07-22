import type { components } from '~/types/gen/api'

type GetModalityResponse = components['schemas']['GetModalityResponse']

export default defineEventHandler(async (event): Promise<GetModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<GetModalityResponse>(`/api/v1/modalities/${id}`, {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
