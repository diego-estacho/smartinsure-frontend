import type { components } from '~/types/gen/api'

type ChangeModalityGroupStatusBody = components['schemas']['ChangeModalityGroupStatusBody']
type ChangeModalityGroupStatusResponse = components['schemas']['ChangeModalityGroupStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeModalityGroupStatusResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeModalityGroupStatusBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ChangeModalityGroupStatusResponse>(`/api/v1/modality-groups/${id}/status`, {
    baseURL: backendBaseUrl,
    method: 'PATCH',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
