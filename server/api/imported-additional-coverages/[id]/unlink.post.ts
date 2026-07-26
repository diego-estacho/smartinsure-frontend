import type { components } from '~/types/gen/api'

type UnlinkImportedAdditionalCoverageResponse = components['schemas']['UnlinkImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<UnlinkImportedAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<UnlinkImportedAdditionalCoverageResponse>(`/api/v1/imported-additional-coverages/${id}/unlink`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
