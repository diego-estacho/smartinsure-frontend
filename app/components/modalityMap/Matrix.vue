<script setup lang="ts">
/**
 * Matriz Seguradoras × Modalidades (RN-033: a Modalidade é o eixo; duas ofertas só são "a mesma
 * modalidade" quando ambas as Modalidades Importadas confirmam para ela). Apresentacional
 * (ADR-018): recebe as entradas por prop, não decide nada. `offered` (é ofertada) e `branches`
 * (ramos) são derivados no servidor (RN-033) — o cliente só renderiza, por nome estável (ADR-004).
 * A coluna Seguradoras exibe UMA badge por Seguradora distinta (o contrato entrega a lista plana,
 * uma entrada por Modalidade Importada confirmada; a agregação por insurerId é só de visão) — a
 * contagem vai na badge e os nomes de origem no tooltip. Mobile-first (ADR-017): desktop = tabela
 * densa; mobile = cards empilhados.
 */
import type { ModalityMapEntry } from '~/composables/useModalityMap'
import { groupInsurersById } from '~/lib/modalityMap'
import { getModalityStatusView } from '~/lib/status/modalities'
import { getSuretyBranchView } from '~/lib/status/suretyBranches'

defineProps<{
  entries: ModalityMapEntry[]
  loading?: boolean
}>()

const { mobile } = useDisplay()

const headers = [
  { title: 'Modalidade', key: 'name' },
  { title: 'Grupo de Modalidade', key: 'groupName' },
  { title: 'Situação', key: 'status', align: 'center' },
  { title: 'Ofertada', key: 'offered', align: 'center' },
  { title: 'Ramos', key: 'branches' },
  { title: 'Seguradoras', key: 'insurers' },
] as const
</script>

<template>
  <!-- Desktop: tabela densa -->
  <SiDataTable
    v-if="!mobile"
    :headers="headers"
    :items="entries"
    :loading="loading"
    :items-per-page="20"
    density="compact"
    class="si-modality-map-matrix"
  >
    <template #[`item.status`]="{ item }">
      <div class="si-modality-map-matrix__center">
        <SiChip
          :color="getModalityStatusView(item.status).color"
          size="small"
        >
          {{ getModalityStatusView(item.status).label }}
        </SiChip>
      </div>
    </template>

    <template #[`item.offered`]="{ item }">
      <div class="si-modality-map-matrix__center">
        <SiChip
          :color="item.offered ? 'success' : 'default'"
          size="small"
          variant="tonal"
        >
          {{ item.offered ? 'Ofertada' : 'Fora de operação' }}
        </SiChip>
      </div>
    </template>

    <template #[`item.branches`]="{ item }">
      <div class="si-modality-map-matrix__chips">
        <template v-if="item.branches.length">
          <SiChip
            v-for="branch in item.branches"
            :key="branch"
            :color="getSuretyBranchView(branch).color"
            size="x-small"
            variant="tonal"
          >
            {{ getSuretyBranchView(branch).label }}
          </SiChip>
        </template>
        <span
          v-else
          class="si-modality-map-matrix__muted"
        >-</span>
      </div>
    </template>

    <template #[`item.insurers`]="{ item }">
      <div class="si-modality-map-matrix__chips">
        <template v-if="item.insurers.length">
          <!-- Uma badge por Seguradora distinta (RN-033), não por Modalidade Importada. -->
          <SiTooltip
            v-for="insurer in groupInsurersById(item.insurers)"
            :key="insurer.insurerId"
            location="top"
          >
            <template #activator="{ props }">
              <SiChip
                v-bind="props"
                size="x-small"
                variant="outlined"
              >
                {{ insurer.insurerName }}
                <template
                  v-if="insurer.count > 1"
                  #append
                >
                  <span class="si-modality-map-matrix__count">{{ insurer.count }}</span>
                </template>
              </SiChip>
            </template>

            <div class="si-modality-map-matrix__origins">
              <strong>{{ insurer.insurerName }}</strong>
              <span>{{ insurer.count }} Modalidade{{ insurer.count === 1 ? '' : 's' }} Importada{{ insurer.count === 1 ? '' : 's' }}</span>
              <ul>
                <li
                  v-for="(origin, index) in insurer.origins"
                  :key="index"
                >
                  {{ origin }}
                </li>
              </ul>
            </div>
          </SiTooltip>
        </template>
        <span
          v-else
          class="si-modality-map-matrix__muted"
        >Nenhuma Seguradora</span>
      </div>
    </template>

    <template #no-data>
      Nenhuma Modalidade no catálogo.
    </template>
  </SiDataTable>

  <!-- Mobile: cards empilhados (ADR-017) -->
  <div
    v-else
    class="si-modality-map-cards"
  >
    <SiProgressLinear
      v-if="loading"
      indeterminate
    />

    <p
      v-if="!entries.length && !loading"
      class="si-modality-map-cards__empty"
    >
      Nenhuma Modalidade no catálogo.
    </p>

    <SiCard
      v-for="entry in entries"
      :key="entry.modalityId"
      variant="outlined"
      class="si-modality-map-cards__item"
    >
      <div class="si-modality-map-cards__head">
        <span class="si-modality-map-cards__name">{{ entry.name }}</span>
        <SiChip
          :color="getModalityStatusView(entry.status).color"
          size="small"
        >
          {{ getModalityStatusView(entry.status).label }}
        </SiChip>
      </div>

      <dl class="si-modality-map-cards__facts">
        <div class="si-modality-map-cards__fact">
          <dt>Grupo de Modalidade</dt>
          <dd>{{ entry.groupName }}</dd>
        </div>
        <div class="si-modality-map-cards__fact">
          <dt>Ofertada</dt>
          <dd>{{ entry.offered ? 'Sim' : 'Fora de operação' }}</dd>
        </div>
        <div class="si-modality-map-cards__fact">
          <dt>Ramos</dt>
          <dd>
            <span
              v-if="!entry.branches.length"
              class="si-modality-map-matrix__muted"
            >-</span>
            <SiChip
              v-for="branch in entry.branches"
              :key="branch"
              :color="getSuretyBranchView(branch).color"
              size="x-small"
              variant="tonal"
              class="ml-1"
            >
              {{ getSuretyBranchView(branch).label }}
            </SiChip>
          </dd>
        </div>
      </dl>

      <div class="si-modality-map-cards__insurers">
        <span
          v-if="!entry.insurers.length"
          class="si-modality-map-matrix__muted"
        >Nenhuma Seguradora</span>
        <!-- Uma badge por Seguradora distinta (RN-033), não por Modalidade Importada. -->
        <SiTooltip
          v-for="insurer in groupInsurersById(entry.insurers)"
          :key="insurer.insurerId"
          location="top"
        >
          <template #activator="{ props }">
            <SiChip
              v-bind="props"
              size="x-small"
              variant="outlined"
            >
              {{ insurer.insurerName }}
              <template
                v-if="insurer.count > 1"
                #append
              >
                <span class="si-modality-map-matrix__count">{{ insurer.count }}</span>
              </template>
            </SiChip>
          </template>

          <div class="si-modality-map-matrix__origins">
            <strong>{{ insurer.insurerName }}</strong>
            <span>{{ insurer.count }} Modalidade{{ insurer.count === 1 ? '' : 's' }} Importada{{ insurer.count === 1 ? '' : 's' }}</span>
            <ul>
              <li
                v-for="(origin, index) in insurer.origins"
                :key="index"
              >
                {{ origin }}
              </li>
            </ul>
          </div>
        </SiTooltip>
      </div>
    </SiCard>
  </div>
