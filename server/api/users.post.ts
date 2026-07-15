import type { components } from '~/types/gen/api'

type CreateUserRequest = components['schemas']['CreateUserRequest']
type CreateUserResponse = components['schemas']['CreateUserResponse']

/**
 * BFF da criação de Usuário (RN-001, ADR-008): o browser fala com esta rota; o
 * servidor injeta o token da sessão (cookie httpOnly, ADR-007) na chamada ao backend.
 * Nenhuma decisão de negócio aqui — quem valida e decide é o servidor .NET.
 */
export default defineEventHandler(async (event): Promise<CreateUserResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<CreateUserRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreateUserResponse>('/api/v1/users', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
