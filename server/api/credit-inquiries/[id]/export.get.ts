/**
 * BFF da exportação da Consulta de Crédito (RN-201): baixa o .xlsx gerado pelo backend a partir
 * do id da consulta persistida. Devolve o binário com os cabeçalhos de download (server-only, ADR-008).
 */
export default defineEventHandler(async (event) => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  const response = await $fetch.raw(`/api/v1/credit-inquiries/${id}/export`, {
    baseURL: backendBaseUrl,
    method: 'GET',
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
    response.headers.get('content-disposition') ?? 'attachment; filename="consulta-credito.xlsx"',
  )

  return Buffer.from(response._data as ArrayBuffer)
})
