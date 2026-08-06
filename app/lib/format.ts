/**
 * Formatadores de apresentação compartilhados (sem regra de negócio). Uma fonte só, para não
 * duplicar a mesma lógica de exibição entre telas de domínio.
 */

/** Casas decimais que o campo de taxa exibe — a Seguradora pode devolver mais do que isso. */
const TAX_FRACTION_DIGITS = 4

/**
 * Taxa como o corretor lê e digita (pt-BR). Sem separador de milhar de propósito: o valor volta pelo
 * mesmo campo e é lido por {@link parseTaxPercentage}, que engasgaria com o ponto de milhar.
 */
export function formatTaxPercentage(value: number): string {
  return value.toLocaleString('pt-BR', {
    maximumFractionDigits: TAX_FRACTION_DIGITS,
    useGrouping: false,
  })
}

/** Lê a taxa digitada (vírgula ou ponto decimal). NaN quando não é número — quem chama valida. */
export function parseTaxPercentage(text: string): number {
  const normalized = text.trim().replace(',', '.')
  return normalized === '' ? Number.NaN : Number(normalized)
}

/** Iniciais (até 2) para avatar a partir de um nome/razão social. */
export function initials(source: string | null | undefined): string {
  return (source ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

type AddressLike = {
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}

/** Endereço principal em uma linha ("rua, nº · bairro · cidade - UF · CEP"); traço quando vazio. */
export function formatAddress(address: AddressLike | null | undefined): string {
  if (!address) return '—'
  return [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode,
  ].filter(Boolean).join(' · ') || '—'
}
