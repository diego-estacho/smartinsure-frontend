<script setup lang="ts">
/**
 * QuotationGroupsMinutaClauses — blocos "Informação de contrato" (tags do objeto) e "Cláusulas
 * particulares" do painel da Cotação selecionada (RN-079) — **dados reais** do catálogo importado
 * (GET .../minuta). Cada cláusula traz um texto em HTML (renderizado como HTML) com placeholders
 * `[TAG_X]` e o desenho das suas próprias tags (JsonTag): ao marcar a cláusula, o corretor preenche
 * campos e os valores substituem os placeholders no texto ao vivo. O preenchimento vive na store
 * (`minuta` por tag do objeto; `clauses` por id externo; `clauseTags` por id externo → tag), então
 * segue sincronizado e é o que "Baixar minuta" envia (RN-080). Sem catálogo, os blocos não aparecem.
 */
import type { QuotationMinutaClause } from '~/composables/useQuotationMinuta'

interface MinutaTag {
  name: string
  label: string
  /** Tipo da origem (Text/Number/Date/Repeater/…) — decide o input; Repeater fica fora do formulário simples. */
  type: string | null
}

const wizard = useQuotationGroupWizardStore()
const { getMinuta } = useQuotationMinuta()

const clauses = ref<QuotationMinutaClause[]>([])
const objectTags = ref<MinutaTag[]>([])
// Desenho das tags de cada cláusula (externalId → tags), para renderizar campos e trocar placeholders.
const clauseTagDefs = ref<Record<string, MinutaTag[]>>({})
const loading = ref(false)

/**
 * O JsonTag (do objeto ou de uma cláusula) é uma lista de tags. Os nomes de campo variam na origem;
 * lemos os mais comuns e degradamos com segurança (lista vazia) se o formato não bater.
 */
function parseTags(tagJson: string | null | undefined): MinutaTag[] {
  return safeParseArray(tagJson)
    .map((tag) => {
      const name = String(tag.Name ?? tag.name ?? tag.Key ?? tag.key ?? tag.Tag ?? tag.tag ?? '')
      const label = String(tag.Label ?? tag.label ?? tag.Description ?? tag.description ?? name)
      const rawType = tag.Type ?? tag.type ?? null
      return { name, label, type: rawType == null ? null : String(rawType) }
    })
    .filter(tag => tag.name.length > 0)
}

function safeParseArray(json: string | null | undefined): Record<string, unknown>[] {
  if (!json) return []
  try {
    const parsed: unknown = JSON.parse(json)
    return Array.isArray(parsed) ? parsed as Record<string, unknown>[] : []
  }
  catch {
    return []
  }
}

/**
 * Reidrata o preenchimento salvo (RN-079, "Baixar minuta") na store: valores do objeto por nome de tag e
 * cláusulas marcadas por id externo com suas tags. Só semeia o que ainda não foi preenchido nesta sessão —
 * não sobrescreve edições em andamento. É o que faz o formulário sobreviver a um refresh (F5).
 */
function hydrateFilled(tagsJson: string | null | undefined, clausesJson: string | null | undefined): void {
  for (const raw of safeParseArray(tagsJson)) {
    const name = String(raw.name ?? raw.Name ?? '')
    if (name && wizard.minuta[name] === undefined) {
      wizard.minuta[name] = String(raw.value ?? raw.Value ?? '')
    }
  }
  for (const raw of safeParseArray(clausesJson)) {
    const externalId = String(raw.particularClauseExternalId ?? raw.ParticularClauseExternalId ?? '')
    if (!externalId) continue
    if (wizard.clauses[externalId] === undefined) wizard.clauses[externalId] = true
    if (wizard.clauseTags[externalId] === undefined) {
      const tagsRaw = raw.tags ?? raw.Tags
      const tags = Array.isArray(tagsRaw) ? tagsRaw as Record<string, unknown>[] : []
      const seed: Record<string, string> = {}
      for (const tag of tags) {
        const tagName = String(tag.name ?? tag.Name ?? '')
        if (tagName) seed[tagName] = String(tag.value ?? tag.Value ?? '')
      }
      wizard.clauseTags[externalId] = seed
    }
  }
}

