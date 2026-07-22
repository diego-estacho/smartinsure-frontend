import { describe, it, expect } from 'vitest'
import type { MapInsurer } from '../../app/composables/useModalityMap'
import { groupInsurersById } from '../../app/lib/modalityMap'

// RN-033 — Matriz Seguradoras × Modalidades: o contrato entrega a lista PLANA (uma entrada por
// Modalidade Importada confirmada); a visão agrega por insurerId para mostrar UMA badge por
// Seguradora distinta, com a contagem e os nomes de origem por trás dela.
const insurer = (
  insurerId: string,
  insurerName: string,
  importedModalityId: string,
  originName: string,
): MapInsurer => ({ insurerId, insurerName, importedModalityId, originName })

describe('groupInsurersById (RN-033 — agregação da matriz)', () => {
  it('duas Modalidades Importadas da mesma Seguradora viram 1 badge com contagem 2', () => {
    const groups = groupInsurersById([
      insurer('ins-essor', 'Essor', 'imp-1', 'Judicial Cível A'),
      insurer('ins-essor', 'Essor', 'imp-2', 'Judicial Cível B'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({
      insurerId: 'ins-essor',
      insurerName: 'Essor',
      count: 2,
    })
    expect(groups[0]!.origins).toEqual(['Judicial Cível A', 'Judicial Cível B'])
  })

  it('Seguradoras distintas viram uma badge cada (dedupe por insurerId, não por mapeamento)', () => {
    const groups = groupInsurersById([
      insurer('ins-essor', 'Essor', 'imp-1', 'Judicial A'),
      insurer('ins-essor', 'Essor', 'imp-2', 'Judicial B'),
      insurer('ins-excelsior', 'Excelsior', 'imp-3', 'Judicial C'),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.map(g => g.insurerName)).toEqual(['Essor', 'Excelsior'])
    expect(groups.map(g => g.count)).toEqual([2, 1])
  })

  it('preserva a ordem de primeira ocorrência das Seguradoras', () => {
    const groups = groupInsurersById([
      insurer('ins-b', 'Beta', 'imp-1', 'Origem B1'),
      insurer('ins-a', 'Alfa', 'imp-2', 'Origem A1'),
      insurer('ins-b', 'Beta', 'imp-3', 'Origem B2'),
    ])

    expect(groups.map(g => g.insurerId)).toEqual(['ins-b', 'ins-a'])
    expect(groups[0]!.count).toBe(2)
  })

  it('lista vazia retorna nenhum grupo', () => {
    expect(groupInsurersById([])).toEqual([])
  })
})
