/**
 * Mapa de labels de status do domínio Usuário (ADR-004): status por nome estável do
 * contrato, label em português. Módulo único por domínio, nunca duplicado em componentes.
 */
export const userStatusLabels: Record<string, string> = {
  Pending: 'Pendente',
  Active: 'Ativo',
}
