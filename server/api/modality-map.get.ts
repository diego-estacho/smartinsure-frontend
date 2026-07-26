import type { components } from '~/types/gen/api'

type ModalityMapResponse = components['schemas']['ModalityMapResponse']

export default defineEventHandler(async (event): Promise<ModalityMapResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ModalityMapResponse>('/api/v1/modality-map', {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
