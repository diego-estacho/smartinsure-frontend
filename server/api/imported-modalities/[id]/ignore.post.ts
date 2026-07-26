import type { components } from '~/types/gen/api'

type IgnoreImportedModalityResponse = components['schemas']['IgnoreImportedModalityResponse']

export default defineEventHandler(async (event): Promise<IgnoreImportedModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<IgnoreImportedModalityResponse>(`/api/v1/imported-modalities/${id}/ignore`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
