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

  // 403 do backend vem com o motivo real no ProblemDetails (ex.: "Este perfil não pertence ao
  // escopo que você administra", "Somente o Corretor Administrador da corretora ativa executa
  // esta operação"). Mostrar o motivo do servidor, e não um texto fixo que assumiria sempre o
  // Administrador do Sistema. Quando a recusa vem da policy de rota, não há corpo — daí o genérico.
  if (status === 400 || status === 403 || status === 404 || status === 409) {
    const problem = requestError?.data
    const message = problem?.detail?.trim() || problem?.title?.trim()
    if (message) {
      return message
    }

    if (status === 403) {
      return 'Você não tem permissão para esta operação.'
    }
  }

  return fallback
}
