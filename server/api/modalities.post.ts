import type { components } from '~/types/gen/api'

type CreateModalityRequest = components['schemas']['CreateModalityRequest']
type CreateModalityResponse = components['schemas']['CreateModalityResponse']

export default defineEventHandler(async (event): Promise<CreateModalityResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<CreateModalityRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreateModalityResponse>('/api/v1/modalities', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
