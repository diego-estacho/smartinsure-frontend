import { describe, expect, it } from 'vitest'
import { pruneSelection } from '../../app/lib/additionalCoverageSelection'

describe('RN-104 poda da seleção de Coberturas Adicionais', () => {
  it('RN-104: mantém apenas os ids presentes na oferta carregada', () => {
    const available = [{ id: 'ac-1' }, { id: 'ac-2' }]

    expect(pruneSelection(['ac-1', 'ac-9'], available)).toEqual(['ac-1'])
  })

  it('RN-104: modalidade sem oferta zera a seleção reidratada', () => {
    expect(pruneSelection(['ac-1', 'ac-2'], [])).toEqual([])
  })

  it('RN-104: seleção inteiramente válida é preservada na ordem', () => {
    const available = [{ id: 'ac-2' }, { id: 'ac-1' }]

    expect(pruneSelection(['ac-1', 'ac-2'], available)).toEqual(['ac-1', 'ac-2'])
  })

  it('RN-104: seleção vazia continua vazia', () => {
    expect(pruneSelection([], [{ id: 'ac-1' }])).toEqual([])
  })
})
