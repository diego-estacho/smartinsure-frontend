import type { components } from '~/types/gen/api'

type GetModalityGroupResponse = components['schemas']['GetModalityGroupResponse']

export default defineEventHandler(async (event): Promise<GetModalityGroupResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<GetModalityGroupResponse>(`/api/v1/modality-groups/${id}`, {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
