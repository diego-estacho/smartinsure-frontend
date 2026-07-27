import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type PolicyHolderAppointmentResponse = components['schemas']['PolicyHolderAppointmentResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderAppointmentResponse> => {
  const { id, appointmentId } = getRouterParams(event)

  return await proxyBackend<PolicyHolderAppointmentResponse>(event, `/api/v1/policy-holders/${id}/appointments/${appointmentId}/end`, {
    method: 'PATCH',
  })
})
