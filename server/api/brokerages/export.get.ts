/**
 * BFF da exportação de Corretoras (RN-018): baixa o .xlsx gerado pelo backend repassando os
 * mesmos filtros da listagem. Devolve o binário com os cabeçalhos de download (server-only, ADR-008).
 */
export default defineEventHandler(async (event) => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  const response = await $fetch.raw('/api/v1/brokerages/export', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    responseType: 'arrayBuffer',
  })

  setHeader(
    event,
    'content-type',
    response.headers.get('content-type')
    ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  setHeader(
    event,
    'content-disposition',
    response.headers.get('content-disposition') ?? 'attachment; filename="corretoras.xlsx"',
  )

  return Buffer.from(response._data as ArrayBuffer)
})
