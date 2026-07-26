import type { components } from '~/types/gen/api'
import type { AdditionalCoverageStatus } from '~/lib/status/additionalCoverages'
import { additionalCoverageStatuses } from '~/lib/status/additionalCoverages'

export type AdditionalCoverageNameBody = components['schemas']['AdditionalCoverageNameBody']
export type CreateAdditionalCoverageResponse = components['schemas']['CreateAdditionalCoverageResponse']
export type UpdateAdditionalCoverageResponse = components['schemas']['UpdateAdditionalCoverageResponse']
export type ActivateAdditionalCoverageResponse = components['schemas']['ActivateAdditionalCoverageResponse']
export type InactivateAdditionalCoverageResponse = components['schemas']['InactivateAdditionalCoverageResponse']

/**
 * Cobertura Adicional (RN-040): catálogo canônico curado pelo Administrador do Sistema — a garantia
 * complementar nomeada que o corretor vê na cotação, sem dono de Seguradora. Nunca é criada pela
 * importação. Escrita restrita ao Administrador (decidida no servidor); CRUD sem exclusão — sai de
 * operação por Inativação (RN-040/RN-044), o ciclo alterna Ativa/Inativa por endpoints dedicados
 * (activate/inactivate). Acesso a dados só pelo BFF Nitro (ADR-008); status por nome estável
 * (ADR-004). A listagem do catálogo vem do mapa (useAdditionalCoverageMap) — aqui só a escrita.
 */
export function useAdditionalCoverages(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function createAdditionalCoverage(request: {
    name: string
  }): Promise<CreateAdditionalCoverageResponse> {
    return await api<CreateAdditionalCoverageResponse>('/api/additional-coverages', {
      method: 'POST',
      body: { name: request.name },
    })
  }

  async function updateAdditionalCoverage(id: string, request: {
    name: string
  }): Promise<UpdateAdditionalCoverageResponse> {
    return await api<UpdateAdditionalCoverageResponse>(`/api/additional-coverages/${id}`, {
      method: 'PUT',
      body: { name: request.name },
    })
  }

  // RN-040: Ativação da Cobertura Adicional canônica.
  async function activateAdditionalCoverage(
    id: string,
  ): Promise<ActivateAdditionalCoverageResponse> {
    return await api<ActivateAdditionalCoverageResponse>(`/api/additional-coverages/${id}/activate`, {
      method: 'POST',
    })
  }

  // RN-040/RN-044: Inativação; a Cobertura Adicional nunca é excluída, só sai de operação.
  async function inactivateAdditionalCoverage(
    id: string,
  ): Promise<InactivateAdditionalCoverageResponse> {
    return await api<InactivateAdditionalCoverageResponse>(`/api/additional-coverages/${id}/inactivate`, {
      method: 'POST',
    })
  }

  // Roteia pela situação-alvo (nome estável, ADR-004) para o endpoint dedicado — a decisão de
  // transição é do servidor; o cliente só escolhe a ação pelo nome, nunca por posição ordinal.
  async function changeAdditionalCoverageStatus(
    id: string,
    targetStatus: AdditionalCoverageStatus,
  ): Promise<ActivateAdditionalCoverageResponse | InactivateAdditionalCoverageResponse> {
    return targetStatus === additionalCoverageStatuses.active
      ? await activateAdditionalCoverage(id)
      : await inactivateAdditionalCoverage(id)
  }

  return {
    createAdditionalCoverage,
    updateAdditionalCoverage,
    activateAdditionalCoverage,
    inactivateAdditionalCoverage,
    changeAdditionalCoverageStatus,
  }
}
