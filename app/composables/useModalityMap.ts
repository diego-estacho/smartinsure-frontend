import type { components } from '~/types/gen/api'

export type ModalityMapResponse = components['schemas']['ModalityMapResponse']
export type ModalityMapEntry = components['schemas']['ModalityMapEntryResponse']
export type MapInsurer = components['schemas']['MapInsurerResponse']
export type PendingImportedModality = components['schemas']['PendingImportedModalityResponse']
export type MapImportedModalityResponse = components['schemas']['MapImportedModalityResponse']
export type IgnoreImportedModalityResponse = components['schemas']['IgnoreImportedModalityResponse']

/**
 * Mapa de Modalidades (RN-033) + Fila de Revisão (RN-034). A matriz Seguradoras × Modalidades e
 * o recorte "precisa de decisão" (pendências) vêm juntos do backend, que deriva oferta e ramos —
 * nenhuma regra de negócio no cliente. Mapear/Ignorar são decisões humanas confirmadas no
 * servidor. Acesso a dados só pelo BFF Nitro (ADR-008); status/ramo por nome estável (ADR-004).
 */
export function useModalityMap(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function getModalityMap(): Promise<ModalityMapResponse> {
    return await api<ModalityMapResponse>('/api/modality-map', {
      method: 'GET',
    })
  }

  // RN-034: mapear confirma o mapeamento manual da Modalidade Importada a uma Modalidade existente.
  async function mapImportedModality(
    importedModalityId: string,
    modalityId: string,
  ): Promise<MapImportedModalityResponse> {
    return await api<MapImportedModalityResponse>(`/api/imported-modalities/${importedModalityId}/map`, {
      method: 'POST',
      body: { modalityId },
    })
  }

  // RN-034: ignorar marca a Modalidade Importada como Ignorada — não é oferecida nem volta à Fila.
  async function ignoreImportedModality(
    importedModalityId: string,
  ): Promise<IgnoreImportedModalityResponse> {
    return await api<IgnoreImportedModalityResponse>(`/api/imported-modalities/${importedModalityId}/ignore`, {
      method: 'POST',
    })
  }

  return {
    getModalityMap,
    mapImportedModality,
    ignoreImportedModality,
  }
}
