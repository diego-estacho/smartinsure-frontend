/**
 * Formatadores de apresentação compartilhados (sem regra de negócio). Uma fonte só, para não
 * duplicar a mesma lógica de exibição entre telas de domínio.
 */

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
