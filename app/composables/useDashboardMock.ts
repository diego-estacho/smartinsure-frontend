/**
 * Dados MOCK do painel (ADR-019 · exec-plan 0009). Existe só para validar a reprodução
 * do protótipo do design system (`design system/ui_kits/web/index.html`) com o kit `Si` +
 * tokens. NÃO há backend/contrato para estes números ainda — quando existir, este composable
 * é trocado por um `useDashboard()` que consome o BFF (ADR-008) e o mock some.
 *
 * Identificadores em inglês (AGENTS §Idioma); os textos de UI (pt-BR) são valores, não código.
 */
import type { AppIconName } from '~/lib/icons'

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
  icon: AppIconName
  /** Título com um trecho em negrito — ver `<DashboardActivity>`. */
  title: string
  emphasis: string
  detail: string
  time: string
}

export interface TrendChart {
  title: string
  updatedAt: string
  /** Valores por ponto (nº de apólices emitidas); índice do ponto = eixo x. Maior = mais alto. */
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
      current: [60, 80, 70, 110, 90, 130, 115, 150, 135, 165, 140, 170, 155],
      previous: [40, 50, 45, 60, 55, 70, 60, 75, 70, 80, 75, 82, 78],
    },
    activity: [
      { id: 'A-2241', tone: 'success', icon: 'check', title: 'Apólice', emphasis: '#A-2241', detail: 'emitida · Lucas Pereira · Auto', time: 'há 8 min' },
      { id: 'S-1882', tone: 'warning', icon: 'clock', title: 'Sinistro', emphasis: '#S-1882', detail: 'aguarda análise · 52h em aberto', time: 'há 1h' },
      { id: 'renew', tone: 'info', icon: 'repeat', title: 'Renovação automática', emphasis: '· 14 apólices', detail: 'Vencimento em 7 dias', time: 'há 3h' },
      { id: 'F-9914', tone: 'error', icon: 'close', title: 'Pagamento recusado', emphasis: '· #F-9914', detail: 'Cartão expirado', time: 'hoje 09:14' },
    ],
  }
}