async function load(): Promise<void> {
  const groupId = wizard.quotationGroupId
  const quotation = wizard.selectedQuotation
  if (!groupId || !quotation) {
    clauses.value = []
    objectTags.value = []
    clauseTagDefs.value = {}
    return
  }
  loading.value = true
  const requestedId = quotation.id
  try {
    const minuta = await getMinuta(groupId, quotation.id)
    // A seleção mudou enquanto o GET estava em voo: descarta este resultado — senão hidrataríamos a store
    // da seguradora ANTIGA sob a nova seleção (vazamento entre seguradoras que o reset foi evitar, RN-079).
    if (wizard.selectedQuotation?.id !== requestedId) return
    clauses.value = minuta.clauses
    // Repeater é lista dinâmica (fora do formulário simples) — filtrado aqui igual às tags de cláusula.
    objectTags.value = parseTags(minuta.tagJson).filter(tag => (tag.type ?? '').toLowerCase() !== 'repeater')
    clauseTagDefs.value = Object.fromEntries(
      minuta.clauses.map(clause => [clause.externalId, parseTags(clause.jsonTag)]),
    )
    // RN-079: reidrata o preenchimento salvo (sobrevive a um F5); roda após o reset por troca de seguradora.
    hydrateFilled(minuta.filledTagsJson, minuta.filledClausesJson)
  }
  catch {
    clauses.value = []
    objectTags.value = []
    clauseTagDefs.value = {}
  }
  finally {
    loading.value = false
  }
}

watch(() => wizard.selectedQuotation?.id, () => void load(), { immediate: true })

// ── Informação de contrato (tags do objeto) ──
function tagValue(key: string): string {
  return wizard.minuta[key] ?? ''
}
function setTag(key: string, value: string): void {
  wizard.minuta[key] = value
}

