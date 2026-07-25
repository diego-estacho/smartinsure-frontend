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

  if (digits.length !== 8) {
    setResponseStatus(event, 400)
    return { error: 'CEP inválido.' }
  }

  try {
    const data = await $fetch<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`)

    if (data?.erro) {
      setResponseStatus(event, 404)
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
