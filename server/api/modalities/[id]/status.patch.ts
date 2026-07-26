import type { components } from '~/types/gen/api'

type ChangeModalityStatusBody = components['schemas']['ChangeModalityStatusBody']
type ChangeModalityStatusResponse = components['schemas']['ChangeModalityStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeModalityStatusResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeModalityStatusBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ChangeModalityStatusResponse>(`/api/v1/modalities/${id}/status`, {
    baseURL: backendBaseUrl,
    method: 'PATCH',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
