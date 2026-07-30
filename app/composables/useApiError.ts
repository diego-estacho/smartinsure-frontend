/**
 * Centraliza o padrão try/catch das chamadas ao `$api`: alterna `loading`, zera/preenche `error` com a
 * mensagem TRATADA pelo backend (extractApiErrorMessage, ADR-011/012) e devolve o resultado (ou
 * `undefined` em erro). Remove o boilerplate repetido de `loading`/`try`/`catch`/`finally` nas telas.
 *
 * Instancie um por ação independente do componente (ex.: uma para carregar, outra para "Baixar minuta")
 * — cada um tem seu próprio `loading`/`error`.
 */
import { extractApiErrorMessage } from '~/lib/apiError'

export function useApiError() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Roda `fn` com `loading` ligado; em falha, guarda a mensagem tratada em `error` e devolve `undefined`. */
  async function run<T>(fn: () => Promise<T>, fallback: string): Promise<T | undefined> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    }
    catch (err) {
      error.value = extractApiErrorMessage(err, fallback)
      return undefined
    }
    finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}
