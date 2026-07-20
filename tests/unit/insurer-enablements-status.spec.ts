import { describe, expect, it } from 'vitest'
import {
  getEnablementStatusAction,
  getEnablementStatusView,
} from '../../app/lib/status/insurer-enablements'

describe('RN-022 Habilitação de Seguradora - mapa de situação', () => {
  it('exibe rótulo e cor pelo nome estável', () => {
    expect(getEnablementStatusView('Active')).toEqual({ label: 'Ativa', color: 'success', known: true })
    expect(getEnablementStatusView('Inactive')).toEqual({ label: 'Inativa', color: 'error', known: true })
  })

  it('situação desconhecida não quebra a tela', () => {
    expect(getEnablementStatusView('Suspensa').known).toBe(false)
  })

  it('ação alterna Ativa ↔ Inativa, nunca exclui', () => {
    expect(getEnablementStatusAction('Active').targetStatus).toBe('Inactive')
    expect(getEnablementStatusAction('Inactive').targetStatus).toBe('Active')
    expect(getEnablementStatusAction(null).disabled).toBe(true)
  })
})
