import type { components } from '~/types/gen/api'

type RestoreImportedModalityResponse = components['schemas']['RestoreImportedModalityResponse']

export default defineEventHandler(async (event): Promise<RestoreImportedModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<RestoreImportedModalityResponse>(`/api/v1/imported-modalities/${id}/restore`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
