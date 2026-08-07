<script setup lang="ts">
/**
 * Aba Resumo do detalhe da Cotação (RN-081): faixa de números (IS · Prêmio · Comissão em R$ · Vigência)
 * + card "Dados da cotação" (Partes · Objeto e cobertura · Vigência e emissão). `objeto` e
 * `propostaValidaAte` não entram nesta fatia (não modelados). Valores monetários vêm do contrato (a
 * comissão em R$ é a persistida — nunca recalculada aqui). Página fina (ADR-018): só apresentação.
 */
import type { QuotationDetail } from '~/composables/useQuotationDetail'
import { formatCurrencyBRL } from '~/lib/currency'
import { toBrDateOnly, toBrDateTime, coverageDays } from '~/lib/dates'
import { formatCnpj } from '~/lib/documents'

const props = defineProps<{ quotation: QuotationDetail }>()

const days = computed(() => coverageDays(props.quotation.coverageStartDate, props.quotation.coverageEndDate))

const commissionHint = computed(() => {
  const pct = props.quotation.commissionPercentage
  return pct == null || pct === '' ? '' : `${pct}% sobre o prêmio`
})

const coverageHint = computed(() =>
  `${toBrDateOnly(props.quotation.coverageStartDate)} a ${toBrDateOnly(props.quotation.coverageEndDate)}`)

// Coberturas Adicionais contempladas (Sent). As não contempladas (NotOffered) ficam sinalizadas à parte.
const sentCoverages = computed(() =>
  props.quotation.additionalCoverages.filter(coverage => coverage.status === 'Sent'))
const notOfferedCoverages = computed(() =>
  props.quotation.additionalCoverages.filter(coverage => coverage.status === 'NotOffered'))
</script>

<template>
  <div class="si-summary">
    <!-- Faixa de números: card único, células com divisor (IS em destaque). -->
    <SiCard
      variant="flat"
      class="si-summary__metrics"
    >
      <div class="si-summary__metric">
        <span class="si-summary__mlabel">Importância segurada</span>
        <span class="si-summary__mvalue si-summary__mvalue--lead">{{ formatCurrencyBRL(quotation.insuredAmount) }}</span>
        <span class="si-summary__mhint">Valor garantido à segurada</span>
      </div>
      <div class="si-summary__metric">
        <span class="si-summary__mlabel">Prêmio total</span>
        <span class="si-summary__mvalue">{{ formatCurrencyBRL(quotation.premium) }}</span>
        <span class="si-summary__mhint">À vista, no aceite da apólice</span>
      </div>
      <div class="si-summary__metric">
        <span class="si-summary__mlabel">Sua comissão</span>
        <span class="si-summary__mvalue">{{ formatCurrencyBRL(quotation.commissionValue) }}</span>
        <span class="si-summary__mhint">{{ commissionHint }}</span>
      </div>
      <div class="si-summary__metric">
        <span class="si-summary__mlabel">Vigência</span>
        <span class="si-summary__mvalue">{{ days == null ? '—' : `${days} dias` }}</span>
        <span class="si-summary__mhint">{{ coverageHint }}</span>
      </div>
    </SiCard>

    <!-- Dados da cotação -->
    <SiCard
      variant="flat"
      class="si-summary__data"
    >
      <h2 class="si-summary__title">
        Dados da cotação
      </h2>

      <section class="si-summary__group">
        <p class="si-summary__eyebrow">
          Partes
        </p>
        <div class="si-summary__grid">
          <div class="si-summary__field">
            <span class="si-summary__key">Tomador</span>
            <span class="si-summary__val si-summary__val--strong">{{ quotation.policyHolderName }}</span>
          </div>
          <div class="si-summary__field">
            <span class="si-summary__key">CNPJ do tomador</span>
            <span class="si-summary__val si-summary__val--strong si-summary__val--mono">{{ formatCnpj(quotation.policyHolderDocumentNumber) }}</span>
          </div>
          <div class="si-summary__field">
            <span class="si-summary__key">Segurado</span>
            <span class="si-summary__val si-summary__val--strong">{{ quotation.insuredName }}</span>
          </div>
          <div class="si-summary__field">
            <span class="si-summary__key">CNPJ do segurado</span>
            <span class="si-summary__val si-summary__val--strong si-summary__val--mono">{{ formatCnpj(quotation.insuredDocumentNumber) }}</span>
          </div>
        </div>
      </section>

      <section class="si-summary__group">
        <p class="si-summary__eyebrow">
          Objeto e cobertura
        </p>
        <div class="si-summary__grid">
          <div class="si-summary__field">
            <span class="si-summary__key">Modalidade</span>
            <span class="si-summary__val si-summary__val--medium">{{ quotation.modalityName }}</span>
          </div>
          <div class="si-summary__field">
            <span class="si-summary__key">Seguradora</span>
            <span class="si-summary__val si-summary__val--medium">{{ quotation.insurerName }}</span>
          </div>
          <div class="si-summary__field si-summary__field--wide">
            <span class="si-summary__key">Cobertura adicional</span>
            <span
              v-if="sentCoverages.length === 0 && notOfferedCoverages.length === 0"
              class="si-summary__val si-summary__val--medium"
            >—</span>
            <div
              v-else
              class="si-summary__chips"
            >
              <SiChip
                v-for="coverage in sentCoverages"
                :key="coverage.name"
                size="small"
              >
                {{ coverage.name }}
              </SiChip>
              <SiChip
                v-for="coverage in notOfferedCoverages"
                :key="coverage.name"
                size="small"
                color="secondary"
                variant="outlined"
                title="Não contemplada pela seguradora"
              >
                {{ coverage.name }} · não contemplada
              </SiChip>
            </div>
          </div>
        </div>
      </section>

      <section class="si-summary__group">
        <p class="si-summary__eyebrow">
          Vigência e emissão
        </p>
        <div class="si-summary__grid">
          <div class="si-summary__field">
            <span class="si-summary__key">Início da vigência</span>
            <span class="si-summary__val si-summary__val--strong si-summary__val--mono">{{ toBrDateOnly(quotation.coverageStartDate) }}</span>
          </div>
          <div class="si-summary__field">
            <span class="si-summary__key">Fim da vigência</span>
            <span class="si-summary__val si-summary__val--strong si-summary__val--mono">{{ toBrDateOnly(quotation.coverageEndDate) }}</span>
          </div>
          <div class="si-summary__field">
            <span class="si-summary__key">Cotação criada em</span>
            <span class="si-summary__val si-summary__val--strong si-summary__val--mono">{{ toBrDateTime(quotation.createdAt) }}</span>
          </div>
        </div>
      </section>
    </SiCard>
  </div>
