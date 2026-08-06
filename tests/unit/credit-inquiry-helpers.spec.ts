import { describe, it, expect } from 'vitest'
import type { CreditInquiryResultResponse } from '../../app/composables/useCreditInquiries'
import {
  buildCreditInquiryRow,
  buildCreditInquiryRows,
  isCnpjQuery,
  formatResponseTime,
  formatShortCurrencyBRL,
  usedBarColor,
} from '../../app/lib/creditInquiry'

function limit(groupType: string, availableLimit: number, rate: number, usedLimit = 0) {
  return { groupName: groupType, groupType, availableLimit, usedLimit, rate }
}

function result(
  overrides: Partial<CreditInquiryResultResponse> & { limits?: ReturnType<typeof limit>[] } = {},
): CreditInquiryResultResponse {
  return {
    insurerId: overrides.insurerId ?? 'insurer-1',
    insurerName: overrides.insurerName ?? 'Seguradora Teste',
    status: overrides.status ?? 'Available',
    failureReason: overrides.failureReason ?? null,
    // honra um null explícito (Indisponível não tem tempo de resposta); só usa o default quando omitido
    responseTimeMs: 'responseTimeMs' in overrides ? overrides.responseTimeMs : 820,
    limits: overrides.limits ?? [],
  } as CreditInquiryResultResponse
}

describe('RN-029 — mapeamento de grupos para colunas fixas', () => {
  it('mapeia Tradicional/Judicial/Financeira por GroupType', () => {
    const row = buildCreditInquiryRow(result({
      limits: [
        limit('GARANTIA_TRADICIONAL', 1000, 0.86),
        limit('GARANTIA_JUDICIAL', 1800, 0.90),
        limit('GARANTIA_FINANCEIRA', 500, 1.40),
      ],
    }))

    expect(row.traditional).toEqual({ available: 1000, rate: 0.86, fiscalRate: null })
    expect(row.financial).toEqual({ available: 500, rate: 1.40, fiscalRate: null })
    expect(row.judicial?.available).toBe(1800)
  })

  it('compõe a taxa fiscal do judicial a partir do grupo GARANTIA_JUDICIAL_FISCAL', () => {
    const row = buildCreditInquiryRow(result({
      limits: [
        limit('GARANTIA_JUDICIAL', 1800, 0.90),
        limit('GARANTIA_JUDICIAL_FISCAL', 1800, 1.30),
      ],
    }))

    expect(row.judicial).toEqual({ available: 1800, rate: 0.90, fiscalRate: 1.30 })
  })

  it('calcula o utilizado e o percentual sobre o grupo líder', () => {
    const row = buildCreditInquiryRow(result({
      limits: [limit('GARANTIA_TRADICIONAL', 800, 0.86, 200)],
    }))

    expect(row.used).toEqual({ value: 200, percent: 20 })
    expect(row.maxAvailable).toBe(800)
  })

  it('preserva o tempo de resposta e o motivo', () => {
    const row = buildCreditInquiryRow(result({
      status: 'Unavailable',
      failureReason: 'Tomador sem cadastro ativo.',
      responseTimeMs: null,
      limits: [],
    }))

    expect(row.responseTimeMs).toBeNull()
    expect(row.failureReason).toBe('Tomador sem cadastro ativo.')
    expect(row.traditional).toBeNull()
  })
})

describe('RN-029 — ordenação fixa', () => {
  it('coloca Aprovado antes de Indisponível e ordena por maior limite disponível', () => {
    const rows = buildCreditInquiryRows([
      result({ insurerId: 'baixo', status: 'Available', limits: [limit('GARANTIA_TRADICIONAL', 1000, 0.86)] }),
      result({ insurerId: 'indisponivel', status: 'Unavailable', limits: [] }),
      result({ insurerId: 'alto', status: 'Available', limits: [limit('GARANTIA_TRADICIONAL', 3000, 0.86)] }),
    ])

    expect(rows.map(row => row.insurerId)).toEqual(['alto', 'baixo', 'indisponivel'])
  })
})

describe('helpers de formatação', () => {
  it('detecta CNPJ (14 dígitos) para consulta direta', () => {
    expect(isCnpjQuery('01.294.872/0001-72')).toBe(true)
    expect(isCnpjQuery('01294872000172')).toBe(true)
    expect(isCnpjQuery('Construtora Aurora')).toBe(false)
    expect(isCnpjQuery('012948')).toBe(false)
  })

  it('formata o tempo de resposta em segundos (pt-BR); null vira ausente', () => {
    expect(formatResponseTime(820)).toBe('0,8 s')
    expect(formatResponseTime(null)).toBeNull()
  })

  it('formata moeda em formato curto', () => {
    expect(formatShortCurrencyBRL(3_000_000)).toBe('R$ 3 mi')
    expect(formatShortCurrencyBRL(500_000)).toBe('R$ 500 mil')
  })

  it('escolhe a cor da barra de utilizado por faixa', () => {
    expect(usedBarColor(20)).toBe('success')
    expect(usedBarColor(75)).toBe('warning')
    expect(usedBarColor(95)).toBe('error')
  })
})
