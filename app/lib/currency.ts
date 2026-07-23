/**
 * Formatação de moeda BRL para exibição (pt-BR).
 * Código utilitário → inglês.
 */

/**
 * Formata número como BRL (R$ 1.234,56).
 * Padrão: 2 casas decimais, separador de milhar, ponto decimal como vírgula.
 */
export function formatCurrencyBRL(amount: string | number | null | undefined): string {
  if (amount == null) return '—'

  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isNaN(num)) return '—'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}
