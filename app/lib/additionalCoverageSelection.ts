/**
 * RN-104: regras de forma da seleção de Coberturas Adicionais na etapa de risco. São regras de
 * consistência da UI (o negócio é validado pelo servidor): manter a seleção coerente com a oferta
 * carregada, para o corretor nunca ter um id escolhido que não aparece como opção na tela.
 */

/**
 * Remove da seleção os ids que não estão na oferta carregada. Necessário ao reidratar um Grupo em
 * Rascunho: a curadoria pode ter mudado (vínculo removido, canônica inativada, Seguradora inativada)
 * e o id continuaria escolhido, invisível na tela e reenviado no salvar.
 */
export function pruneSelection(
  selected: readonly string[],
  available: readonly { id: string }[],
): string[] {
  const availableIds = new Set(available.map(coverage => coverage.id))
  return selected.filter(id => availableIds.has(id))
}
