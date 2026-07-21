/**
 * Dados MOCK do painel (ADR-019 · exec-plan 0009). Existe só para validar a reprodução
 * do protótipo do design system (`design system/ui_kits/web/index.html`) com o kit `Si` +
 * tokens. NÃO há backend/contrato para estes números ainda — quando existir, este composable
 * é trocado por um `useDashboard()` que consome o BFF (ADR-008) e o mock some.
 *
 * Identificadores em inglês (AGENTS §Idioma); os textos de UI (pt-BR) são valores, não código.
 */
import {
  mdiCheck, mdiClockOutline, mdiRepeatVariant, mdiClose,
} from '~/lib/icons'

export type Trend = 'up' | 'down'
export type ActivityTone = 'success' | 'warning' | 'info' | 'error'

export interface KpiCard {
  /** Rótulo curto (eyebrow) do indicador. */
  label: string
  /** Valor já formatado no locale BR (R$ 1.234,56 / 12% / 8.412). */
  value: string
  /** Texto de apoio abaixo do número (comparativo). */
  hint: string
  /** Direção da variação — pinta o hint e escolhe a seta. Ausente = neutro. */
  trend?: Trend
  /** Card de destaque (superfície carvão) — um por painel, conforme o DS. */
  highlight?: boolean
}

export interface ActivityEntry {
  id: string
  tone: ActivityTone
  icon: string
  /** Título com um trecho em negrito — ver `<DashboardActivity>`. */
  title: string
  emphasis: string
  detail: string
  time: string
}

export interface TrendChart {
  title: string
  updatedAt: string
  /** Séries em coordenadas y do viewBox 600×200 (menor = mais alto). x = índice × 50. */
  current: number[]
  previous: number[]
}

export interface DashboardData {
  context: string
  greeting: string
  highlight: string
  kpis: KpiCard[]
  chart: TrendChart
  activity: ActivityEntry[]
}

export function useDashboardMock(): DashboardData {
  return {
    context: 'Aurora Seguros',
    greeting: 'Bom dia, Ana.',
    highlight: '12 sinistros aguardam sua análise há mais de 48 horas.',
    kpis: [
      { label: 'Apólices ativas', value: '8.412', hint: '4,2% vs. mês anterior', trend: 'up' },
      { label: 'Prêmio emitido', value: 'R$ 1,28M', hint: '8,7% vs. mês anterior', trend: 'up' },
      { label: 'Sinistros pendentes', value: '37', hint: '12 acima de 48h', trend: 'down' },
      { label: 'Taxa de conversão', value: '62,4%', hint: '+1,1 pp vs. trimestre', highlight: true },
    ],
    chart: {
      title: 'Apólices emitidas — últimos 30 dias',
      updatedAt: 'Atualizado às 14:32',
      current: [140, 120, 130, 90, 110, 70, 85, 50, 65, 35, 60, 30, 45],
      previous: [160, 150, 155, 140, 145, 130, 140, 125, 130, 120, 125, 118, 122],
    },
    activity: [
      { id: 'A-2241', tone: 'success', icon: mdiCheck, title: 'Apólice', emphasis: '#A-2241', detail: 'emitida · Lucas Pereira · Auto', time: 'há 8 min' },
      { id: 'S-1882', tone: 'warning', icon: mdiClockOutline, title: 'Sinistro', emphasis: '#S-1882', detail: 'aguarda análise · 52h em aberto', time: 'há 1h' },
      { id: 'renew', tone: 'info', icon: mdiRepeatVariant, title: 'Renovação automática', emphasis: '· 14 apólices', detail: 'Vencimento em 7 dias', time: 'há 3h' },
      { id: 'F-9914', tone: 'error', icon: mdiClose, title: 'Pagamento recusado', emphasis: '· #F-9914', detail: 'Cartão expirado', time: 'hoje 09:14' },
    ],
  }
}
