import type { components } from '~/types/gen/api'

export type ListAvailableAdditionalCoveragesResponse =
  components['schemas']['ListAvailableAdditionalCoveragesResponse']

export type AvailableAdditionalCoverage =
  components['schemas']['AvailableAdditionalCoverageItemResponse']

/**
 * Coberturas Adicionais ofertáveis na etapa de risco (RN-104/RN-046): o corretor escolhe sempre a
 * Cobertura Adicional canônica, e a disponibilidade é derivada dos vínculos ativos das Seguradoras
 * habilitadas da Corretora do Escopo ativo — nunca digitada. Acesso a dados só pelo BFF Nitro
 * (ADR-008).
 */
export function useAvailableAdditionalCoverages(
  api: typeof $fetch = useNuxtApp().$api as typeof $fetch,
) {
  async function listByModality(modalityId: string): Promise<AvailableAdditionalCoverage[]> {
    const response = await api<ListAvailableAdditionalCoveragesResponse>(
      `/api/modalities/${modalityId}/additional-coverages`,
      { method: 'GET' },
    )

    return response.items ?? []
  }

  return { listByModality }
}
