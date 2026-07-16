/**
 * Encerra a sessão local removendo o cookie httpOnly (ADR-007). O acesso emitido pelo
 * servidor expira sozinho ao fim das 8 horas (RN-005) — não há revogação remota.
 */
export default defineEventHandler((event): { ok: true } => {
  deleteCookie(event, 'sessao', { path: '/' })

  return { ok: true }
})
