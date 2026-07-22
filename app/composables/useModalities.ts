import type { components } from '~/types/gen/api'
import type { ModalityStatus } from '~/lib/status/modalities'
import { modalityStatuses } from '~/lib/status/modalities'

export type ModalityListResponse = components['schemas']['PagedResponseOfModalityListItemResponse']
export type ModalityListItem = components['schemas']['ModalityListItemResponse']
export type CreateModalityRequest = components['schemas']['CreateModalityRequest']
export type CreateModalityResponse = components['schemas']['CreateModalityResponse']
export type UpdateModalityBody = components['schemas']['UpdateModalityBody']
export type UpdateModalityResponse = components['schemas']['UpdateModalityResponse']
export type GetModalityResponse = components['schemas']['GetModalityResponse']
export type ChangeModalityStatusResponse = components['schemas']['ChangeModalityStatusResponse']

/**
 * Modalidade (RN-029): catálogo importado e curado. Uma Modalidade nasce derivada da Modalidade
 * Global da OnPoint na importação (RN-032) ou é criada manualmente pelo Administrador; não há
 * Grupo de Modalidade no lado Smart (ADR-061). Escrita restrita ao Administrador; CRUD sem
 * exclusão — a situação alterna entre Ativa e Inativa (RN-036). Acesso a dados só pelo BFF Nitro
 * (ADR-008); status por nome estável (ADR-004).
 */
export function useModalities(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listModalities(params: {
    page?: number
    pageSize?: number
    includeInactive?: boolean
  } = {}): Promise<ModalityListResponse> {
    return await api<ModalityListResponse>('/api/modalities', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 100,
        ...(params.includeInactive ? { includeInactive: true } : {}),
      },
    })
  }

  async function getModality(id: string): Promise<GetModalityResponse> {
    return await api<GetModalityResponse>(`/api/modalities/${id}`, {
      method: 'GET',
    })
  }

  async function createModality(request: {
    name: string
    description: string | null
  }): Promise<CreateModalityResponse> {
    return await api<CreateModalityResponse>('/api/modalities', {
      method: 'POST',
      // RN-029: item curado nasce por decisão humana explícita e entra Ativo.
      body: { ...request, initialStatus: modalityStatuses.active },
    })
  }

  async function updateModality(id: string, request: {
    name: string
    description: string | null
  }): Promise<UpdateModalityResponse> {
    return await api<UpdateModalityResponse>(`/api/modalities/${id}`, {
      method: 'PUT',
      body: request,
    })
  }

  async function changeModalityStatus(
    id: string,
    status: ModalityStatus,
  ): Promise<ChangeModalityStatusResponse> {
    return await api<ChangeModalityStatusResponse>(`/api/modalities/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  }

  return {
    listModalities,
    getModality,
    createModality,
    updateModality,
    changeModalityStatus,
  }
}
