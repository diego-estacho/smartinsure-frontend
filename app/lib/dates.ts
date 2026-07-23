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
