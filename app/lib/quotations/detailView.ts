import type { SiStep } from '~/components/ui/SiStepper.vue'
import type { AppIconName } from '~/lib/icons'
import { quotationResults } from '~/lib/status/quotations'

/**
 * View-model da tela de **detalhe** da Cotação (RN-081). O "cenário" é derivado dos **eixos reais** —
 * o resultado classificado (eixo-1, RN-058) + as flags de CCG — e NÃO do vocabulário do protótipo. O
 * card de situação (Stepper + Alert) só existe onde há uma jornada de emissão a mostrar (pronta/ccg);
 * `Analysis`/`Unavailable`/`Unrecognized` abrem read-only, sem stepper e sem ações. A pill/rótulo da
 * situação continua vindo de `lib/status/quotations` (fonte única). Emissão/cancelamento chegam em
 * fatias próprias; nesta, as ações são visíveis mas inertes.
 */
export type QuotationScenario = 'ready' | 'ccg' | 'analysis' | 'unavailable' | 'unrecognized' | 'unknown'

export interface QuotationSituationAlert {
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  text: string
}

export interface QuotationSituationView {
  scenario: QuotationScenario
  hasSituationCard: boolean
  showActions: boolean
  stepper: { steps: SiStep[], current: number } | null
  alert: QuotationSituationAlert | null
}

/** Cenário a partir do resultado (eixo-1) + CCG. `ccg` = exige CCG e ainda não assinado. */
export function getQuotationScenario(
  result: string | null | undefined, requiresCcg: boolean, ccgSigned: boolean): QuotationScenario {
  if (result === quotationResults.readyForEmission) {
    return requiresCcg && !ccgSigned ? 'ccg' : 'ready'
  }
  if (result === quotationResults.analysis) return 'analysis'
  if (result === quotationResults.unavailable) return 'unavailable'
  if (result === quotationResults.unrecognized) return 'unrecognized'
  return 'unknown'
}

/**
 * Card de situação por cenário. Textos dos Alerts são **verbatim** do protótipo homologado
 * (`CotacaoDetalhePage.dc.html` → `renderVals`). `createdAtLabel` alimenta a descrição do passo "Cotada".
 */
export function getDetailSituationView(
  result: string | null | undefined,
  requiresCcg: boolean,
  ccgSigned: boolean,
  createdAtLabel: string,
): QuotationSituationView {
  const scenario = getQuotationScenario(result, requiresCcg, ccgSigned)
  const cotada: SiStep = { label: 'Cotada', description: createdAtLabel }

  if (scenario === 'ready') {
    return {
      scenario,
      hasSituationCard: true,
      showActions: true,
      stepper: { steps: [cotada, { label: 'Pronta para emissão' }], current: 1 },
      alert: {
        type: 'success',
        title: 'Emissão liberada',
        text: 'A seguradora aprovou o risco e não há pendências. Confira os dados e emita a apólice — o documento fica disponível em Apólices logo após a confirmação.',
      },
    }
  }

  if (scenario === 'ccg') {
    return {
      scenario,
      hasSituationCard: true,
      showActions: true,
      stepper: {
        steps: [cotada, { label: 'Assinatura do CCG' }, { label: 'Pronta para emissão' }],
        current: 1,
      },
      alert: {
        type: 'warning',
        title: 'Pendência de CCG',
        text: 'Esta cotação exige contrato de contragarantia. A emissão da apólice só é liberada após a assinatura do CCG junto à seguradora — assim que a seguradora registrar a assinatura, o status muda aqui.',
      },
    }
  }

  // Analysis / Unavailable / Unrecognized / unknown: read-only puro — pill + Resumo + Cronologia.
  return { scenario, hasSituationCard: false, showActions: false, stepper: null, alert: null }
}

/** Aparência de um marco da cronologia (RN-081), pelo **nome estável** do tipo (o backend só manda o tipo). */
export interface QuotationTimelineView {
  label: string
  icon: AppIconName
  tone: 'positive' | 'attention' | 'neutral'
}

const timelineViews: Record<string, QuotationTimelineView> = {
  QuotationCreated: { label: 'Cotação criada', icon: 'fileText', tone: 'neutral' },
  QuotationObtained: { label: 'Cotação obtida da seguradora', icon: 'circleCheck', tone: 'positive' },
  CcgRequired: { label: 'Exige contragarantia (CCG)', icon: 'alertTriangle', tone: 'attention' },
}

export function getTimelineEventView(type: string): QuotationTimelineView {
  return timelineViews[type] ?? { label: type, icon: 'info', tone: 'neutral' }
}
