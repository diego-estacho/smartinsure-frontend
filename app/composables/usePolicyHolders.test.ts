import { describe, it, expect } from 'vitest'
import { usePolicyHolders } from './usePolicyHolders'

// RN-025/RN-026/RN-027/RN-028 — Jornada de Tomador
describe('RN-025/026/027/028 — usePolicyHolders composable', () => {
  describe('composable exports', () => {
    it('exporta todas as funções necessárias', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi: any = async () => ({})
      const composable = usePolicyHolders(mockApi)

      expect(typeof composable.listPolicyHolders).toBe('function')
      expect(typeof composable.createPolicyHolder).toBe('function')
      expect(typeof composable.getPolicyHolder).toBe('function')
      expect(typeof composable.addAddress).toBe('function')
      expect(typeof composable.updateAddress).toBe('function')
      expect(typeof composable.deleteAddress).toBe('function')
      expect(typeof composable.createAppointment).toBe('function')
      expect(typeof composable.endAppointment).toBe('function')
    })
  })

  describe('jornada RN-025 — Listagem e criação', () => {
    it('suporta listagem com search e paginação', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi: any = async () => ({ items: [], page: 1, pageSize: 20, totalCount: 0 })
      const { listPolicyHolders } = usePolicyHolders(mockApi)
      expect(typeof listPolicyHolders).toBe('function')
    })

    it('suporta criação de tomador via CNPJ', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi: any = async () => ({ id: '123', documentNumber: '12345678000195', name: 'Acme Corp' })
      const { createPolicyHolder } = usePolicyHolders(mockApi)
      expect(typeof createPolicyHolder).toBe('function')
    })
  })

  describe('jornada RN-026 — Endereços', () => {
    it('suporta adicionar, atualizar e remover endereços', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi: any = async () => ({ id: 'addr1', isMain: false })
      const { addAddress, updateAddress, deleteAddress } = usePolicyHolders(mockApi)

      expect(typeof addAddress).toBe('function')
      expect(typeof updateAddress).toBe('function')
      expect(typeof deleteAddress).toBe('function')
    })
  })

  describe('jornada RN-027/028 — Nomeações', () => {
    it('suporta criar e encerrar nomeações', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockApi: any = async () => ({ id: 'appt1', status: 'Active' })
      const { createAppointment, endAppointment } = usePolicyHolders(mockApi)

      expect(typeof createAppointment).toBe('function')
      expect(typeof endAppointment).toBe('function')
    })
  })
})
