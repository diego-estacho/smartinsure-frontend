import { describe, expect, it } from 'vitest'
import {
  getModalityStatusAction,
  getModalityStatusView,
} from '../../app/lib/status/modalities'

describe('RN-029/RN-036 Modalidade - mapa de situação', () => {
  it('exibe rótulo e cor pelo nome estável', () => {
    expect(getModalityStatusView('Active')).toEqual({ label: 'Ativa', color: 'success', known: true })
    expect(getModalityStatusView('Inactive')).toEqual({ label: 'Inativa', color: 'error', known: true })
  })

  it('situação desconhecida não quebra a tela', () => {
    expect(getModalityStatusView('Suspensa').known).toBe(false)
  })

  it('RN-036: ação alterna Ativa ↔ Inativa, nunca exclui', () => {
    expect(getModalityStatusAction('Active').targetStatus).toBe('Inactive')
    expect(getModalityStatusAction('Inactive').targetStatus).toBe('Active')
    expect(getModalityStatusAction(null).disabled).toBe(true)
  })

  it('falha fechado para status desconhecido, sem escolher ação manualmente', () => {
    const action = getModalityStatusAction('Suspended')
    expect(action.disabled).toBe(true)
    expect(action.targetStatus).toBeNull()
  })
})
