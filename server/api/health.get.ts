/**
 * Rota de saúde do BFF (Nitro, ADR-008). O browser fala com `server/api/`, nunca com
 * o backend .NET direto. Sem domínio — só sinal de vida do ambiente.
 */
export default defineEventHandler(() => ({ status: 'ok' }))
