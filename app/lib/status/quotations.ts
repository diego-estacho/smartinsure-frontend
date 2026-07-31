/**
 * Situação apresentada da Cotação na listagem (RN-078, ADR-004): derivada do **resultado classificado**
 * pelo nome estável do contrato (RN-058), com rótulo pt-BR e cor do DS. Módulo único por domínio, nunca
 * duplicado em componente. "Pronta para emissão" = a Cotação está **apta** a ser emitida pelo corretor
 * (não emissão automática). A situação "Cancelada" (eixo do ciclo de vida da proposta) é Fatia 2.
 */
export const quotationResults = {
  readyForEmission: 'ReadyForEmission',
  analysis: 'Analysis',
  unavailable: 'Unavailable',
  unrecognized: 'Unrecognized',
} as const

export type QuotationResult = typeof quotationResults[keyof typeof quotationResults]

type QuotationSituationView = {
  label: string
  short: string
  color: string
  known: boolean
}

// Q7: verde (success) fica reservado para "Emitida" (Passo 5); azul (info) = "Pronta para emissão".
// `short` é o rótulo da pill na tabela (a coluna Status é estreita — o protótipo encurta de propósito);
// `label` é o rótulo completo (abas, detalhe).
const quotationSituationViews = {
  [quotationResults.readyForEmission]: { label: 'Pronta para emissão', short: 'Pronta', color: 'info' },
  [quotationResults.analysis]: { label: 'Em análise', short: 'Análise', color: 'warning' },
  [quotationResults.unavailable]: { label: 'Indisponível', short: 'Indisponível', color: 'secondary' },
  [quotationResults.unrecognized]: { label: 'Não reconhecida', short: 'Não reconh.', color: 'error' },
} as const satisfies Record<QuotationResult, Omit<QuotationSituationView, 'known'>>

export function isQuotationResult(result: string | null | undefined): result is QuotationResult {
  return result === quotationResults.readyForEmission
    || result === quotationResults.analysis
    || result === quotationResults.unavailable
    || result === quotationResults.unrecognized
}

export function getQuotationSituationView(result: string | null | undefined): QuotationSituationView {
  if (!isQuotationResult(result)) {
    return { label: 'Desconhecida', short: 'Desconhec.', color: 'warning', known: false }
  }

  return { ...quotationSituationViews[result], known: true }
}

/** Abas de situação da listagem: `value: null` = todas. */
export const quotationSituationOptions = [
  { title: 'Todas', value: null },
  { title: 'Pronta para emissão', value: quotationResults.readyForEmission },
  { title: 'Em análise', value: quotationResults.analysis },
  { title: 'Indisponível', value: quotationResults.unavailable },
  { title: 'Não reconhecida', value: quotationResults.unrecognized },
] as const
