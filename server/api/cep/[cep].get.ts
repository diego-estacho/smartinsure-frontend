/**
 * BFF (ADR-008): busca de endereço por CEP via ViaCEP (público). Server-side para evitar CORS e
 * manter o browser sem falar com terceiros direto. Usado no "novo endereço" do segurado para
 * facilitar o preenchimento. Normaliza o retorno do ViaCEP para o formato do formulário.
 */
interface ViaCepResponse {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean | string
}

export default defineEventHandler(async (event) => {
  const digits = (getRouterParam(event, 'cep') ?? '').replace(/\D/g, '')

  // Casos de negócio (CEP inválido / não encontrado) voltam com HTTP 200 + { error },
  // pois o consumidor faz `const data = await $fetch(...)` e trata `if (data.error)` —
  // ramo só alcançável em 2xx. 5xx fica reservado a falha real de transporte do ViaCEP.
  if (digits.length !== 8) {
    return { error: 'CEP inválido.' }
  }

  try {
    const data = await $fetch<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`)

    if (data?.erro) {
      return { error: 'CEP não encontrado.' }
    }

    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    }
  }
  catch {
    setResponseStatus(event, 502)
    return { error: 'Não foi possível consultar o CEP.' }
  }
})
