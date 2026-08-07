import type { components } from '~/types/gen/api'

export type QuotationDetail = components['schemas']['QuotationDetailResponse']
export type QuotationDetailCoverage = components['schemas']['QuotationDetailCoverageResponse']
export type QuotationTimelineEvent = components['schemas']['QuotationTimelineEventResponse']

/**
 * Detalhe read-only de uma Cotação (RN-081, ADR-004): fetch tipado pelo contrato gerado, sempre via BFF
 * do Nitro (ADR-008) — nunca o backend direto. O servidor decide o Escopo e devolve 404 fora dele; a
 * identidade é o `quotationId` (guid), nunca o número. Usa o `$api` (plugin) para que 401 encerre a sessão.
 */
export function useQuotationDetail(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function getQuotation(id: string): Promise<QuotationDetail> {
    return await api<QuotationDetail>(`/api/quotations/${id}`, { method: 'GET' })
  }

  return { getQuotation }
}
