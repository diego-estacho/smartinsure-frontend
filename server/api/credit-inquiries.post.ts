import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ExecuteCreditInquiryRequest = components['schemas']['ExecuteCreditInquiryRequest']
type ExecuteCreditInquiryResponse = components['schemas']['ExecuteCreditInquiryResponse']

export default defineEventHandler(async (event): Promise<ExecuteCreditInquiryResponse> => {
  const body = await readBody<ExecuteCreditInquiryRequest>(event)

  return await proxyBackend<ExecuteCreditInquiryResponse>(event, '/api/v1/credit-inquiries', {
    method: 'POST',
    body,
  })
})
