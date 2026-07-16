/**
 * Guarda de rota global (ADR-007): sem sessão local, toda página exige login.
 * Cortesia de UI — a garantia de autorização é do backend a cada chamada.
 */
const publicPaths = ['/login']

export default defineNuxtRouteMiddleware(async (to) => {
  if (publicPaths.includes(to.path) || to.path === '/dev' || to.path.startsWith('/dev/')) {
    return
  }

  const requestFetch = useRequestFetch()
  const session = await requestFetch('/api/auth/session').catch(() => ({ authenticated: false }))

  if (!session.authenticated) {
    return navigateTo('/login')
  }
})
