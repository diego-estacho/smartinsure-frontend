/**
 * Dev-auth (ADR-009): sessão sintética para dev local e E2E, sem o provedor real.
 * Só responde com NUXT_DEV_AUTH_ENABLED=true — padrão desligado, proibido em produção.
 */
export default defineEventHandler((event): { ok: true } => {
  const { devAuthEnabled } = useRuntimeConfig(event)

  // Nitro converte o valor da env com destr: "true" chega como boolean.
  if (String(devAuthEnabled) !== 'true') {
    throw createError({ statusCode: 404, statusMessage: 'Não encontrado.' })
  }

  setCookie(event, 'sessao', 'dev-sessao-sintetica', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return { ok: true }
})
