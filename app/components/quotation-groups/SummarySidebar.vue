<script setup lang="ts">
/**
 * QuotationGroupsSummarySidebar — "Resumo da oferta": consolida o que já foi preenchido, mostrando
 * apenas campos presentes (nunca rótulos vazios). Desktop: coluna carvão à esquerda do card (no
 * lugar do menu). Mobile (`collapsible`): bloco colapsável no topo. Fidelidade ao protótipo: rótulo
 * eyebrow VERDE maiúsculo + valor BRANCO em tamanho body; tomador/segurado desmembrados em
 * CNPJ + razão social (+ endereço do segurado). Etapas 1–6 alimentam as linhas (exec-plan 0015).
 */
import { formatCnpj } from '~/lib/documents'
import { fromIsoDate, toBrDate } from '~/lib/dates'

defineProps<{ collapsible?: boolean }>()

const wizard = useQuotationGroupWizardStore()

function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const parsed = fromIsoDate(iso)
  return parsed ? toBrDate(parsed) : iso
}

// Linhas preenchidas conforme as etapas avançam. Ordem/rótulos fiéis ao protótipo.
const rows = computed(() => {
  const list: { key: string, label: string, value: string }[] = []
  const holder = wizard.policyHolder
  if (holder) {
    list.push({ key: 'holder-doc', label: 'CNPJ do tomador', value: formatCnpj(holder.documentNumber) })
    list.push({ key: 'holder-name', label: 'Razão social do tomador', value: holder.name })
  }
  const insured = wizard.insured
  if (insured) {
    list.push({ key: 'insured-doc', label: 'CNPJ do segurado', value: formatCnpj(insured.documentNumber) })
    list.push({ key: 'insured-name', label: 'Razão social do segurado', value: insured.name })
    if (insured.mainAddress) {
      list.push({ key: 'insured-address', label: 'Endereço do segurado', value: insured.mainAddress })
    }
  }
  const risk = wizard.risk
  if (risk.modalityName) {
    list.push({ key: 'modality', label: 'Modalidade', value: risk.modalityName })
  }
  if (risk.insuredAmount != null) {
    list.push({ key: 'insured-amount', label: 'Importância segurada', value: formatBrl(risk.insuredAmount) })
  }
  if (risk.startDate && risk.endDate) {
    list.push({ key: 'validity', label: 'Vigência', value: `${formatDate(risk.startDate)} a ${formatDate(risk.endDate)}` })
  }
  const quotation = wizard.selectedQuotation
  if (quotation) {
    list.push({ key: 'quotation', label: 'Cotação', value: `${quotation.name} — ${formatBrl(quotation.premio)}` })
  }
  return list
})
</script>

<template>
  <aside
    class="si-qg-summary"
    :class="{ 'si-qg-summary--collapsible': collapsible }"
  >
    <SiExpansionPanels v-if="collapsible">
      <SiExpansionPanel title="Resumo da oferta">
        <!-- Conteúdo no slot #text (VExpansionPanelText): é o que colapsa; nasce fechado. -->
        <template #text>
          <p
            v-if="!rows.length"
            class="si-qg-summary__hint"
          >
            As informações preenchidas aparecem aqui conforme você avança pelas etapas.
          </p>
          <dl
            v-else
            class="si-qg-summary__list"
          >
            <div
              v-for="row in rows"
              :key="row.key"
            >
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </template>
      </SiExpansionPanel>
    </SiExpansionPanels>

    <template v-else>
      <h2 class="si-qg-summary__title">
        Resumo da oferta
      </h2>
      <p
        v-if="!rows.length"
        class="si-qg-summary__hint"
      >
        As informações preenchidas aparecem aqui conforme você avança pelas etapas.
      </p>
      <dl
        v-else
        class="si-qg-summary__list"
      >
        <div
          v-for="row in rows"
          :key="row.key"
        >
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>
    </template>
  </aside>
</template>

<style scoped>
.si-qg-summary__title {
  margin: 0 0 var(--si-space-5);
  font-size: var(--si-fs-h4, 1.125rem);
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-on-charcoal));
}

.si-qg-summary__hint {
  margin: 0;
  font-size: var(--si-fs-small);
  line-height: var(--si-lh-body);
  color: rgba(var(--v-theme-on-charcoal), 0.55);
}

/* No bloco colapsável (mobile, sobre superfície clara) o texto usa on-surface. */
.si-qg-summary--collapsible .si-qg-summary__hint {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-qg-summary__list {
  display: grid;
  gap: var(--si-space-4);
  margin: 0;
}

.si-qg-summary__list div {
  display: grid;
  gap: var(--si-space-1);
}

/* Rótulo eyebrow verde maiúsculo (protótipo). */
.si-qg-summary__list dt {
  font-size: var(--si-fs-caption, 0.75rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: var(--si-font-weight-semibold);
  color: rgb(var(--v-theme-primary));
}

/* Valor branco menor (fs-small ~14px) — pedido do dono, melhora a leitura. */
.si-qg-summary__list dd {
  margin: 0;
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-medium, 500);
  line-height: var(--si-lh-small, 1.4);
  color: rgb(var(--v-theme-on-charcoal));
}

.si-qg-summary--collapsible .si-qg-summary__list dd {
  color: rgb(var(--v-theme-on-surface));
}
</style>
