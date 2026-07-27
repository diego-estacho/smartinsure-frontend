import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreateUserRequest = components['schemas']['CreateUserRequest']
type CreateUserResponse = components['schemas']['CreateUserResponse']

/**
 * BFF da criação de Usuário (RN-001, ADR-008): o browser fala com esta rota; o
 * servidor injeta o token da sessão (cookie httpOnly, ADR-007) na chamada ao backend.
 * Nenhuma decisão de negócio aqui — quem valida e decide é o servidor .NET.
 */
export default defineEventHandler(async (event): Promise<CreateUserResponse> => {
  const body = await readBody<CreateUserRequest>(event)

  return await proxyBackend<CreateUserResponse>(event, '/api/v1/users', {
    method: 'POST',
    body,
  })
})
