import type { components } from '~/types/gen/api'
import type { EnablementStatus } from '~/lib/status/insurer-enablements'

export type EnablementListResponse = components['schemas']['PagedResponseOfBrokerageInsurerEnablementListItemResponse']
export type EnablementListItemResponse = components['schemas']['BrokerageInsurerEnablementListItemResponse']
export type CreateEnablementResponse = components['schemas']['CreateBrokerageInsurerEnablementResponse']
export type UpdateEnablementResponse = components['schemas']['UpdateBrokerageInsurerEnablementResponse']
export type ChangeEnablementStatusResponse = components['schemas']['ChangeBrokerageInsurerEnablementStatusResponse']
export type CalculationEngineListItemResponse = components['schemas']['CalculationEngineListItemResponse']
export type GetEnablementResponse = components['schemas']['GetBrokerageInsurerEnablementResponse']

/**
 * Habilitações de Seguradora da Corretora (RN-022): CRUD sem exclusão —
 * situação alterna entre Ativa e Inativa. Parâmetros de conexão são um JSON
 * opaco cujo conteúdo quem valida é o motor, no backend.
 */
export function useInsurerEnablements(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listEnablements(
    params: { brokerageId: string, page?: number, pageSize?: number },
  ): Promise<EnablementListResponse> {
    return await api<EnablementListResponse>('/api/brokerage-insurer-enablements', {
      method: 'GET',
      query: {
        brokerageId: params.brokerageId,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    })
  }

  async function getEnablement(id: string): Promise<GetEnablementResponse> {
    return await api<GetEnablementResponse>(`/api/brokerage-insurer-enablements/${id}`, {
      method: 'GET',
    })
  }

  async function createEnablement(request: {
    brokerageId: string
    insurerId: string
    calculationEngine: string
    connectionParameters: string | null
  }): Promise<CreateEnablementResponse> {
    return await api<CreateEnablementResponse>('/api/brokerage-insurer-enablements', {
      method: 'POST',
      body: request,
    })
  }

  async function updateEnablement(id: string, request: {
    calculationEngine: string
    connectionParameters: string | null
  }): Promise<UpdateEnablementResponse> {
    return await api<UpdateEnablementResponse>(`/api/brokerage-insurer-enablements/${id}`, {
      method: 'PUT',
      body: request,
    })
  }

  async function changeEnablementStatus(
    id: string,
    status: EnablementStatus,
  ): Promise<ChangeEnablementStatusResponse> {
    return await api<ChangeEnablementStatusResponse>(`/api/brokerage-insurer-enablements/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  }

  async function listCalculationEngines(): Promise<CalculationEngineListItemResponse[]> {
    return await api<CalculationEngineListItemResponse[]>('/api/calculation-engines', {
      method: 'GET',
    })
  }

  return {
    listEnablements,
    getEnablement,
    createEnablement,
    updateEnablement,
    changeEnablementStatus,
    listCalculationEngines,
  }
}
