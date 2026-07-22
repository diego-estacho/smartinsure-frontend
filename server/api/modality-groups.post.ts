import type { components } from '~/types/gen/api'

type CreateModalityGroupRequest = components['schemas']['CreateModalityGroupRequest']
type CreateModalityGroupResponse = components['schemas']['CreateModalityGroupResponse']

export default defineEventHandler(async (event): Promise<CreateModalityGroupResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<CreateModalityGroupRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreateModalityGroupResponse>('/api/v1/modality-groups', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
