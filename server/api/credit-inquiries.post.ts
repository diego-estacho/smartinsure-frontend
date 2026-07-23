import type { components } from '~/types/gen/api'

type ExecuteCreditInquiryRequest = components['schemas']['ExecuteCreditInquiryRequest']
type ExecuteCreditInquiryResponse = components['schemas']['ExecuteCreditInquiryResponse']

export default defineEventHandler(async (event): Promise<ExecuteCreditInquiryResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<ExecuteCreditInquiryRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ExecuteCreditInquiryResponse>('/api/v1/credit-inquiries', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
