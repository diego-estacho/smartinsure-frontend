import { describe, expect, it } from 'vitest'
import {
  getModalityGroupStatusAction,
  getModalityGroupStatusView,
} from '../../app/lib/status/modality-groups'

describe('RN-029/RN-036 Grupo de Modalidade - mapa de situação', () => {
  it('exibe rótulo e cor pelo nome estável', () => {
    expect(getModalityGroupStatusView('Active')).toEqual({ label: 'Ativa', color: 'success', known: true })
    expect(getModalityGroupStatusView('Inactive')).toEqual({ label: 'Inativa', color: 'error', known: true })
  })

  it('situação desconhecida não quebra a tela', () => {
    expect(getModalityGroupStatusView('Suspensa').known).toBe(false)
  })

  it('RN-036: ação alterna Ativa ↔ Inativa, nunca exclui', () => {
    expect(getModalityGroupStatusAction('Active').targetStatus).toBe('Inactive')
    expect(getModalityGroupStatusAction('Inactive').targetStatus).toBe('Active')
    expect(getModalityGroupStatusAction(null).disabled).toBe(true)
  })

  it('falha fechado para status desconhecido, sem escolher ação manualmente', () => {
    const action = getModalityGroupStatusAction('Suspended')
    expect(action.disabled).toBe(true)
    expect(action.targetStatus).toBeNull()
  })
})
