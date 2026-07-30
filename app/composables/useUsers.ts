import type { components } from '~/types/gen/api'

export type CreateUserRequest = components['schemas']['CreateUserRequest']
export type CreateUserResponse = components['schemas']['CreateUserResponse']
export type UserListResponse = components['schemas']['PagedResponseOfUserListItemResponse']
export type UserListItem = components['schemas']['UserListItemResponse']
export type GetUserResponse = components['schemas']['GetUserResponse']
export type UserMembership = components['schemas']['UserMembershipResponse']
export type InviteBrokerageAdministratorRequest = components['schemas']['InviteBrokerageAdministratorRequest']
export type InviteBrokerageAdministratorResponse = components['schemas']['InviteBrokerageAdministratorResponse']
export type InvitePolicyHolderAdministratorBody = components['schemas']['InvitePolicyHolderAdministratorBody']
export type InvitePolicyHolderAdministratorResponse = components['schemas']['InvitePolicyHolderAdministratorResponse']
export type InviteBrokerageUserBody = components['schemas']['InviteBrokerageUserBody']
export type InviteBrokerageUserResponse = components['schemas']['InviteBrokerageUserResponse']
export type InvitePolicyHolderUserBody = components['schemas']['InvitePolicyHolderUserBody']
export type InvitePolicyHolderUserResponse = components['schemas']['InvitePolicyHolderUserResponse']

/**
 * Acesso a dados da jornada Usuários (ADR-004): fetch fino tipado pelo contrato
 * gerado, sempre via BFF do Nitro (ADR-008) — nunca o backend direto. Usa o $api
 * (plugin) para que 401 encerre a sessão e leve ao login.
 */
export function useUsers(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return await api<CreateUserResponse>('/api/users', {
      method: 'POST',
      body: request,
    })
  }

  async function listUsers(params: {
    page?: number
    pageSize?: number
    search?: string
    status?: string
  } = {}): Promise<UserListResponse> {
    return await api<UserListResponse>('/api/users', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.search ? { search: params.search } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
    })
  }

  async function getUser(id: string): Promise<GetUserResponse> {
    return await api<GetUserResponse>(`/api/users/${id}`, {
      method: 'GET',
    })
  }

  /**
   * RN-066: convite de Corretor Administrador pelo Administrador do Sistema. O servidor decide
   * tudo (perfil concedido, corretoras válidas, convite de primeiro acesso); o front só coleta a forma.
   */
  async function inviteBrokerageAdministrator(
    request: InviteBrokerageAdministratorRequest,
  ): Promise<InviteBrokerageAdministratorResponse> {
    return await api<InviteBrokerageAdministratorResponse>('/api/users/brokerage-administrators', {
      method: 'POST',
      body: request,
    })
  }

  /**
   * RN-068: o Corretor Administrador cria um Tomador Administrador. A corretora ativa não é
   * enviada — o servidor a lê do acesso.
   */
  async function invitePolicyHolderAdministrator(
    body: InvitePolicyHolderAdministratorBody,
  ): Promise<InvitePolicyHolderAdministratorResponse> {
    return await api<InvitePolicyHolderAdministratorResponse>(
      '/api/users/policy-holder-administrators',
      { method: 'POST', body },
    )
  }

  /** RN-069: o Corretor Administrador cria Usuário na corretora ativa com um perfil do escopo dela. */
  async function inviteBrokerageUser(
    body: InviteBrokerageUserBody,
  ): Promise<InviteBrokerageUserResponse> {
    return await api<InviteBrokerageUserResponse>('/api/users/brokerage-users', {
      method: 'POST',
      body,
    })
  }

  /** RN-070: o Tomador Administrador cria usuário do tomador ativo (o tomador vem do acesso). */
  async function invitePolicyHolderUser(
    body: InvitePolicyHolderUserBody,
  ): Promise<InvitePolicyHolderUserResponse> {
    return await api<InvitePolicyHolderUserResponse>('/api/users/policy-holder-users', {
      method: 'POST',
      body,
    })
  }

  return {
    createUser,
    listUsers,
    getUser,
    inviteBrokerageAdministrator,
    invitePolicyHolderAdministrator,
    inviteBrokerageUser,
    invitePolicyHolderUser,
  }
}
