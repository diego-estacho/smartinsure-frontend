import type { components } from '~/types/gen/api'
import type { BrokerageStatus } from '~/lib/status/brokerages'

export type BrokerageListResponse = components['schemas']['ListBrokeragesResponse']
export type BrokerageListItem = components['schemas']['BrokerageListItemResponse']
export type BrokerageSituationCounts = components['schemas']['BrokerageSituationCountsResponse']
export type BrokeragePreview = components['schemas']['BrokeragePreviewResponse']
export type CreateBrokerageRequest = components['schemas']['CreateBrokerageRequest']
export type CreateBrokerageResponse = components['schemas']['CreateBrokerageResponse']
export type GetBrokerageResponse = components['schemas']['GetBrokerageResponse']
export type UpdateBrokerageBody = components['schemas']['UpdateBrokerageBody']
export type BrokerageHistoryResponse = components['schemas']['GetBrokerageHistoryResponse']
export type BrokerageHistoryEvent = components['schemas']['BrokerageHistoryEventResponse']
export type ChangeBrokerageStatusResponse = components['schemas']['ChangeBrokerageStatusResponse']

/** Filtros da listagem (RN-018) — tudo server-side. */
export type BrokerageListParams = {
  page?: number
  pageSize?: number
  q?: string
  situation?: string | null
  insurerId?: string | null
  calculationEngine?: string | null
  sector?: string | null
  registeredFrom?: string | null
  registeredTo?: string | null
}

export function useBrokerages(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listBrokerages(params: BrokerageListParams = {}): Promise<BrokerageListResponse> {
    return await api<BrokerageListResponse>('/api/brokerages', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.q ? { q: params.q } : {}),
        ...(params.situation ? { situation: params.situation } : {}),
        ...(params.insurerId ? { insurerId: params.insurerId } : {}),
        ...(params.calculationEngine ? { calculationEngine: params.calculationEngine } : {}),
        ...(params.sector ? { sector: params.sector } : {}),
        ...(params.registeredFrom ? { registeredFrom: params.registeredFrom } : {}),
        ...(params.registeredTo ? { registeredTo: params.registeredTo } : {}),
      },
    })
  }

  /** RN-052: consulta CNPJ somente leitura — nada é gravado. */
  async function previewBrokerage(cnpj: string): Promise<BrokeragePreview> {
    return await api<BrokeragePreview>('/api/brokerages/preview', {
      method: 'GET',
      query: { cnpj },
    })
  }

  /** RN-019: criação apenas na confirmação, com dados complementares. */
  async function createBrokerage(request: CreateBrokerageRequest): Promise<CreateBrokerageResponse> {
    return await api<CreateBrokerageResponse>('/api/brokerages', {
      method: 'POST',
      body: request,
    })
  }

  async function getBrokerage(id: string): Promise<GetBrokerageResponse> {
    return await api<GetBrokerageResponse>(`/api/brokerages/${id}`, { method: 'GET' })
  }

  /** RN-054: edição de dados complementares — não toca a Receita. */
  async function updateBrokerage(id: string, body: UpdateBrokerageBody): Promise<GetBrokerageResponse> {
    return await api<GetBrokerageResponse>(`/api/brokerages/${id}`, { method: 'PATCH', body })
  }

  /** RN-055: linha do tempo derivada da auditoria. */
  async function getBrokerageHistory(id: string): Promise<BrokerageHistoryResponse> {
    return await api<BrokerageHistoryResponse>(`/api/brokerages/${id}/history`, { method: 'GET' })
  }

  async function changeBrokerageStatus(
    id: string,
    status: BrokerageStatus,
  ): Promise<ChangeBrokerageStatusResponse> {
    return await api<ChangeBrokerageStatusResponse>(`/api/brokerages/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  }

  return {
    listBrokerages,
    previewBrokerage,
    createBrokerage,
    getBrokerage,
    updateBrokerage,
    getBrokerageHistory,
    changeBrokerageStatus,
  }
}
