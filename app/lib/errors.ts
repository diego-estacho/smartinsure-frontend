/**
 * Mensagem de erro de requisição ao BFF (ADR-008). A decisão de permissão e de regra é do
 * servidor (SECURITY do produto): o front apenas traduz a recusa em texto — nunca decide acesso
 * nem reimplementa a regra. Recusa de negócio (400/404/409) chega como ProblemDetails (RFC 9457)
 * e a mensagem exibida é a do servidor.
 */
type ProblemDetails = { title?: string, detail?: string }

type RequestError = {
  status?: number
  response?: { status?: number }
  data?: ProblemDetails
}

export function describeRequestError(error: unknown, fallback: string): string {
  const requestError = error as RequestError
  const status = requestError?.response?.status ?? requestError?.status

  if (status === 403) {
    return 'Acesso restrito ao Administrador do Sistema.'
  }

  if (status === 400 || status === 404 || status === 409) {
    const problem = requestError?.data
    const message = problem?.detail?.trim() || problem?.title?.trim()
    if (message) {
      return message
    }
  }

  return fallback
}
