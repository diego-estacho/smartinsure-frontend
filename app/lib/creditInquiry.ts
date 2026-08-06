/**
 * RN-029/RN-200 — helpers de domínio da Consulta de Crédito.
 *
 * O Motor de Cálculo devolve limites em grupos dinâmicos (GroupType estável). A tela mapeia
 * os grupos conhecidos para as três colunas fixas do design (Tradicional / Judicial / Financeira),
 * compondo o judicial fiscal (`GARANTIA_JUDICIAL_FISCAL`) como taxa fiscal do judicial.
 */
import type { CreditInquiryResultResponse } from '~/composables/useCreditInquiries'

/** GroupType estável informado pela Seguradora (via Motor de Cálculo). */
export const creditLimitGroupTypes = {
  traditional: 'GARANTIA_TRADICIONAL',
  judicial: 'GARANTIA_JUDICIAL',
  judicialFiscal: 'GARANTIA_JUDICIAL_FISCAL',
  financial: 'GARANTIA_FINANCEIRA',
} as const

type LimitGroup = CreditInquiryResultResponse['limits'][number]

/** Coage `number | string | null` (número-como-string do contrato) para número seguro. */
function toNumber(value: string | number | null | undefined): number {
  const parsed = typeof value === 'string' ? Number(value) : (value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function findGroup(result: CreditInquiryResultResponse, groupType: string): LimitGroup | undefined {
  return result.limits.find(limit => limit.groupType === groupType)
}

/** Célula de uma coluna de limite: valor disponível + taxa (e taxa fiscal, no judicial). */
export interface CreditLimitCell {
  available: number
  rate: number
  fiscalRate: number | null
}

/** Bloco de utilizado: valor e percentual sobre a capacidade do grupo líder. */
export interface CreditUsedCell {
  value: number
  percent: number
}

/** Linha do quadro consolidado, já mapeada para as colunas fixas do design. */
export interface CreditInquiryRow {
  insurerId: string
  insurerName: string
  insurerLogoUrl: string | null
  status: string
  failureReason: string | null
  responseTimeMs: number | null
  traditional: CreditLimitCell | null
  judicial: CreditLimitCell | null
  financial: CreditLimitCell | null
  used: CreditUsedCell | null
  maxAvailable: number
}

function toLimitCell(group: LimitGroup | undefined, fiscalGroup?: LimitGroup): CreditLimitCell | null {
  if (!group) {
    return null
  }
  return {
    available: toNumber(group.availableLimit),
    rate: toNumber(group.rate),
    fiscalRate: fiscalGroup ? toNumber(fiscalGroup.rate) : null,
  }
}

/** Grupo com o maior limite disponível (usado no consolidado e no bloco Utilizado). */
function leadingGroup(result: CreditInquiryResultResponse): LimitGroup | undefined {
  return result.limits.reduce<LimitGroup | undefined>((leader, current) => {
    if (!leader) {
      return current
    }
    return toNumber(current.availableLimit) > toNumber(leader.availableLimit) ? current : leader
  }, undefined)
}

export function buildCreditInquiryRow(result: CreditInquiryResultResponse): CreditInquiryRow {
  const traditional = findGroup(result, creditLimitGroupTypes.traditional)
  const judicial = findGroup(result, creditLimitGroupTypes.judicial)
  const judicialFiscal = findGroup(result, creditLimitGroupTypes.judicialFiscal)
  const financial = findGroup(result, creditLimitGroupTypes.financial)

  // O judicial fiscal é grupo separado no motor; compõe a coluna Judicial como taxa fiscal.
  // Quando só o fiscal existe, ele mesmo vira a coluna Judicial (sem taxa fiscal duplicada).
  const judicialCell = judicial
    ? toLimitCell(judicial, judicialFiscal)
    : toLimitCell(judicialFiscal)

  const leader = leadingGroup(result)
  const maxAvailable = leader ? toNumber(leader.availableLimit) : 0

  let used: CreditUsedCell | null = null
  if (leader) {
    const usedValue = toNumber(leader.usedLimit)
    const capacity = usedValue + toNumber(leader.availableLimit)
    used = {
      value: usedValue,
      percent: capacity > 0 ? Math.round((usedValue / capacity) * 100) : 0,
    }
  }

  return {
    insurerId: result.insurerId,
    insurerName: result.insurerName,
    insurerLogoUrl: result.insurerLogoUrl ?? null,
    status: result.status,
    failureReason: result.failureReason,
    responseTimeMs: result.responseTimeMs == null ? null : Number(result.responseTimeMs),
    traditional: toLimitCell(traditional),
    judicial: judicialCell,
    financial: toLimitCell(financial),
    used,
    maxAvailable,
  }
}

/**
 * Ordenação fixa (RN-029): Aprovado antes de Indisponível; dentro do grupo, por maior
 * limite disponível desc.
 */
export function buildCreditInquiryRows(results: CreditInquiryResultResponse[]): CreditInquiryRow[] {
  return results
    .map(buildCreditInquiryRow)
    .sort((a, b) => {
      const availableRank = Number(b.status === 'Available') - Number(a.status === 'Available')
      if (availableRank !== 0) {
        return availableRank
      }
      return b.maxAvailable - a.maxAvailable
    })
}

/** Detecta um CNPJ digitado (14 dígitos) para consultar direto, sem passar pela lista. */
export function isCnpjQuery(query: string): boolean {
  return query.replace(/\D/g, '').length === 14
}

/** Tempo de resposta em segundos com 1 casa (pt-BR); `null` → "sem resposta". */
export function formatResponseTime(responseTimeMs: number | null): string | null {
  if (responseTimeMs == null) {
    return null
  }
  const seconds = (responseTimeMs / 1000).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${seconds} s`
}

/** Formato curto de moeda para KPI (ex.: "R$ 3 mi", "R$ 500 mil"). */
export function formatShortCurrencyBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${trimDecimal(value / 1_000_000)} mi`
  }
  if (value >= 1_000) {
    return `R$ ${trimDecimal(value / 1_000)} mil`
  }
  return `R$ ${trimDecimal(value)}`
}

function trimDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

/** Cor da barra de Utilizado por faixa de percentual (verde < 70, atenção 70–89, perigo ≥ 90). */
export function usedBarColor(percent: number): 'success' | 'warning' | 'error' {
  if (percent >= 90) {
    return 'error'
  }
  if (percent >= 70) {
    return 'warning'
  }
  return 'success'
}
