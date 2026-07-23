import type { components } from '~/types/gen/api'

export type ExecuteCreditInquiryRequest = components['schemas']['ExecuteCreditInquiryRequest']
export type ExecuteCreditInquiryResponse = components['schemas']['ExecuteCreditInquiryResponse']
export type CreditInquirySummary = components['schemas']['CreditInquirySummary']
export type CreditInquiryResultResponse = components['schemas']['CreditInquiryResultResponse']

export function useCreditInquiries(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function executeCreditInquiry(
    request: ExecuteCreditInquiryRequest,
  ): Promise<ExecuteCreditInquiryResponse> {
    return await api<ExecuteCreditInquiryResponse>('/api/credit-inquiries', {
      method: 'POST',
      body: request,
    })
  }

  return {
    executeCreditInquiry,
  }
}
