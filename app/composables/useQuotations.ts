/**
 * Cotações (Quotation) da etapa 4 — ligado ao backend real (RN-056..061, ADR-064). Substitui o mock:
 * dispara `POST /api/quotation-groups/{id}/quotations` (202) e faz **polling** de
 * `GET /api/quotation-groups/{id}/quotations` até concluir (ADR-051), traduzindo o resultado para o
 * modelo da tela (available/unavailable). O nome da Seguradora vem do catálogo (`useInsurers`).
 *
 * Tipos do contrato ainda hand-written (interim): a regeneração de `types/gen/api` (types:gen) depende
 * do OpenAPI regenerado do backend — trocar por `components['schemas'][...]` quando existir.
 */
export type QuotationStatus = 'auto' | 'analise'

export interface Quotation {
  id: string
  name: string
  premio: number
  comissao: number
  limite: number
  status: QuotationStatus
  taxa: number
  tags: string[]
  /** Rótulo específico do resultado (ex.: "Requer análise de subscrição") — RN-058. */
  statusLabel: string
  /** RN-058/ADR-064: a Seguradora exige Contragarantia (CCG) para emitir. */
  requiresCcg: boolean
}

export interface UnavailableQuotation {
  id: string
  name: string
  reason: string
}

export interface QuotationsResult {
  available: Quotation[]
  unavailable: UnavailableQuotation[]
}

/** Rótulo/cor do status por nome estável (ADR-004). */
export const quotationStatusView: Record<QuotationStatus, { label: string, color: string }> = {
  auto: { label: 'Emissão automática', color: 'success' },
  analise: { label: 'Requer análise', color: 'warning' },
}

// ── Contrato do backend (interim, camelCase do System.Text.Json) ──
interface BackendQuotationItem {
  id: string
  insurerId: string
  processingStatus: string
  result: string | null
  analysisTrack: string | null
  premium: number | null
  commissionPercentage: number | null
  commissionValue: number | null
  tax: number | null
  availableLimit: number | null
  requiresCcg: boolean
  ccgMaxLimitWithoutNeed: number | null
  ccgSigned: boolean
  isFollowable: boolean
  obtainedAt: string | null
  reasons: string[]
}

interface BackendQuotationsStatus {
  quotationGroupId: string
  selectedQuotationId: string | null
  total: number
  completed: boolean
  quotations: BackendQuotationItem[]
}

const ANALYSIS_TRACK_LABEL: Record<string, string> = {
  Underwriting: 'subscrição',
  Credit: 'crédito',
  Pep: 'PEP',
  Reinsurance: 'resseguro',
  Registration: 'cadastro',
}

function resultLabel(item: BackendQuotationItem): string {
  if (item.result === 'Automatic') return 'Emissão automática'
  if (item.result === 'Analysis') {
    const track = item.analysisTrack ? ANALYSIS_TRACK_LABEL[item.analysisTrack] : null
    return track ? `Requer análise de ${track}` : 'Requer análise'
  }
  return 'Indisponível'
}

export interface FetchQuotationsInput {
  groupId: string
  brokerageId: string
  /** Intervalo do polling (ms). Testes passam 0. */
  pollIntervalMs?: number
}

export function useQuotations() {
  // Assinatura frouxa (interim): os endpoints de cotação ainda não estão no schema gerado, então o
  // cliente tipado rejeitaria os métodos. Trocar por `useNuxtApp().$api` tipado após o types:gen.
  const api = useNuxtApp().$api as <T = unknown>(url: string, options?: Record<string, unknown>) => Promise<T>
  const { listInsurers } = useInsurers()

  async function fetchQuotations(input: FetchQuotationsInput): Promise<QuotationsResult> {
    // 1. Dispara o fan-out (202) — RN-056.
    await api(`/api/quotation-groups/${input.groupId}/quotations`, {
      method: 'POST',
      body: { brokerageId: input.brokerageId },
    })

    // 2. Nome da Seguradora pelo catálogo (id → nome).
    const insurersResp = await listInsurers({ pageSize: 200, includeInactive: true })
    const nameById = new Map<string, string>()
    for (const raw of (insurersResp.items ?? [])) {
      const item = raw as unknown as { id?: string, corporateName?: string, tradeName?: string, name?: string }
      if (item.id) nameById.set(item.id, item.corporateName ?? item.tradeName ?? item.name ?? item.id)
    }

    // 3. Polling até concluir (ADR-051).
    const interval = input.pollIntervalMs ?? 2500
    let status: BackendQuotationsStatus
    do {
      status = await api<BackendQuotationsStatus>(
        `/api/quotation-groups/${input.groupId}/quotations`, { method: 'GET' })
      if (!status.completed && interval > 0) {
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    } while (!status.completed)

    // 4. Traduz para o modelo da tela.
    const available: Quotation[] = []
    const unavailable: UnavailableQuotation[] = []

    for (const item of status.quotations) {
      const name = nameById.get(item.insurerId) ?? item.insurerId
      const isPositive = item.result === 'Automatic' || item.result === 'Analysis'

      if (isPositive) {
        available.push({
          id: item.id,
          name,
          premio: item.premium ?? 0,
          comissao: item.commissionPercentage ?? 0,
          limite: item.availableLimit ?? 0,
          status: item.result === 'Automatic' ? 'auto' : 'analise',
          taxa: item.tax ?? 0,
          tags: [],
          statusLabel: resultLabel(item),
          requiresCcg: item.requiresCcg,
        })
      }
      else {
        unavailable.push({
          id: item.id,
          name,
          reason: item.reasons[0] ?? 'Sem capacidade para este tomador.',
        })
      }
    }

    return { available, unavailable }
  }

  return { fetchQuotations }
}
