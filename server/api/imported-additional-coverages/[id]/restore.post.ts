import type { components } from '~/types/gen/api'

type RestoreImportedAdditionalCoverageResponse = components['schemas']['RestoreImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<RestoreImportedAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<RestoreImportedAdditionalCoverageResponse>(`/api/v1/imported-additional-coverages/${id}/restore`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
