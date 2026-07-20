import type { components } from '~/types/gen/api'

type CreatePolicyHolderAppointmentBody = components['schemas']['CreatePolicyHolderAppointmentBody']
type CreatePolicyHolderAppointmentResponse = components['schemas']['CreatePolicyHolderAppointmentResponse']

export default defineEventHandler(async (event): Promise<CreatePolicyHolderAppointmentResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const { id } = getRouterParams(event)
  const body = await readBody<CreatePolicyHolderAppointmentBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreatePolicyHolderAppointmentResponse>(
    `/api/v1/policy-holders/${id}/appointments`,
    {
      baseURL: backendBaseUrl,
      method: 'POST',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
})
