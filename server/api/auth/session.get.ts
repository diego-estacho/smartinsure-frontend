/**
 * Diz se existe sessão local (cookie httpOnly, ADR-007) para a guarda de rota.
 * Cortesia de UI: quem garante a validade do token é o backend a cada chamada.
 */
export default defineEventHandler((event): { authenticated: boolean } => {
  return { authenticated: Boolean(getCookie(event, 'sessao')) }
})
