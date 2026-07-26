import type { components } from '~/types/gen/api'

export type AdditionalCoverageMapResponse = components['schemas']['AdditionalCoverageMapResponse']
export type CanonicalCoverageItem = components['schemas']['CanonicalCoverageItem']
export type LinkedCoverageItem = components['schemas']['LinkedCoverageItem']
export type PendingCoverageItem = components['schemas']['PendingCoverageItem']
export type LinkImportedAdditionalCoverageResponse = components['schemas']['LinkImportedAdditionalCoverageResponse']
export type UnlinkImportedAdditionalCoverageResponse = components['schemas']['UnlinkImportedAdditionalCoverageResponse']
export type IgnoreImportedAdditionalCoverageResponse = components['schemas']['IgnoreImportedAdditionalCoverageResponse']
export type RestoreImportedAdditionalCoverageResponse = components['schemas']['RestoreImportedAdditionalCoverageResponse']

/**
 * Mapa de Coberturas Adicionais (RN-043/RN-046): o catálogo canônico (cada Cobertura Adicional com
 * as Coberturas Adicionais Importadas Ativas vinculadas) e a fila de pendências (importadas Ativas
 * sem vínculo, evidentes na curadoria) vêm juntos do backend, que já deriva a agregação — nenhuma
 * regra de negócio no cliente. O vínculo é MANUAL (RN-043): o Administrador vincula/reatribui
 * (link — serve para vincular e reatribuir), desvincula (unlink), ignora e reativa a importada.
 * Acesso a dados só pelo BFF Nitro (ADR-008); status por nome estável (ADR-004).
 */
export function useAdditionalCoverageMap(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function getAdditionalCoverageMap(): Promise<AdditionalCoverageMapResponse> {
    return await api<AdditionalCoverageMapResponse>('/api/additional-coverage-map', {
      method: 'GET',
    })
  }

  // RN-043: vincula (ou reatribui) a Cobertura Adicional Importada a uma Cobertura Adicional
  // canônica. O mesmo endpoint serve para o primeiro vínculo e para a reatribuição; o vínculo
  // manual é preservado nas reimportações.
  async function linkImportedCoverage(
    importedCoverageId: string,
    additionalCoverageId: string,
  ): Promise<LinkImportedAdditionalCoverageResponse> {
    return await api<LinkImportedAdditionalCoverageResponse>(`/api/imported-additional-coverages/${importedCoverageId}/link`, {
      method: 'POST',
      body: { additionalCoverageId },
    })
  }

  // RN-043: desfaz o vínculo — a importada volta a ficar pendente de mapeamento.
  async function unlinkImportedCoverage(
    importedCoverageId: string,
  ): Promise<UnlinkImportedAdditionalCoverageResponse> {
    return await api<UnlinkImportedAdditionalCoverageResponse>(`/api/imported-additional-coverages/${importedCoverageId}/unlink`, {
      method: 'POST',
    })
  }

  // RN-043: ignorar retira a importada da lista de pendências sem vinculá-la nem excluí-la.
  async function ignoreImportedCoverage(
    importedCoverageId: string,
  ): Promise<IgnoreImportedAdditionalCoverageResponse> {
    return await api<IgnoreImportedAdditionalCoverageResponse>(`/api/imported-additional-coverages/${importedCoverageId}/ignore`, {
      method: 'POST',
    })
  }

  // RN-043: reativar desfaz o ignorar — a importada volta a ser considerada na curadoria.
  async function restoreImportedCoverage(
    importedCoverageId: string,
  ): Promise<RestoreImportedAdditionalCoverageResponse> {
    return await api<RestoreImportedAdditionalCoverageResponse>(`/api/imported-additional-coverages/${importedCoverageId}/restore`, {
      method: 'POST',
    })
  }

  return {
    getAdditionalCoverageMap,
    linkImportedCoverage,
    unlinkImportedCoverage,
    ignoreImportedCoverage,
    restoreImportedCoverage,
  }
}
