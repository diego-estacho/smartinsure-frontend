/**
 * Extrai a mensagem de erro TRATADA pelo backend de uma falha do `$api` (BFF → ProblemDetails, ADR-011/012).
 *
 * Princípio (dono da mensagem é o backend): a tela NÃO inventa texto de erro — ela exibe o que o backend
 * tratou e devolveu. O `fallback` genérico só entra quando o backend não disse nada (falha de rede/timeout,
 * ou resposta sem corpo). Assim, num chamado de suporte, a mensagem que o usuário vê existe no backend
 * (logs/handlers) e é pesquisável — não fica cravada só no front.
 *
 * Ordem de preferência: erro de campo (validação, 400) → `detail` (mensagem da regra/integração) →
 * `title` (categoria) → `fallback`.
 */
interface ProblemDetailsLike {
  detail?: string
  title?: string
  errors?: Record<string, string[]>
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: ProblemDetailsLike } | null | undefined)?.data

  // Campo (validação) → detail (mensagem da regra/integração) → title (categoria); pega o primeiro
  // não-vazio. Campos em branco são pulados para não mascarar uma mensagem útil mais adiante.
  const candidates: (string | undefined)[] = [
    ...(data?.errors ? Object.values(data.errors).flat() : []),
    data?.detail,
    data?.title,
  ]

  const message = candidates.find(candidate => Boolean(candidate?.trim()))
  return message?.trim() ? message : fallback
}
