import { describe, it, expect } from 'vitest'
import {
  policyHolderAppointmentStatuses,
  isPolicyHolderAppointmentStatus,
  getPolicyHolderAppointmentStatusView,
  canEndPolicyHolderAppointment,
} from './policyHolderAppointments'

// RN-027/RN-028 — Nomeação de Tomador: status quo do appointment
describe('RN-027/RN-028 — Policy Holder Appointment Status', () => {
  describe('isPolicyHolderAppointmentStatus', () => {
    it('reconhece status Vigente (Active)', () => {
      expect(isPolicyHolderAppointmentStatus('Active')).toBe(true)
    })

    it('reconhece status Encerrada (Ended)', () => {
      expect(isPolicyHolderAppointmentStatus('Ended')).toBe(true)
    })

    it('rejeita status desconhecido', () => {
      expect(isPolicyHolderAppointmentStatus('Unknown')).toBe(false)
      expect(isPolicyHolderAppointmentStatus(null)).toBe(false)
      expect(isPolicyHolderAppointmentStatus(undefined)).toBe(false)
    })
  })

  describe('getPolicyHolderAppointmentStatusView', () => {
    it('retorna Vigente com cor success para Active', () => {
      const view = getPolicyHolderAppointmentStatusView('Active')
      expect(view.label).toBe('Vigente')
      expect(view.color).toBe('success')
      expect(view.known).toBe(true)
    })

    it('retorna Encerrada com cor error para Ended', () => {
      const view = getPolicyHolderAppointmentStatusView('Ended')
      expect(view.label).toBe('Encerrada')
      expect(view.color).toBe('error')
      expect(view.known).toBe(true)
    })

    it('retorna Desconhecida com cor warning para status inválido', () => {
      const view = getPolicyHolderAppointmentStatusView('Unknown')
      expect(view.label).toBe('Desconhecida')
      expect(view.color).toBe('warning')
      expect(view.known).toBe(false)
    })

    it('retorna Desconhecida para null ou undefined', () => {
      const viewNull = getPolicyHolderAppointmentStatusView(null)
      const viewUndefined = getPolicyHolderAppointmentStatusView(undefined)

      expect(viewNull.label).toBe('Desconhecida')
      expect(viewNull.known).toBe(false)
      expect(viewUndefined.label).toBe('Desconhecida')
      expect(viewUndefined.known).toBe(false)
    })
  })

  describe('canEndPolicyHolderAppointment', () => {
    it('permite encerrar nomeação Vigente (Active)', () => {
      expect(canEndPolicyHolderAppointment('Active')).toBe(true)
    })

    it('impede encerrar nomeação Encerrada (Ended)', () => {
      expect(canEndPolicyHolderAppointment('Ended')).toBe(false)
    })

    it('impede encerrar nomeação com status desconhecido', () => {
      expect(canEndPolicyHolderAppointment('Unknown')).toBe(false)
      expect(canEndPolicyHolderAppointment(null)).toBe(false)
      expect(canEndPolicyHolderAppointment(undefined)).toBe(false)
    })
  })

  describe('constantes', () => {
    it('exporta statuses Active e Ended', () => {
      expect(policyHolderAppointmentStatuses.active).toBe('Active')
      expect(policyHolderAppointmentStatuses.ended).toBe('Ended')
    })
  })
})