</template>

<style scoped>
.si-summary {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
}

/* Faixa de números — 4 células num card só, divisor à esquerda (exceto a 1ª). */
.si-summary__metrics {
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr 1.05fr;
  overflow: hidden;
  box-shadow: var(--si-shadow-1);
}

.si-summary__data {
  overflow: hidden;
  box-shadow: var(--si-shadow-1);
}

.si-summary__metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  min-width: 0;
}

.si-summary__metric + .si-summary__metric {
  border-left: 1px solid var(--si-cinza-claro);
}

.si-summary__mlabel {
  font-size: 11px;
  font-weight: var(--si-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--si-cinza);
  white-space: nowrap;
}

.si-summary__mvalue {
  font-size: 18.5px;
  line-height: 1.2;
  font-weight: var(--si-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.si-summary__mvalue--lead {
  font-size: 20px;
}

.si-summary__mhint {
  font-size: 12px;
  color: var(--si-cinza);
}

/* Card "Dados da cotação". */
.si-summary__title {
  margin: 0;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: var(--si-font-weight-semibold);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-summary__group {
  padding: 18px 20px;
}

.si-summary__group + .si-summary__group {
  border-top: 1px solid var(--si-cinza-claro);
}

.si-summary__eyebrow {
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11.5px;
  font-weight: var(--si-font-weight-semibold);
  color: var(--si-cinza);
  white-space: nowrap;
}

.si-summary__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}

.si-summary__field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.si-summary__field--wide {
  grid-column: 1 / -1;
}

.si-summary__key {
  font-size: 12px;
  color: var(--si-cinza);
}

.si-summary__val {
  font-size: 14px;
}

.si-summary__val--medium {
  font-weight: var(--si-font-weight-medium);
}

.si-summary__val--strong {
  font-weight: var(--si-font-weight-semibold);
}

.si-summary__val--mono {
  font-variant-numeric: tabular-nums;
}

.si-summary__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-2);
}

@media (max-width: 1023.98px) {
  .si-summary__metrics {
    grid-template-columns: 1fr 1fr;
  }

  .si-summary__metric {
    border-top: 1px solid var(--si-cinza-claro);
  }

  .si-summary__metric:nth-child(-n + 2) {
    border-top: none;
  }

  .si-summary__metric:nth-child(odd) {
    border-left: none;
  }

  .si-summary__grid {
    grid-template-columns: 1fr;
  }
}
</style>
