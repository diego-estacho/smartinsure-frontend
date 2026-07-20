export default defineEventHandler(async (event) => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const { id, addressId } = getRouterParams(event)
  const token = getCookie(event, 'sessao')

  return await $fetch(`/api/v1/policy-holders/${id}/addresses/${addressId}`, {
    baseURL: backendBaseUrl,
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
