import { proxyBackend } from "~~/server/utils/proxyBackend"

/**
 * RN-074: remoção de perfil customizado. Perfil em uso não é erro — exige `migrateToProfileId`
 * (perfil-destino do mesmo escopo) na query, e o servidor migra os usuários antes de excluir.
 * O backend responde 204 sem corpo; o handler devolve `null` para não tipar um `void` genérico.
 */
export default defineEventHandler(async (event): Promise<null> => {
  const { id } = getRouterParams(event)
  const query = getQuery(event)

  await proxyBackend<unknown>(event, `/api/v1/profiles/${id}`, {
    method: 'DELETE',
    query,
  })

  return null
})
