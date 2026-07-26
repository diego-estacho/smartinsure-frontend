import { describe, expect, it } from 'vitest'
import {
  getAdditionalCoverageStatusAction,
  getAdditionalCoverageStatusView,
  isAdditionalCoverageStatus,
} from '../../app/lib/status/additionalCoverages'

describe('RN-040/RN-044 Cobertura Adicional - mapa de situação', () => {
  it('exibe rótulo e cor pelo nome estável', () => {
    expect(getAdditionalCoverageStatusView('Active')).toEqual({ label: 'Ativa', color: 'success', known: true })
    expect(getAdditionalCoverageStatusView('Inactive')).toEqual({ label: 'Inativa', color: 'error', known: true })
  })

  it('situação desconhecida não quebra a tela', () => {
    expect(getAdditionalCoverageStatusView('Suspensa').known).toBe(false)
    expect(getAdditionalCoverageStatusView(null).known).toBe(false)
  })

  it('isAdditionalCoverageStatus reconhece só os nomes estáveis', () => {
    expect(isAdditionalCoverageStatus('Active')).toBe(true)
    expect(isAdditionalCoverageStatus('Inactive')).toBe(true)
    expect(isAdditionalCoverageStatus('Suspended')).toBe(false)
    expect(isAdditionalCoverageStatus(undefined)).toBe(false)
  })

  it('RN-040/RN-044: ação alterna Ativa ↔ Inativa, nunca exclui', () => {
    expect(getAdditionalCoverageStatusAction('Active').targetStatus).toBe('Inactive')
    expect(getAdditionalCoverageStatusAction('Active').successMessage).toBe('Cobertura Adicional inativada.')
    expect(getAdditionalCoverageStatusAction('Inactive').targetStatus).toBe('Active')
    expect(getAdditionalCoverageStatusAction('Inactive').successMessage).toBe('Cobertura Adicional ativada.')
  })

  it('falha fechado para status desconhecido, sem escolher ação manualmente', () => {
    const action = getAdditionalCoverageStatusAction('Suspended')
    expect(action.disabled).toBe(true)
    expect(action.targetStatus).toBeNull()
    expect(getAdditionalCoverageStatusAction(null).disabled).toBe(true)
  })
})
