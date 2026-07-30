/**
 * Mensagem de erro de API tratada pelo backend (ADR-008/023; ADR-011/012 do produto; RFC 9457 ProblemDetails).
 *
 * **Fonte ÚNICA** de tradução de erro do BFF em texto de UI — a tela NÃO inventa texto de erro: exibe o que
 * o backend tratou e devolveu (errors/detail/title/message). O `fallback` genérico só entra quando o backend
 * não disse nada (falha de rede/timeout, ou resposta sem corpo). Assim, num chamado de suporte, a mensagem
 * que o usuário vê existe no backend (logs/handlers) e é pesquisável — não fica cravada só no front.
 *
 * Ordem de preferência: erro de campo (validação, 400) → `detail` (mensagem da regra/integração) →
 * `title` (categoria) → `message` → `detail`/`message` aninhados (endpoints que embrulham o corpo do
 * provedor). Nada disso e status 403 sem corpo (recusa da policy de rota, não uma ForbiddenException com
 * motivo) → mensagem genérica de permissão; caso contrário, o `fallback` da tela.
 */
interface ProblemDetailsLike {
  detail?: string
  title?: string
  /** Alguns endpoints devolvem a mensagem em `message` (não no ProblemDetails padrão). */
  message?: string
  errors?: Record<string, string[]>
  /** Outros (ex.: busca de CNPJ na Receita) aninham o corpo tratado do provedor em `data`. */
  data?: { detail?: string, message?: string }
}

interface RequestErrorLike {
  status?: number
  response?: { status?: number }
  data?: ProblemDetailsLike
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const requestError = error as RequestErrorLike | null | undefined
  const data = requestError?.data
  const status = requestError?.response?.status ?? requestError?.status

  // Campo (validação) → detail (mensagem da regra/integração) → title (categoria) → message e os
  // detail/message aninhados (endpoints que embrulham o corpo do provedor). Pega o primeiro não-vazio;
  // campos em branco são pulados para não mascarar uma mensagem útil mais adiante.
  const candidates: (string | undefined)[] = [
    ...(data?.errors ? Object.values(data.errors).flat() : []),
    data?.detail,
    data?.title,
    data?.message,
    data?.data?.detail,
    data?.data?.message,
  ]

  const message = candidates.find(candidate => Boolean(candidate?.trim()))
  if (message?.trim()) {
    return message.trim()
  }

  // 403 sem corpo (recusa da policy de rota): permissão genérica, e não o fallback específico da tela —
  // que assumiria um contexto errado. Com corpo, o motivo do servidor já foi usado acima.
  if (status === 403) {
    return 'Você não tem permissão para esta operação.'
  }

  return fallback
}
