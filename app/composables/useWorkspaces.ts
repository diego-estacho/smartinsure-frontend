import type { components } from '~/types/gen/api'
import { formatCnpj } from '~/lib/documents'

export type CurrentUserContext = components['schemas']['GetCurrentUserContextResponse']
export type UserScope = components['schemas']['UserScopeResponse']

/**
 * Seletor de Corretora/Tomador ativo (workspace switcher) — RN-064.
 *
 * Substitui o placeholder do exec-plan 0014 (que devolvia lista vazia porque o vínculo estava
 * bloqueado): os Vínculos e o Escopo ativo agora vêm do BFF (`/api/me`, ADR-008). A troca chama
 * o servidor, que reemite o acesso com o novo Escopo (ADR-065) — o front nunca decide escopo,
 * só reflete o que o servidor devolveu.
 */
export interface Workspace {
  id: string
  /** Razão social / nome da corretora ou do tomador. */
  name: string
  /** CNPJ formatado (ex.: 12.345.678/0001-90). */
  document: string
  /** Perfil do Usuário naquele Escopo (RN-062). */
  profileName: string
}

function toWorkspace(scope: UserScope): Workspace {
  return {
    id: scope.id,
    name: scope.name,
    document: formatCnpj(scope.documentNumber),
    profileName: scope.profileName,
  }
}

export function useWorkspaces(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  const context = useState<CurrentUserContext | null>('si-user-context', () => null)
  const loading = useState<boolean>('si-user-context-loading', () => false)

  const workspaces = computed<Workspace[]>(
    () => (context.value?.brokerages ?? []).map(toWorkspace),
  )
  const policyHolderWorkspaces = computed<Workspace[]>(
    () => (context.value?.policyHolders ?? []).map(toWorkspace),
  )

  const activeWorkspace = computed<Workspace | null>(
    () => workspaces.value.find(workspace => workspace.id === context.value?.activeBrokerageId) ?? null,
  )
  const activePolicyHolder = computed<Workspace | null>(
    () => policyHolderWorkspaces.value.find(
      workspace => workspace.id === context.value?.activePolicyHolderId,
    ) ?? null,
  )

  const hasWorkspaces = computed(() => workspaces.value.length > 0)
  const hasPolicyHolders = computed(() => policyHolderWorkspaces.value.length > 0)

  /** Carrega o contexto uma vez por sessão de navegação (SSR-safe via useState). */
  async function loadContext(force = false): Promise<void> {
    if (context.value && !force) {
      return
    }

    loading.value = true

    try {
      context.value = await api<CurrentUserContext>('/api/me', { method: 'GET' })
    }
    catch {
      // Sem contexto (sessão expirada ou usuário fora da plataforma): o switcher fica vazio,
      // sem inventar dado. O $api já encaminha 401 ao login.
      context.value = null
    }
    finally {
      loading.value = false
    }
  }

  /** RN-064: troca a Corretora ativa. O servidor valida o vínculo e reemite o acesso. */
  async function selectWorkspace(brokerageId: string | null): Promise<void> {
    await api('/api/me/active-scope', {
      method: 'POST',
      body: {
        brokerageId,
        policyHolderId: context.value?.activePolicyHolderId ?? null,
      },
    })
    await loadContext(true)
  }

  /** RN-064: troca o Tomador ativo, preservando a Corretora ativa. */
  async function selectPolicyHolder(policyHolderId: string | null): Promise<void> {
    await api('/api/me/active-scope', {
      method: 'POST',
      body: {
        brokerageId: context.value?.activeBrokerageId ?? null,
        policyHolderId,
      },
    })
    await loadContext(true)
  }

  return {
    context,
    loading,
    workspaces,
    policyHolderWorkspaces,
    activeWorkspace,
    activePolicyHolder,
    hasWorkspaces,
    hasPolicyHolders,
    loadContext,
    selectWorkspace,
    selectPolicyHolder,
  }
}
