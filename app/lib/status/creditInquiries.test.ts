import { describe, it, expect } from 'vitest'
import {
  creditInquiryInsurerStatuses,
  isCreditInquiryInsurerStatus,
  getCreditInquiryInsurerStatusView,
} from './creditInquiries'

describe('RN-030 — Falha isolada na Consulta de Crédito (Status Mapping)', () => {
  it('deve mapear status "Available" para label "Disponível" e cor "success"', () => {
    const view = getCreditInquiryInsurerStatusView(creditInquiryInsurerStatuses.available)

    expect(view.label).toBe('Disponível')
    expect(view.color).toBe('success')
    expect(view.known).toBe(true)
  })

  it('deve mapear status "Unavailable" para label "Indisponível" e cor "error"', () => {
    const view = getCreditInquiryInsurerStatusView(creditInquiryInsurerStatuses.unavailable)

    expect(view.label).toBe('Indisponível')
    expect(view.color).toBe('error')
    expect(view.known).toBe(true)
  })

  it('deve retornar status desconhecido para valores não reconhecidos', () => {
    const view = getCreditInquiryInsurerStatusView('UnknownStatus')

    expect(view.label).toBe('Desconhecido')
    expect(view.color).toBe('warning')
    expect(view.known).toBe(false)
  })

  it('deve retornar status desconhecido para null', () => {
    const view = getCreditInquiryInsurerStatusView(null)

    expect(view.label).toBe('Desconhecido')
    expect(view.color).toBe('warning')
    expect(view.known).toBe(false)
  })

  it('deve identificar corretamente status válido', () => {
    expect(isCreditInquiryInsurerStatus(creditInquiryInsurerStatuses.available)).toBe(true)
    expect(isCreditInquiryInsurerStatus(creditInquiryInsurerStatuses.unavailable)).toBe(true)
  })

  it('deve rejeitar status inválido', () => {
    expect(isCreditInquiryInsurerStatus('InvalidStatus')).toBe(false)
    expect(isCreditInquiryInsurerStatus(null)).toBe(false)
    expect(isCreditInquiryInsurerStatus(undefined)).toBe(false)
  })

  it('deve usar o enum value para mapeamento, nunca ordinal', () => {
    // Simula que a ordem poderia mudar sem afetar o mapeamento
    const statuses = [
      creditInquiryInsurerStatuses.available,
      creditInquiryInsurerStatuses.unavailable,
    ]

    statuses.forEach((status) => {
      const view = getCreditInquiryInsurerStatusView(status)
      expect(view.known).toBe(true)
      // Verifica que o mapeamento é baseado no valor, não na posição
      if (status === 'Available') {
        expect(view.label).toBe('Disponível')
      } else if (status === 'Unavailable') {
        expect(view.label).toBe('Indisponível')
      }
    })
  })
})
