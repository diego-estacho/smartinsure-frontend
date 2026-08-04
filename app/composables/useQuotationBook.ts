import type { components } from '~/types/gen/api'

export type QuotationBookResponse = components['schemas']['QuotationBookResponse']
export type QuotationBookItem = components['schemas']['QuotationBookItemResponse']
export type QuotationSituationCount = components['schemas']['QuotationSituationCountResponse']
export type QuotationBookOption = components['schemas']['QuotationBookOptionResponse']

/** Filtros do livro. `null`/vazio = sem aquele filtro (não vai na query). */
export interface QuotationBookQuery {
  page?: number
  pageSize?: number
  search?: string
  situation?: string | null
  insurerId?: string | null
  modalityId?: string | null
  premiumMin?: number | null
  premiumMax?: number | null
  insuredAmountMin?: number | null
  insuredAmountMax?: number | null
  createdFrom?: string | null
  createdTo?: string | null
  coverageStartFrom?: string | null
  coverageStartTo?: string | null
}

/**
 * Acesso ao "livro" de Cotações (RN-077, ADR-004): fetch tipado pelo contrato gerado, sempre via BFF do
 * Nitro (ADR-008) — nunca o backend direto. O servidor decide inclusão, Escopo e situação; o front só
 * coleta os filtros. Usa o `$api` (plugin) para que 401 encerre a sessão.
 */
export function useQuotationBook(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listQuotations(query: QuotationBookQuery = {}): Promise<QuotationBookResponse> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    }

    const optional: Array<[string, string | number | null | undefined]> = [
      ['search', query.search],
      ['situation', query.situation],
      ['insurerId', query.insurerId],
      ['modalityId', query.modalityId],
      ['premiumMin', query.premiumMin],
      ['premiumMax', query.premiumMax],
      ['insuredAmountMin', query.insuredAmountMin],
      ['insuredAmountMax', query.insuredAmountMax],
      ['createdFrom', query.createdFrom],
      ['createdTo', query.createdTo],
      ['coverageStartFrom', query.coverageStartFrom],
      ['coverageStartTo', query.coverageStartTo],
    ]

    for (const [key, value] of optional) {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value
      }
    }

    return await api<QuotationBookResponse>('/api/quotations', { method: 'GET', query: params })
  }

  return { listQuotations }
}
