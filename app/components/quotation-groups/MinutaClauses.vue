<script setup lang="ts">
/**
 * QuotationGroupsMinutaClauses — blocos "Tags da minuta" (objeto do contrato) e "Cláusulas
 * particulares" do painel da cotação selecionada (exec-plan 0015, 4b). As tags variam por
 * seguradora (da cotação selecionada) e o texto mostra os valores inline. Estado na store
 * (`minuta` + `clauses`), então é reaproveitável e sincronizado na etapa 5 (emissão).
 */
import type { ClauseDef } from '~/lib/minuta'
import { CLAUSE_DEFS, MINUTA_TAG_DEFS, buildObjetoTemplate } from '~/lib/minuta'

const wizard = useQuotationGroupWizardStore()

const clauseDefs = CLAUSE_DEFS
const tags = computed(() => wizard.selectedQuotation?.tags ?? [])
const objetoTemplate = computed(() => buildObjetoTemplate(tags.value))

function def(key: string) {
  return MINUTA_TAG_DEFS[key]
}
function tagValue(key: string): string {
  return wizard.minuta[key] ?? ''
}
function setTag(key: string, value: string): void {
  wizard.minuta[key] = value
}
function clauseOn(clause: ClauseDef): boolean {
  return wizard.clauses[clause.id] ?? clause.default
}
function toggleClause(clause: ClauseDef, value: boolean): void {
  wizard.clauses[clause.id] = value
}
</script>

<template>
  <div class="si-minuta">
    <!-- Tags da minuta (objeto do contrato) — só quando a seguradora exige. -->
    <section
      v-if="tags.length"
      class="si-minuta__block"
    >
      <header class="si-minuta__block-head">
        <SiIcon
          icon="fileText"
          :size="16"
        />
        <span class="si-minuta__block-title">Tags da minuta</span>
      </header>
      <p class="si-minuta__hint">
        Informações do contrato que compõem o objeto da apólice.
      </p>
      <QuotationGroupsMinutaText
        :template="objetoTemplate"
        :values="wizard.minuta"
      />
      <div class="si-minuta__grid">
        <SiTextField
          v-for="key in tags"
          :key="key"
          :model-value="tagValue(key)"
          :label="def(key)?.label"
          :required="def(key)?.required"
          :placeholder="def(key)?.placeholder"
          density="comfortable"
          @update:model-value="setTag(key, String($event ?? ''))"
        />
      </div>
    </section>

    <!-- Cláusulas particulares. -->
    <section class="si-minuta__block">
      <header class="si-minuta__block-head">
        <SiIcon
          icon="squareCheck"
          :size="16"
        />
        <span class="si-minuta__block-title">Cláusulas particulares</span>
      </header>
      <p class="si-minuta__hint">
        Marque as cláusulas que entram no documento. Algumas exigem preenchimento próprio.
      </p>
      <div class="si-minuta__clauses">
        <div
          v-for="clause in clauseDefs"
          :key="clause.id"
          class="si-minuta__clause"
          :class="{ 'si-minuta__clause--on': clauseOn(clause) }"
        >
          <SiCheckbox
            :model-value="clauseOn(clause)"
            :label="clause.title"
            hide-details
            @update:model-value="toggleClause(clause, Boolean($event))"
          />
          <template v-if="clauseOn(clause)">
            <QuotationGroupsMinutaText
              :template="clause.template"
              :values="wizard.minuta"
            />
            <div
              v-if="clause.tags.length"
              class="si-minuta__grid"
            >
              <SiTextField
                v-for="key in clause.tags"
                :key="key"
                :model-value="tagValue(key)"
                :label="def(key)?.label"
                :placeholder="def(key)?.placeholder"
                density="comfortable"
                @update:model-value="setTag(key, String($event ?? ''))"
              />
            </div>
          </template>
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
  gap: var(--si-space-2);
  padding: var(--si-space-4);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  background: rgb(var(--v-theme-surface));
}

.si-minuta__clause--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

@media (max-width: 599.98px) {
  .si-minuta__grid {
    grid-template-columns: 1fr;
  }
}
</style>
