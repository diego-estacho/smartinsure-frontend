import { describe, expect, it } from 'vitest'
import {
  getDetailSituationView,
  getQuotationScenario,
  getTimelineEventView,
} from '~/lib/quotations/detailView'

/**
 * RN-081 — view-model do detalhe da Cotação. O cenário deriva dos eixos reais (resultado + flags de CCG),
 * nunca do vocabulário do protótipo; o card de situação (stepper + alert) só existe em pronta/ccg. Estes
 * testes blindam o mapa contra regressão silenciosa (cenário, copy verbatim dos alerts, cronologia).
 */

describe('RN-081 · cenário derivado dos eixos reais (resultado + CCG)', () => {
  it('ReadyForEmission sem CCG → ready', () => {
    expect(getQuotationScenario('ReadyForEmission', false, false)).toBe('ready')
  })

  it('ReadyForEmission com CCG exigido e não assinado → ccg', () => {
    expect(getQuotationScenario('ReadyForEmission', true, false)).toBe('ccg')
  })

  it('ReadyForEmission com CCG já assinado → ready (a pendência caiu)', () => {
    expect(getQuotationScenario('ReadyForEmission', true, true)).toBe('ready')
  })

  it('demais resultados mapeiam para o próprio eixo-1; desconhecido → unknown', () => {
    expect(getQuotationScenario('Analysis', false, false)).toBe('analysis')
    expect(getQuotationScenario('Unavailable', false, false)).toBe('unavailable')
    expect(getQuotationScenario('Unrecognized', false, false)).toBe('unrecognized')
    expect(getQuotationScenario('Cancelada', false, false)).toBe('unknown')
    expect(getQuotationScenario(null, false, false)).toBe('unknown')
  })
})

describe('RN-081 · card de situação (só pronta/ccg) com copy verbatim', () => {
  it('ready: stepper de 2 passos (atual 1), alert success "Emissão liberada", ações visíveis', () => {
    const view = getDetailSituationView('ReadyForEmission', false, false, '10/07/2026 09:00')
    expect(view.hasSituationCard).toBe(true)
    expect(view.showActions).toBe(true)
    expect(view.stepper).toEqual({
      steps: [
        { label: 'Cotada', description: '10/07/2026 09:00' },
        { label: 'Pronta para emissão' },
      ],
      current: 1,
    })
    expect(view.alert?.type).toBe('success')
    expect(view.alert?.title).toBe('Emissão liberada')
  })

  it('ccg: stepper de 3 passos, alert warning "Pendência de CCG" e ações ainda visíveis (CCG não trava)', () => {
    const view = getDetailSituationView('ReadyForEmission', true, false, '10/07/2026 09:00')
    expect(view.hasSituationCard).toBe(true)
    expect(view.showActions).toBe(true)
    expect(view.stepper?.steps).toHaveLength(3)
    expect(view.stepper?.current).toBe(1)
    expect(view.alert?.type).toBe('warning')
    expect(view.alert?.title).toBe('Pendência de CCG')
  })

  it('Analysis/Unavailable/Unrecognized: read-only puro — sem card de situação, sem ações', () => {
    for (const result of ['Analysis', 'Unavailable', 'Unrecognized']) {
      const view = getDetailSituationView(result, false, false, '10/07/2026 09:00')
      expect(view.hasSituationCard).toBe(false)
      expect(view.showActions).toBe(false)
      expect(view.stepper).toBeNull()
      expect(view.alert).toBeNull()
    }
  })
})

describe('RN-081 · aparência dos marcos da cronologia (por tipo estável)', () => {
  it('tipos conhecidos → rótulo/ícone/tom estáveis', () => {
    expect(getTimelineEventView('QuotationCreated')).toEqual({
      label: 'Cotação criada', icon: 'fileText', tone: 'neutral',
    })
    expect(getTimelineEventView('QuotationObtained')).toEqual({
      label: 'Cotação obtida da seguradora', icon: 'circleCheck', tone: 'positive',
    })
    expect(getTimelineEventView('CcgRequired')).toEqual({
      label: 'Exige contragarantia (CCG)', icon: 'alertTriangle', tone: 'attention',
    })
  })

  it('tipo desconhecido não quebra a tela — cai num fallback neutro', () => {
    const view = getTimelineEventView('AlgoNovo')
    expect(view.tone).toBe('neutral')
    expect(view.icon).toBe('info')
  })
})
