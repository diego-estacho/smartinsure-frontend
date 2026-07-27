import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreatePolicyHolderAppointmentBody = components['schemas']['CreatePolicyHolderAppointmentBody']
type CreatePolicyHolderAppointmentResponse = components['schemas']['CreatePolicyHolderAppointmentResponse']

export default defineEventHandler(async (event): Promise<CreatePolicyHolderAppointmentResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<CreatePolicyHolderAppointmentBody>(event)

  return await proxyBackend<CreatePolicyHolderAppointmentResponse>(event, `/api/v1/policy-holders/${id}/appointments`, {
    method: 'POST',
    body,
  })
})
