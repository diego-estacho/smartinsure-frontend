import type { components } from '~/types/gen/api'

type MapImportedModalityBody = components['schemas']['MapImportedModalityBody']
type MapImportedModalityResponse = components['schemas']['MapImportedModalityResponse']

export default defineEventHandler(async (event): Promise<MapImportedModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<MapImportedModalityBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<MapImportedModalityResponse>(`/api/v1/imported-modalities/${id}/map`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
