import type { components } from '~/types/gen/api'

type ReassignImportedModalityBody = components['schemas']['ReassignImportedModalityBody']
type ReassignImportedModalityResponse = components['schemas']['ReassignImportedModalityResponse']

export default defineEventHandler(async (event): Promise<ReassignImportedModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<ReassignImportedModalityBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ReassignImportedModalityResponse>(`/api/v1/imported-modalities/${id}/reassign`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
