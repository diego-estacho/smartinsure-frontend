import type { components } from '~/types/gen/api'

type UpdateModalityGroupBody = components['schemas']['UpdateModalityGroupBody']
type UpdateModalityGroupResponse = components['schemas']['UpdateModalityGroupResponse']

export default defineEventHandler(async (event): Promise<UpdateModalityGroupResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateModalityGroupBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<UpdateModalityGroupResponse>(`/api/v1/modality-groups/${id}`, {
    baseURL: backendBaseUrl,
    method: 'PUT',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
