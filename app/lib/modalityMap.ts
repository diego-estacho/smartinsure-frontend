import type { MapInsurer } from '~/composables/useModalityMap'

/**
 * Uma Seguradora distinta na matriz Seguradoras × Modalidades (RN-033), agregada a partir da
 * lista plana de Modalidades Importadas confirmadas. `count` é quantas Modalidades Importadas
 * dessa Seguradora sustentam a Modalidade; `origins` são os nomes de origem por trás dela.
 */
export interface InsurerGroup {
  insurerId: string
  insurerName: string
  count: number
  origins: string[]
}

/**
 * Agrupa a lista plana de `insurers` (uma entrada por Modalidade Importada confirmada — o
 * contrato de `GET /api/v1/modality-map`) em uma Seguradora distinta por `insurerId`,
 * preservando a ordem de primeira ocorrência. A matriz exibe UMA badge por Seguradora; a
 * contagem e os nomes de origem ficam acessíveis sem poluir a visão (ADR-004: só renderiza).
 */
export function groupInsurersById(insurers: MapInsurer[]): InsurerGroup[] {
  const groups = new Map<string, InsurerGroup>()

  for (const insurer of insurers) {
    const existing = groups.get(insurer.insurerId)
    if (existing) {
      existing.count += 1
      existing.origins.push(insurer.originName)
    }
    else {
      groups.set(insurer.insurerId, {
        insurerId: insurer.insurerId,
        insurerName: insurer.insurerName,
        count: 1,
        origins: [insurer.originName],
      })
    }
  }

  return [...groups.values()]
}
