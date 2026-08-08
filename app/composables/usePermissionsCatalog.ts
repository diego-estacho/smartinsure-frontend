import { buildCatalog, type PermissionCatalog } from '~/lib/permissions/catalog'

/**
 * Catálogo de permissões agrupado por área (RN-063). Busca a lista plana do BFF uma única vez e
 * monta o catálogo (áreas + dependências). Cacheado por `useState` — a tela de Perfis e o atalho
 * do convite de usuário (§13) compartilham a mesma fonte, sem re-buscar.
 */
export function usePermissionsCatalog() {
  const { listPermissions } = useProfiles()
  const catalog = useState<PermissionCatalog | null>('permissions-catalog', () => null)
  const loading = useState<boolean>('permissions-catalog-loading', () => false)

  async function load(force = false): Promise<PermissionCatalog> {
    if (catalog.value && !force) {
      return catalog.value
    }
    loading.value = true
    try {
      const permissions = await listPermissions()
      catalog.value = buildCatalog(permissions)
      return catalog.value
    }
    finally {
      loading.value = false
    }
  }

  return { catalog, loading, load }
}
