import type { components } from '~/types/gen/api'

type LinkImportedAdditionalCoverageBody = components['schemas']['LinkImportedAdditionalCoverageBody']
type LinkImportedAdditionalCoverageResponse = components['schemas']['LinkImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<LinkImportedAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<LinkImportedAdditionalCoverageBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<LinkImportedAdditionalCoverageResponse>(`/api/v1/imported-additional-coverages/${id}/link`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