// ── Cláusulas particulares ──
// Repeater é uma lista dinâmica (ex.: TAG_EMPRESAS) — fora do escopo deste formulário simples (igual ao
// legado); o placeholder correspondente permanece no texto até termos o editor de lista.
function inputTags(externalId: string): MinutaTag[] {
  return (clauseTagDefs.value[externalId] ?? []).filter(tag => (tag.type ?? '').toLowerCase() !== 'repeater')
}
function inputType(type: string | null): string {
  const normalized = (type ?? '').toLowerCase()
  if (normalized === 'number') return 'number'
  if (normalized === 'date') return 'date'
  return 'text'
}
function clauseOn(externalId: string): boolean {
  return wizard.clauses[externalId] ?? false
}
function toggleClause(externalId: string, on: boolean): void {
  wizard.clauses[externalId] = on
  // Ao marcar, semeia as tags da cláusula (vazias) para que todas entrem no envio, mesmo sem edição.
  if (on && !wizard.clauseTags[externalId]) {
    const seed: Record<string, string> = {}
    for (const tag of inputTags(externalId)) seed[tag.name] = ''
    wizard.clauseTags[externalId] = seed
  }
}
function clauseTagValue(externalId: string, name: string): string {
  return wizard.clauseTags[externalId]?.[name] ?? ''
}
function setClauseTag(externalId: string, name: string, value: string): void {
  wizard.clauseTags[externalId] = { ...(wizard.clauseTags[externalId] ?? {}), [name]: value }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
/**
 * Texto da cláusula (HTML da Seguradora) com os placeholders `[TAG_X]` trocados pelo valor preenchido;
 * tags ainda vazias ficam realçadas para o corretor ver o que falta. O valor digitado é escapado antes
 * de entrar no HTML (não deixa o usuário injetar marcação). `split/join` troca literal (nomes têm %, acento, espaço).
 */
function clausePreview(clause: QuotationMinutaClause): string {
  let text = clause.clauseText ?? ''
  for (const tag of (clauseTagDefs.value[clause.externalId] ?? [])) {
    const value = clauseTagValue(clause.externalId, tag.name)
    const replacement = value.trim().length > 0
      ? escapeHtml(value)
      : `<span class="si-minuta__ph">[${escapeHtml(tag.name)}]</span>`
    text = text.split(`[${tag.name}]`).join(replacement)
  }
  return text
}
</script>

<template>
  <div class="si-minuta">
    <div
      v-if="loading"
      class="si-minuta__loading"
    >
      <SiProgressCircular
        indeterminate
        :size="16"
        :width="2"
      />
      <span>Carregando a minuta…</span>
    </div>

    <!-- Informação de contrato (tags do objeto) — só quando a Modalidade define. -->
    <section
      v-if="objectTags.length"
      class="si-minuta__block"
    >
      <header class="si-minuta__block-head">
        <SiIcon
          icon="fileText"
          :size="16"
        />
        <span class="si-minuta__block-title">Informação de contrato</span>
      </header>
      <p class="si-minuta__hint">
        Informações do contrato que compõem o objeto da apólice.
      </p>
      <div class="si-minuta__grid">
        <SiTextField
          v-for="tag in objectTags"
          :key="tag.name"
          :model-value="tagValue(tag.name)"
          :label="tag.label"
          density="comfortable"
          @update:model-value="setTag(tag.name, String($event ?? ''))"
        />
      </div>
    </section>

    <!-- Cláusulas particulares (catálogo importado). -->
    <section
      v-if="clauses.length"
      class="si-minuta__block"
    >
      <header class="si-minuta__block-head">
        <SiIcon
          icon="squareCheck"
          :size="16"
        />
        <span class="si-minuta__block-title">Cláusulas particulares</span>
      </header>
      <p class="si-minuta__hint">
        Marque as cláusulas que entram no documento e preencha os campos indicados.
      </p>
      <div class="si-minuta__clauses">
        <div
          v-for="clause in clauses"
          :key="clause.externalId"
          class="si-minuta__clause"
          :class="{ 'si-minuta__clause--on': clauseOn(clause.externalId) }"
        >
          <SiCheckbox
            :model-value="clauseOn(clause.externalId)"
            :label="clause.name"
            hide-details
            @update:model-value="toggleClause(clause.externalId, Boolean($event))"
          />

          <!-- Texto da cláusula renderizado como HTML, com as tags substituídas ao vivo. O HTML vem do
               catálogo da Seguradora e os valores digitados são escapados (clausePreview) — daí o v-html. -->
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="clauseOn(clause.externalId) && clause.clauseText"
            class="si-minuta__clause-text"
            v-html="clausePreview(clause)"
          />
          <!-- eslint-enable vue/no-v-html -->

          <!-- Campos das tags próprias da cláusula. -->
          <div
            v-if="clauseOn(clause.externalId) && inputTags(clause.externalId).length"
            class="si-minuta__clause-tags"
          >
            <SiTextField
              v-for="tag in inputTags(clause.externalId)"
              :key="tag.name"
              :model-value="clauseTagValue(clause.externalId, tag.name)"
              :label="tag.label"
              :type="inputType(tag.type)"
              density="comfortable"
              @update:model-value="setClauseTag(clause.externalId, tag.name, String($event ?? ''))"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.si-minuta {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
  margin-top: var(--si-space-4);
  padding-top: var(--si-space-4);
  border-top: 1px solid var(--si-cinza-claro);
}

.si-minuta__loading {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-minuta__block {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-minuta__block-head {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  color: rgb(var(--v-theme-primary));
}

.si-minuta__block-title {
  font-size: var(--si-fs-caption);
  text-transform: uppercase;
  letter-spacing: var(--si-ls-eyebrow);
  font-weight: var(--si-font-weight-bold);
  color: rgb(var(--v-theme-on-surface));
}

.si-minuta__hint {
  margin: calc(-1 * var(--si-space-2)) 0 0;
  font-size: var(--si-fs-caption);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-minuta__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-3);
}

.si-minuta__clauses {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-minuta__clause {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-4);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  background: rgb(var(--v-theme-surface));
}

.si-minuta__clause--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.si-minuta__clause-text {
  margin: 0;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.85);
  line-height: 1.5;
}

/* O texto vem em HTML da Seguradora: neutraliza margens grandes de <p> para caber no card. */
.si-minuta__clause-text :deep(p) {
  margin: 0 0 var(--si-space-2);
}

.si-minuta__clause-text :deep(p:last-child) {
  margin-bottom: 0;
}

/* Placeholder de tag ainda não preenchida — realce sutil para o corretor ver o que falta. */
.si-minuta__clause-text :deep(.si-minuta__ph) {
  padding: 0 4px;
  border-radius: var(--si-radius-sm);
  background: rgba(var(--v-theme-warning), 0.16);
  color: rgb(var(--v-theme-warning));
  font-weight: var(--si-font-weight-semibold);
  font-style: normal;
}

.si-minuta__clause-tags {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--si-space-3);
}

@media (max-width: 599.98px) {
  .si-minuta__grid,
  .si-minuta__clause-tags {
    grid-template-columns: 1fr;
  }
}
</style>