</template>

<style scoped>
.si-modality-map-matrix__center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.si-modality-map-matrix__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-1);
  padding-block: var(--si-space-1);
}

.si-modality-map-matrix__muted {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

/* Contagem de Modalidades Importadas por trás da Seguradora, dentro da própria badge. */
.si-modality-map-matrix__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25em;
  height: 1.25em;
  padding-inline: 0.35em;
  margin-inline-start: var(--si-space-1);
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  font-size: 0.85em;
  font-weight: var(--si-font-weight-semibold);
  line-height: 1;
}

.si-modality-map-matrix__origins {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-1);
  max-width: 22rem;
}

.si-modality-map-matrix__origins span {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: var(--si-fs-small);
}

.si-modality-map-matrix__origins ul {
  margin: 0;
  padding-inline-start: var(--si-space-4);
}

.si-modality-map-cards {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
  padding: var(--si-space-3);
}

.si-modality-map-cards__empty {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: var(--si-space-6) 0;
}

.si-modality-map-cards__item {
  padding: var(--si-space-4);
}

.si-modality-map-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-2);
  margin-bottom: var(--si-space-3);
}

.si-modality-map-cards__name {
  font-weight: var(--si-font-weight-semibold);
}

.si-modality-map-cards__facts {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-2);
  margin: 0 0 var(--si-space-3);
}

.si-modality-map-cards__fact {
  display: flex;
  justify-content: space-between;
  gap: var(--si-space-3);
  font-size: var(--si-fs-small);
}

.si-modality-map-cards__fact dt {
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-modality-map-cards__fact dd {
  margin: 0;
  text-align: right;
}

.si-modality-map-cards__insurers {
  display: flex;
  flex-wrap: wrap;
  gap: var(--si-space-1);
}
</style>
