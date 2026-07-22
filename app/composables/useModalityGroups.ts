import type { components } from '~/types/gen/api'
import type { ModalityGroupStatus } from '~/lib/status/modality-groups'
import { modalityGroupStatuses } from '~/lib/status/modality-groups'

export type ModalityGroupListResponse = components['schemas']['PagedResponseOfModalityGroupListItemResponse']
export type ModalityGroupListItem = components['schemas']['ModalityGroupListItemResponse']
export type CreateModalityGroupRequest = components['schemas']['CreateModalityGroupRequest']
export type CreateModalityGroupResponse = components['schemas']['CreateModalityGroupResponse']
export type UpdateModalityGroupBody = components['schemas']['UpdateModalityGroupBody']
export type UpdateModalityGroupResponse = components['schemas']['UpdateModalityGroupResponse']
export type GetModalityGroupResponse = components['schemas']['GetModalityGroupResponse']
export type ChangeModalityGroupStatusResponse = components['schemas']['ChangeModalityGroupStatusResponse']

/**
 * Grupo de Modalidade (RN-029): catálogo curado, escrita restrita ao Administrador.
 * CRUD sem exclusão — a situação alterna entre Ativa e Inativa (RN-036). Acesso a dados
 * só pelo BFF Nitro (ADR-008); status por nome estável (ADR-004).
 */
export function useModalityGroups(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listModalityGroups(params: {
    page?: number
    pageSize?: number
    includeInactive?: boolean
  } = {}): Promise<ModalityGroupListResponse> {
    return await api<ModalityGroupListResponse>('/api/modality-groups', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 100,
        ...(params.includeInactive ? { includeInactive: true } : {}),
      },
    })
  }

  async function getModalityGroup(id: string): Promise<GetModalityGroupResponse> {
    return await api<GetModalityGroupResponse>(`/api/modality-groups/${id}`, {
      method: 'GET',
    })
  }

  async function createModalityGroup(request: {
    name: string
    description: string | null
    displayOrder: number
  }): Promise<CreateModalityGroupResponse> {
    return await api<CreateModalityGroupResponse>('/api/modality-groups', {
      method: 'POST',
      // RN-029: item curado nasce por decisão humana explícita e entra Ativo.
      body: { ...request, initialStatus: modalityGroupStatuses.active },
    })
  }

  async function updateModalityGroup(id: string, request: {
    name: string
    description: string | null
    displayOrder: number
  }): Promise<UpdateModalityGroupResponse> {
    return await api<UpdateModalityGroupResponse>(`/api/modality-groups/${id}`, {
      method: 'PUT',
      body: request,
    })
  }

  async function changeModalityGroupStatus(
    id: string,
    status: ModalityGroupStatus,
  ): Promise<ChangeModalityGroupStatusResponse> {
    return await api<ChangeModalityGroupStatusResponse>(`/api/modality-groups/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  }

  return {
    listModalityGroups,
    getModalityGroup,
    createModalityGroup,
    updateModalityGroup,
    changeModalityGroupStatus,
  }
}
