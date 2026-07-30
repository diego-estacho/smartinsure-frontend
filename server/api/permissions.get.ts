import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type Permission = components['schemas']['PermissionResponse']

/** RN-063: catálogo fixo de permissões da plataforma (somente leitura). */
export default defineEventHandler(async (event): Promise<Permission[]> => {
  return await proxyBackend<Permission[]>(event, '/api/v1/permissions', {
    method: 'GET',
  })
})
