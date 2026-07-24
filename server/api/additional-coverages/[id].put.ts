import type { components } from '~/types/gen/api'

type AdditionalCoverageNameBody = components['schemas']['AdditionalCoverageNameBody']
type UpdateAdditionalCoverageResponse = components['schemas']['UpdateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<UpdateAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<AdditionalCoverageNameBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<UpdateAdditionalCoverageResponse>(`/api/v1/additional-coverages/${id}`, {
    baseURL: backendBaseUrl,
    method: 'PUT',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
