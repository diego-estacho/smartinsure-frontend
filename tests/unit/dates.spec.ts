import { describe, it, expect } from 'vitest'
import { toBrDate, toIsoDate, toBrDashDate, fromIsoDate, fromBrDashDate } from '../../app/lib/dates'

// ADR-013 §6 — datas: exibição pt-BR e serialização pro backend, sem shift de fuso.
describe('helpers de data', () => {
  const d = new Date(2026, 6, 15) // 15/07/2026 (mês 6 = julho), meia-noite local

  it('formata exibição e backend', () => {
    expect(toBrDate(d)).toBe('15/07/2026')
    expect(toIsoDate(d)).toBe('2026-07-15')
    expect(toBrDashDate(d)).toBe('15-07-2026')
  })

  it('faz parse de volta pro Date local (sem shift de fuso)', () => {
    const iso = fromIsoDate('2026-07-15')!
    expect(iso.getFullYear()).toBe(2026)
    expect(iso.getMonth()).toBe(6)
    expect(iso.getDate()).toBe(15)

    const br = fromBrDashDate('15-07-2026')!
    expect(toIsoDate(br)).toBe('2026-07-15')
  })

  it('parse inválido retorna null', () => {
    expect(fromIsoDate('15/07/2026')).toBeNull()
    expect(fromBrDashDate('2026-07-15')).toBeNull()
  })
})
