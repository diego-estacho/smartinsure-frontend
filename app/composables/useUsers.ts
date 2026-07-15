import type { components } from '~/types/gen/api'

export type CreateUserRequest = components['schemas']['CreateUserRequest']
export type CreateUserResponse = components['schemas']['CreateUserResponse']

/**
 * Acesso a dados da jornada Usuários (ADR-004): fetch fino tipado pelo contrato
 * gerado, sempre via BFF do Nitro (ADR-008) — nunca o backend direto.
 */
export function useUsers() {
  async function createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return await $fetch<CreateUserResponse>('/api/users', {
      method: 'POST',
      body: request,
    })
  }

  return { createUser }
}
