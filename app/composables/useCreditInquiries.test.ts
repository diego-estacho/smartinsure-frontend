import { describe, it, expect, vi } from 'vitest'
import type { $Fetch } from 'nitropack'
import { useCreditInquiries } from './useCreditInquiries'

describe('RN-029 — Consulta de Limites de Crédito do Tomador', () => {
  it('deve executar consulta com payload correto', async () => {
    const mockFetch = vi.fn() as unknown as $Fetch

    const mockResponse = {
      creditInquiryId: '123e4567-e89b-12d3-a456-426614174000',
      queriedAt: '2026-07-20T10:30:00Z',
      policyHolderCnpj: '12345678000123',
      policyHolderName: 'EMPRESA LTDA',
      summary: {
        insurersQueried: 3,
        insurersAvailable: 2,
        consolidatedLimit: 100000,
      },
      results: [
        {
          insurerId: '123e4567-e89b-12d3-a456-426614174001',
          insurerName: 'Seguradora A',
          status: 'Available',
          failureReason: null,
          policyHolderName: null,
          limits: [
            { groupName: 'Tradicional', groupType: 'credit', availableLimit: 50000, usedLimit: 0, rate: 2.5 },
            { groupName: 'Judicial', groupType: 'credit', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
            { groupName: 'Financeiro', groupType: 'credit', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
          ],
        },
      ],
    }

    const mockFn = mockFetch as unknown as ReturnType<typeof vi.fn>
    mockFn.mockResolvedValue(mockResponse)

    const { executeCreditInquiry } = useCreditInquiries(mockFetch)

    const request = {
      brokerageId: '123e4567-e89b-12d3-a456-426614174002',
      policyHolderCnpj: '12345678000123',
    }

    const result = await executeCreditInquiry(request)

    expect(mockFn).toHaveBeenCalledWith(
      '/api/credit-inquiries',
      expect.objectContaining({
        method: 'POST',
        body: request,
      }),
    )

    expect(result).toEqual(mockResponse)
    expect(result.summary.insurersQueried).toBe(3)
    expect(result.summary.insurersAvailable).toBe(2)
    expect(result.results[0]!.insurerName).toBe('Seguradora A')
  })

  it('deve passar brokerageId como UUID', async () => {
    const mockFetch = vi.fn() as unknown as $Fetch

    const mockFn = mockFetch as unknown as ReturnType<typeof vi.fn>
    mockFn.mockResolvedValue({
      creditInquiryId: '123',
      queriedAt: '2026-07-20T10:30:00Z',
      policyHolderCnpj: '12345678000123',
      policyHolderName: null,
      summary: { insurersQueried: 1, insurersAvailable: 1, consolidatedLimit: 50000 },
      results: [],
    })

    const { executeCreditInquiry } = useCreditInquiries(mockFetch)

    const brokerageId = '550e8400-e29b-41d4-a716-446655440000'
    await executeCreditInquiry({
      brokerageId,
      policyHolderCnpj: '12345678000123',
    })

    const calls = mockFn.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    const callBody = (call?.[1] as { body?: { brokerageId?: string } })?.body
    expect(callBody?.brokerageId).toBe(brokerageId)
  })

  it('deve passar policyHolderCnpj como string', async () => {
    const mockFetch = vi.fn() as unknown as $Fetch

    const mockFn = mockFetch as unknown as ReturnType<typeof vi.fn>
    mockFn.mockResolvedValue({
      creditInquiryId: '123',
      queriedAt: '2026-07-20T10:30:00Z',
      policyHolderCnpj: '12345678000123',
      policyHolderName: null,
      summary: { insurersQueried: 1, insurersAvailable: 1, consolidatedLimit: 50000 },
      results: [],
    })

    const { executeCreditInquiry } = useCreditInquiries(mockFetch)

    const cnpjValue = '12345678000123'
    await executeCreditInquiry({
      brokerageId: '550e8400-e29b-41d4-a716-446655440000',
      policyHolderCnpj: cnpjValue,
    })

    const calls = mockFn.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const call = calls[0]
    const callBody = (call?.[1] as { body?: { policyHolderCnpj?: string } })?.body
    expect(callBody?.policyHolderCnpj).toBe(cnpjValue)
  })
})
