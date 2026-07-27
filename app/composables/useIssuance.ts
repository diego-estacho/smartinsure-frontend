/**
 * Emissão da apólice (etapa 5) — **MOCK** (exec-plan 0015). Simula o processamento e devolve um
 * identificador de apólice. TODO(backend): trocar por
 * `POST emissao { ofertaId, contrato, clausulas, minuta, pagamento, aceite }` → `{ policyId, status }`.
 */
export interface IssuanceResult {
  policyId: string
  status: string
}

/** Atraso do mock (ms); exportado para os testes usarem 0. */
export const MOCK_ISSUE_DELAY_MS = 1800

export function useIssuance() {
  async function issue(options: { delayMs?: number } = {}): Promise<IssuanceResult> {
    const delay = options.delayMs ?? MOCK_ISSUE_DELAY_MS
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
    return { policyId: 'AP-2026-0481', status: 'issued' }
  }

  return { issue }
}
