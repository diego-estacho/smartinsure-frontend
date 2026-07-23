import type { components } from '~/types/gen/api'

export type ModalityMapResponse = components['schemas']['ModalityMapResponse']
export type ModalityMapEntry = components['schemas']['ModalityMapEntryResponse']
export type MapInsurer = components['schemas']['MapInsurerResponse']
export type PendingImportedModality = components['schemas']['PendingImportedModalityResponse']
export type ReassignImportedModalityResponse = components['schemas']['ReassignImportedModalityResponse']
export type IgnoreImportedModalityResponse = components['schemas']['IgnoreImportedModalityResponse']
export type RestoreImportedModalityResponse = components['schemas']['RestoreImportedModalityResponse']

/**
 * Mapa de Modalidades (RN-036) + Fila de Revisão (RN-037). A matriz Seguradoras × Modalidades e
 * o recorte de exceções (importadas sem Modalidade vinculada) vêm juntos do backend, que deriva
 * oferta e ramos e já agrega uma entrada por Seguradora (count/origins) — nenhuma regra de negócio
 * no cliente. Como o vínculo vem pronto da Modalidade Global (ADR-061), a Fila trata só de
 * curadoria: Reatribuir (override manual para outra Modalidade), Ignorar e Reativar — todas
 * decisões humanas confirmadas no servidor. Acesso a dados só pelo BFF Nitro (ADR-008);
 * status/ramo por nome estável (ADR-004).
 */
export function useModalityMap(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function getModalityMap(): Promise<ModalityMapResponse> {
    return await api<ModalityMapResponse>('/api/modality-map', {
      method: 'GET',
    })
  }

  // RN-037: reatribuir define manualmente a Modalidade da Importada (override preservado na
  // reimportação, RN-035).
  async function reassignImportedModality(
    importedModalityId: string,
    modalityId: string,
  ): Promise<ReassignImportedModalityResponse> {
    return await api<ReassignImportedModalityResponse>(`/api/imported-modalities/${importedModalityId}/reassign`, {
      method: 'POST',
      body: { modalityId },
    })
  }

  // RN-037: ignorar marca a Modalidade Importada como Ignorada — não é oferecida nem volta à Fila.
  async function ignoreImportedModality(
    importedModalityId: string,
  ): Promise<IgnoreImportedModalityResponse> {
    return await api<IgnoreImportedModalityResponse>(`/api/imported-modalities/${importedModalityId}/ignore`, {
      method: 'POST',
    })
  }

  // RN-037: reativar desfaz o Ignorar — a Modalidade Importada volta a ser considerada.
  async function restoreImportedModality(
    importedModalityId: string,
  ): Promise<RestoreImportedModalityResponse> {
    return await api<RestoreImportedModalityResponse>(`/api/imported-modalities/${importedModalityId}/restore`, {
      method: 'POST',
    })
  }

  return {
    getModalityMap,
    reassignImportedModality,
    ignoreImportedModality,
    restoreImportedModality,
  }
}
