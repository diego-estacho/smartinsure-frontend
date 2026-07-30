import { proxyBackend } from "~~/server/utils/proxyBackend"

/**
 * RN-074: remoção de perfil customizado — recusada pelo servidor se estiver em uso.
 * O backend responde 204 sem corpo; o handler devolve `null` para não tipar um `void` genérico.
 */
export default defineEventHandler(async (event): Promise<null> => {
  const { id } = getRouterParams(event)

  await proxyBackend<unknown>(event, `/api/v1/profiles/${id}`, {
    method: 'DELETE',
  })

  return null
})
