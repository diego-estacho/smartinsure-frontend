/**
 * Definições da minuta e das cláusulas particulares (etapa 4/5) — **MOCK** do handoff
 * (exec-plan 0015, 4b). As tags variam por seguradora; o texto do objeto é montado conforme as
 * tags exigidas e exibido com os valores preenchidos inline (verde) ou como marcador tracejado.
 *
 * TODO(backend): trocar por `GET seguradora/{id}/minuta-tags` e `GET clausulas` quando existirem.
 */
export interface MinutaTagDef {
  label: string
  placeholder: string
  required: boolean
  /** Nome exibido inline no texto quando o campo está vazio: "[nome]". */
  inline: string
}

export const MINUTA_TAG_DEFS: Record<string, MinutaTagDef> = {
  objeto: { label: 'Objeto do contrato', placeholder: 'Ex.: execução da obra de reforma da unidade escolar', required: true, inline: 'objeto do contrato' },
  edital: { label: 'Número do edital / processo', placeholder: 'Ex.: 0481/2026', required: true, inline: 'nº do edital/processo' },
  orgao: { label: 'Órgão / ente contratante', placeholder: 'Ex.: Prefeitura Municipal de Exemplo', required: false, inline: 'órgão contratante' },
  contratoPrincipal: { label: 'Número do contrato principal', placeholder: 'Ex.: CT-2026-118', required: false, inline: 'nº do contrato principal' },
  percRetencao: { label: 'Percentual de retenção (%)', placeholder: 'Ex.: 5', required: false, inline: 'percentual de retenção' },
  prazoLiberacao: { label: 'Prazo de liberação (dias)', placeholder: 'Ex.: 30', required: false, inline: 'prazo de liberação' },
}

export interface ClauseDef {
  id: string
  title: string
  template: string
  tags: string[]
  default: boolean
}

export const CLAUSE_DEFS: ClauseDef[] = [
  {
    id: 'retencao',
    title: 'Retenção de pagamentos',
    template: 'O segurado poderá reter {percRetencao} dos valores devidos ao tomador, liberados em até {prazoLiberacao} após o cumprimento integral das obrigações do contrato.',
    tags: ['percRetencao', 'prazoLiberacao'],
    default: false,
  },
  {
    id: 'dolo',
    title: 'Dolo',
    template: 'Para ausência de dúvidas, esta apólice garante a cobertura de prejuízos diretos causados ao segurado decorrentes de culpa ou dolo do tomador durante a execução do contrato, desde que não conte com a comprovada participação do segurado, seus sócios, administradores, representantes ou funcionários.',
    tags: [],
    default: true,
  },
  {
    id: 'inalien',
    title: 'Inalienabilidade, irrevogabilidade e atualização',
    template: 'Para ausência de dúvidas, esta apólice contempla as condições de inalienabilidade e irrevogabilidade, bem como a atualização financeira, solicitadas no edital/contrato descrito no objeto desta apólice, em conformidade com as condições gerais do ramo.',
    tags: [],
    default: false,
  },
]

/** Monta o texto do objeto da apólice conforme as tags exigidas pela seguradora. */
export function buildObjetoTemplate(tags: string[]): string {
  let text = 'Esta apólice garante o fiel cumprimento das obrigações assumidas pelo tomador'
  if (tags.includes('orgao')) text += ' perante {orgao}'
  if (tags.includes('edital')) text += ', no âmbito do edital/processo {edital}'
  if (tags.includes('objeto')) text += ', relativas ao objeto {objeto}'
  if (tags.includes('contratoPrincipal')) text += ', vinculadas ao contrato principal {contratoPrincipal}'
  text += ', até o limite da importância segurada.'
  return text
}

export interface TemplateSegment {
  text: string
  tag: string | null
}

/** Quebra um template em segmentos de texto puro e tokens `{tag}`. */
export function parseTemplate(template: string): TemplateSegment[] {
  return template
    .split(/(\{[a-zA-Z]+\})/g)
    .filter(seg => seg.length > 0)
    .map((seg) => {
      const match = seg.match(/^\{([a-zA-Z]+)\}$/)
      return match ? { text: '', tag: match[1] as string } : { text: seg, tag: null }
    })
}
