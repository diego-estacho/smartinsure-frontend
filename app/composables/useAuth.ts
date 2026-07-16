import type { components } from '~/types/gen/api'

export type AuthenticateUserRequest = components['schemas']['AuthenticateUserRequest']

/**
 * Sessão da plataforma (RN-005, ADR-007): login e logout sempre via BFF do Nitro
 * (ADR-008) — o token vive em cookie httpOnly e nunca é visível aqui.
 */
export function useAuth() {
  async function login(request: AuthenticateUserRequest): Promise<void> {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: request,
    })
  }

  async function logout(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
  }

  return { login, logout }
}
