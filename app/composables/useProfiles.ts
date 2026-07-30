import type { components } from '~/types/gen/api'

export type ProfileListResponse = components['schemas']['PagedResponseOfProfileListItemResponse']
export type ProfileListItem = components['schemas']['ProfileListItemResponse']
export type GetProfileResponse = components['schemas']['GetProfileResponse']
export type ProfilePermission = components['schemas']['ProfilePermissionResponse']
export type AssignableProfile = components['schemas']['AssignableProfileResponse']
export type ScopedProfileBody = components['schemas']['ScopedProfileBody']
export type CreateScopedProfileResponse = components['schemas']['CreateScopedProfileResponse']
export type UpdateScopedProfileResponse = components['schemas']['UpdateScopedProfileResponse']
export type Permission = components['schemas']['PermissionResponse']
export type FixedProfilePermissionsBody = components['schemas']['FixedProfilePermissionsBody']
export type UpdateFixedProfilePermissionsResponse = components['schemas']['UpdateFixedProfilePermissionsResponse']

/**
 * Acesso a dados da jornada Perfis e Permissões (RN-062/RN-063): leitura do catálogo de
 * Perfis via BFF do Nitro (ADR-008), tipada pelo contrato gerado. Somente leitura — a
 * edição de Permissões é decisão do servidor e ainda não está liberada.
 */
export function useProfiles(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listProfiles(params: {
    page?: number
    pageSize?: number
    search?: string
    scope?: string
  } = {}): Promise<ProfileListResponse> {
    return await api<ProfileListResponse>('/api/profiles', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.search ? { search: params.search } : {}),
        ...(params.scope ? { scope: params.scope } : {}),
      },
    })
  }

  async function getProfile(id: string): Promise<GetProfileResponse> {
    return await api<GetProfileResponse>(`/api/profiles/${id}`, {
      method: 'GET',
    })
  }

  /**
   * RN-072: perfis que o solicitante pode atribuir na criação de Usuário, dentro do escopo ativo.
   * Quem decide a lista é o servidor — o front só oferece o que recebeu.
   */
  async function listAssignableProfiles(): Promise<AssignableProfile[]> {
    return await api<AssignableProfile[]>('/api/profiles/assignable', { method: 'GET' })
  }

  /** RN-063: catálogo fixo de permissões — a lista oferecida ao montar um perfil. */
  async function listPermissions(): Promise<Permission[]> {
    return await api<Permission[]>('/api/permissions', { method: 'GET' })
  }

  /**
   * RN-069/RN-070: cria perfil customizado no escopo ativo. O escopo não é enviado — vem do
   * acesso; o servidor recusa nome repetido no mesmo escopo e permissão fora do catálogo.
   */
  async function createProfile(body: ScopedProfileBody): Promise<CreateScopedProfileResponse> {
    return await api<CreateScopedProfileResponse>('/api/profiles', { method: 'POST', body })
  }

  /** RN-074: edita nome e permissões de perfil customizado do próprio escopo. */
  async function updateProfile(
    id: string,
    body: ScopedProfileBody,
  ): Promise<UpdateScopedProfileResponse> {
    return await api<UpdateScopedProfileResponse>(`/api/profiles/${id}`, { method: 'PUT', body })
  }

  /** RN-074: remove perfil customizado — o servidor recusa se houver usuário com ele. */
  async function deleteProfile(id: string): Promise<void> {
    await api(`/api/profiles/${id}`, { method: 'DELETE' })
  }

  /**
   * RN-073: o Administrador do Sistema marca/desmarca permissões de perfil fixo — efeito global.
   * Nome e escopo do perfil fixo são imutáveis, por isso só as permissões vão no corpo.
   */
  async function updateFixedProfilePermissions(
    id: string,
    body: FixedProfilePermissionsBody,
  ): Promise<UpdateFixedProfilePermissionsResponse> {
    return await api<UpdateFixedProfilePermissionsResponse>(`/api/profiles/${id}/permissions`, {
      method: 'PUT',
      body,
    })
  }

  return {
    listProfiles,
    getProfile,
    listAssignableProfiles,
    listPermissions,
    createProfile,
    updateProfile,
    deleteProfile,
    updateFixedProfilePermissions,
  }
}
