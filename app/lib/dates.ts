/**
 * Datas — formatação/serialização sem dependência externa. Código utilitário → inglês.
 *
 * Usa SEMPRE as partes LOCAIS da data (getFullYear/getMonth/getDate), nunca toISOString,
 * para evitar o deslocamento de fuso (uma data "15/07" à meia-noite local não pode virar
 * "14/07" em UTC). Serve à regra: exibição pt-BR (dd/mm/aaaa), valor pro backend padronizado.
 */
const pad = (n: number): string => String(n).padStart(2, '0')

/** Exibição pt-BR: 15/07/2026. */
export function toBrDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** Backend ISO: 2026-07-15. */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Backend com traços dia-mês-ano: 15-07-2026. */
export function toBrDashDate(d: Date): string {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

/** Faz o parse de "2026-07-15" para Date local (sem shift de fuso). */
export function fromIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** Faz o parse de "15-07-2026" para Date local. */
export function fromBrDashDate(s: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

/**
 * Exibição pt-BR com hora: 15/07/2026 10:45. Parse de ISO 8601 (2026-07-15T10:45:00Z).
 * Extrai hora/minuto da string ISO (UTC) sem conversão de fuso, mantendo
 * o horário conforme gravado no servidor (padrão RN-031).
 */
export function toBrDateTime(isoString: string): string {
  // Extrai componentes da string ISO diretamente (sem conversão de fuso)
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(isoString)
  if (!m) return isoString

  const year = Number(m[1])
  const month = Number(m[2]) - 1
  const day = Number(m[3])
  const hour = m[4]
  const minute = m[5]

  const date = `${pad(day)}/${pad(month + 1)}/${year}`
  return `${date} ${hour}:${minute}`
}

/** Exibição de `DateOnly` "AAAA-MM-DD" → 15/07/2026; "—" quando ausente/inválida. */
export function toBrDateOnly(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = fromIsoDate(iso.slice(0, 10))
  return date ? toBrDate(date) : '—'
}

/** Exibição de `DateTime` ISO com hora no padrão do DS: 10/07/2026 às 14:31 (cronologia). */
export function toBrDateTimeAt(iso: string | null | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]} às ${m[4]}:${m[5]}` : '—'
}

/** Dias de vigência = arredondamento de (fim − início), mínimo 1. Derivação de exibição (não é regra). */
export function coverageDays(
  start: string | null | undefined, end: string | null | undefined): number | null {
  const startDate = start ? fromIsoDate(start.slice(0, 10)) : null
  const endDate = end ? fromIsoDate(end.slice(0, 10)) : null
  if (!startDate || !endDate) return null
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000))
}
