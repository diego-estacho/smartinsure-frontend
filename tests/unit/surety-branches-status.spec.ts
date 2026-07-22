import { describe, expect, it } from 'vitest'
import { getSuretyBranchView, suretyBranches } from '../../app/lib/status/suretyBranches'

describe('RN-032/RN-033 Ramo (SuretyBranch) - mapa por nome estável', () => {
  it('exibe rótulo pt-BR do glossário pelo nome estável, nunca por posição', () => {
    expect(getSuretyBranchView(suretyBranches.public)).toEqual({ label: 'Setor Público', color: 'info', known: true })
    expect(getSuretyBranchView(suretyBranches.private)).toEqual({ label: 'Setor Privado', color: 'secondary', known: true })
  })

  it('ramo desconhecido não quebra a tela', () => {
    const view = getSuretyBranchView('Rural')
    expect(view.known).toBe(false)
    expect(view.label).toBe('Rural')
  })

  it('ramo ausente cai em rótulo neutro', () => {
    expect(getSuretyBranchView(null).known).toBe(false)
    expect(getSuretyBranchView(undefined).known).toBe(false)
  })
})
