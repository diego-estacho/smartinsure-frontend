import { proxyBackend } from "~~/server/utils/proxyBackend"
export default defineEventHandler(async (event) => {
  const { id, addressId } = getRouterParams(event)

  return await proxyBackend(event, `/api/v1/policy-holders/${id}/addresses/${addressId}`, {
    method: 'DELETE',
  })
})
