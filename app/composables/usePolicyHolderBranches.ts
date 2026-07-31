import type { components } from '~/types/gen/api'

export type PolicyHolderBranch = components['schemas']['PolicyHolderBranchResponse']
export type ListPolicyHolderBranchesResponse = components['schemas']['ListPolicyHolderBranchesResponse']
export type CreatePolicyHolderBranchResponse = components['schemas']['CreatePolicyHolderBranchResponse']

/**
 * Filial (estabelecimento do Tomador matriz) — lista as Filiais já registradas e registra uma nova
 * por CNPJ via Birô, vinculando-a à matriz (Task 6/RN correspondente). O servidor decide o desfecho
 * e o composable só repassa o corpo da resposta, sem reinterpretar regra de negócio no cliente
 * (ADR-004): `branchId` presente é o caminho feliz (backend responde 201); `branchId` nulo com
 * `notice` preenchido é o Birô não achando aquele CNPJ — um retorno não-erro (backend responde 200)
 * em que a matriz permanece usável. Os dois campos já vêm no corpo, então a tela (Task 10) decide
 * olhando pra eles — não precisa inspecionar o status HTTP. Acesso a dados só pelo BFF Nitro (ADR-008).
 */
export function usePolicyHolderBranches(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listBranches(policyHolderId: string): Promise<ListPolicyHolderBranchesResponse> {
    return await api<ListPolicyHolderBranchesResponse>(
      `/api/policy-holders/${policyHolderId}/branches`,
      { method: 'GET' },
    )
  }

  async function createBranch(
    policyHolderId: string,
    documentNumber: string,
  ): Promise<CreatePolicyHolderBranchResponse> {
    return await api<CreatePolicyHolderBranchResponse>(
      `/api/policy-holders/${policyHolderId}/branches`,
      { method: 'POST', body: { documentNumber } },
    )
  }

  return { listBranches, createBranch }
}
