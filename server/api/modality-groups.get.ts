import type { components } from '~/types/gen/api'

type ModalityGroupListResponse = components['schemas']['PagedResponseOfModalityGroupListItemResponse']

export default defineEventHandler(async (event): Promise<ModalityGroupListResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ModalityGroupListResponse>('/api/v1/modality-groups', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
