import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreatePolicyHolderBranchBody = components['schemas']['CreatePolicyHolderBranchBody']
type CreatePolicyHolderBranchResponse = components['schemas']['CreatePolicyHolderBranchResponse']

/**
 * Registra a Filial por CNPJ via Birô e a vincula à matriz. O backend responde 201 (branchId
 * presente) ou 200 (branchId nulo + notice, CNPJ não achado no Birô) — ambos são sucesso HTTP.
 * `proxyBackend` só define status na via de erro (`setResponseStatus` no catch); no caminho de
 * sucesso o H3 responde 200 sempre, então a distinção 201×200 do backend não chega ao cliente —
 * a tela decide olhando o CORPO (`branchId` × `notice`), nunca o status (ADR-004/ADR-008).
 */
export default defineEventHandler(async (event): Promise<CreatePolicyHolderBranchResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<CreatePolicyHolderBranchBody>(event)

  return await proxyBackend<CreatePolicyHolderBranchResponse>(event, `/api/v1/policy-holders/${id}/branches`, {
    method: 'POST',
    body,
  })
})
