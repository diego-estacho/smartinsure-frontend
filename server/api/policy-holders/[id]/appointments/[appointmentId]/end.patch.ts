import type { components } from '~/types/gen/api'

type PolicyHolderAppointmentResponse = components['schemas']['PolicyHolderAppointmentResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderAppointmentResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const { id, appointmentId } = getRouterParams(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<PolicyHolderAppointmentResponse>(
    `/api/v1/policy-holders/${id}/appointments/${appointmentId}/end`,
    {
      baseURL: backendBaseUrl,
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
})
