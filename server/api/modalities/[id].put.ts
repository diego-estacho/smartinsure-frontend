import type { components } from '~/types/gen/api'

type UpdateModalityBody = components['schemas']['UpdateModalityBody']
type UpdateModalityResponse = components['schemas']['UpdateModalityResponse']

export default defineEventHandler(async (event): Promise<UpdateModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateModalityBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<UpdateModalityResponse>(`/api/v1/modalities/${id}`, {
    baseURL: backendBaseUrl,
    method: 'PUT',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
