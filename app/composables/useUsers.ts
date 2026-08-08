import type { components } from '~/types/gen/api'

export type CreateUserRequest = components['schemas']['CreateUserRequest']
export type CreateUserResponse = components['schemas']['CreateUserResponse']
export type UserListResponse = components['schemas']['ListUsersResponse']
export type UserListItem = components['schemas']['UserListItemResponse']
export type UserStatusCounts = components['schemas']['UserStatusCountsResponse']
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
export type ResendInvitationResponse = components['schemas']['ResendInvitationResponse']
export type ChangeUserActivationResponse = components['schemas']['ChangeUserActivationResponse']
export type EditUserBody = components['schemas']['EditUserBody']
export type EditUserResponse = components['schemas']['EditUserResponse']
export type ChangeUserScopeProfileBody = components['schemas']['ChangeUserScopeProfileBody']
export type ChangeUserScopeProfileResponse = components['schemas']['ChangeUserScopeProfileResponse']
export type SetUserProfileBody = components['schemas']['SetUserProfileBody']
export type SetUserProfileResponse = components['schemas']['SetUserProfileResponse']

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
    profileId?: string
    scope?: string
    linkId?: string
    registeredFrom?: string
    registeredTo?: string
  } = {}): Promise<UserListResponse> {
    return await api<UserListResponse>('/api/users', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.search ? { search: params.search } : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.profileId ? { profileId: params.profileId } : {}),
        ...(params.scope ? { scope: params.scope } : {}),
        ...(params.linkId ? { linkId: params.linkId } : {}),
        ...(params.registeredFrom ? { registeredFrom: params.registeredFrom } : {}),
        ...(params.registeredTo ? { registeredTo: params.registeredTo } : {}),
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

  /**
   * RN-065: reenvia o Convite de primeiro acesso (Pendente/Convite expirado). Vai para o mesmo
   * e-mail — é o caminho do caso "não recebi o convite"; o servidor renova o link e a validade.
   */
  async function resendInvitation(id: string): Promise<ResendInvitationResponse> {
    return await api<ResendInvitationResponse>(`/api/users/${id}/invitations/resend`, {
      method: 'POST',
    })
  }

  /** RN-076: inativa o Usuário (a decisão e a transição de situação são do servidor). */
  async function inactivateUser(id: string): Promise<ChangeUserActivationResponse> {
    return await api<ChangeUserActivationResponse>(`/api/users/${id}/inactivate`, {
      method: 'POST',
    })
  }

  /** RN-076: reativa o Usuário. */
  async function reactivateUser(id: string): Promise<ChangeUserActivationResponse> {
    return await api<ChangeUserActivationResponse>(`/api/users/${id}/reactivate`, {
      method: 'POST',
    })
  }

  /**
   * RN-202: edita o Usuário. O nome é sempre atualizado; informar `email` só tem efeito enquanto
   * o Usuário está Pendente — o servidor troca a identidade e reenvia o Convite. Enviar `email`
   * para um Usuário Ativo/Inativo é recusado pelo servidor (§9).
   */
  async function editUser(id: string, body: EditUserBody): Promise<EditUserResponse> {
    return await api<EditUserResponse>(`/api/users/${id}`, {
      method: 'PUT',
      body,
    })
  }

  /** RN-075: troca o Perfil do Usuário no vínculo (Corretora/Tomador). */
  async function changeScopeProfile(
    id: string,
    body: ChangeUserScopeProfileBody,
  ): Promise<ChangeUserScopeProfileResponse> {
    return await api<ChangeUserScopeProfileResponse>(`/api/users/${id}/scope-profile`, {
      method: 'PUT',
      body,
    })
  }

  /** RN-012: concede/revoga o Perfil no Escopo Sistema (`profile` nulo revoga). */
  async function setUserProfile(id: string, profile: string | null): Promise<SetUserProfileResponse> {
    return await api<SetUserProfileResponse>(`/api/users/${id}/profile`, {
      method: 'PUT',
      body: { profile } satisfies SetUserProfileBody,
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
    resendInvitation,
    inactivateUser,
    reactivateUser,
    editUser,
    changeScopeProfile,
    setUserProfile,
  }
}
