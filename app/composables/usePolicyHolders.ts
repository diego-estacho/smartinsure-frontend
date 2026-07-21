import type { components } from '~/types/gen/api'

export type PolicyHolderListResponse = components['schemas']['PagedResponseOfPolicyHolderListItemResponse']
export type PolicyHolderListItem = components['schemas']['PolicyHolderListItemResponse']
export type CreatePolicyHolderRequest = components['schemas']['CreatePolicyHolderRequest']
export type CreatePolicyHolderResponse = components['schemas']['CreatePolicyHolderResponse']
export type GetPolicyHolderResponse = components['schemas']['GetPolicyHolderResponse']
export type PolicyHolderAddress = components['schemas']['PolicyHolderAddressResponse']
export type AddPolicyHolderAddressBody = components['schemas']['AddPolicyHolderAddressBody']
export type UpdatePolicyHolderAddressBody = components['schemas']['UpdatePolicyHolderAddressBody']
export type CreatePolicyHolderAppointmentBody = components['schemas']['CreatePolicyHolderAppointmentBody']
export type CreatePolicyHolderAppointmentResponse = components['schemas']['CreatePolicyHolderAppointmentResponse']
export type PolicyHolderAppointment = components['schemas']['PolicyHolderAppointmentResponse']

export function usePolicyHolders(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listPolicyHolders(params: {
    page?: number
    pageSize?: number
    search?: string
  } = {}): Promise<PolicyHolderListResponse> {
    return await api<PolicyHolderListResponse>('/api/policy-holders', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.search ? { search: params.search } : {}),
      },
    })
  }

  async function createPolicyHolder(
    request: CreatePolicyHolderRequest,
  ): Promise<CreatePolicyHolderResponse> {
    return await api<CreatePolicyHolderResponse>('/api/policy-holders', {
      method: 'POST',
      body: request,
    })
  }

  async function getPolicyHolder(id: string): Promise<GetPolicyHolderResponse> {
    return await api<GetPolicyHolderResponse>(`/api/policy-holders/${id}`, {
      method: 'GET',
    })
  }

  async function addAddress(
    policyHolderId: string,
    body: AddPolicyHolderAddressBody,
  ): Promise<PolicyHolderAddress> {
    return await api<PolicyHolderAddress>(`/api/policy-holders/${policyHolderId}/addresses`, {
      method: 'POST',
      body,
    })
  }

  async function updateAddress(
    policyHolderId: string,
    addressId: string,
    body: UpdatePolicyHolderAddressBody,
  ): Promise<PolicyHolderAddress> {
    return await api<PolicyHolderAddress>(
      `/api/policy-holders/${policyHolderId}/addresses/${addressId}`,
      {
        method: 'PUT',
        body,
      },
    )
  }

  async function deleteAddress(policyHolderId: string, addressId: string): Promise<void> {
    return await api(`/api/policy-holders/${policyHolderId}/addresses/${addressId}`, {
      method: 'DELETE',
    })
  }

  async function createAppointment(
    policyHolderId: string,
    body: CreatePolicyHolderAppointmentBody,
  ): Promise<CreatePolicyHolderAppointmentResponse> {
    return await api<CreatePolicyHolderAppointmentResponse>(
      `/api/policy-holders/${policyHolderId}/appointments`,
      {
        method: 'POST',
        body,
      },
    )
  }

  async function endAppointment(
    policyHolderId: string,
    appointmentId: string,
  ): Promise<PolicyHolderAppointment> {
    return await api<PolicyHolderAppointment>(
      `/api/policy-holders/${policyHolderId}/appointments/${appointmentId}/end`,
      {
        method: 'PATCH',
      },
    )
  }

  return {
    listPolicyHolders,
    createPolicyHolder,
    getPolicyHolder,
    addAddress,
    updateAddress,
    deleteAddress,
    createAppointment,
    endAppointment,
  }
}
