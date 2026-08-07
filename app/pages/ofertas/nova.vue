<script setup lang="ts">
/**
 * Nova oferta (QuotationGroup) — página orquestradora fina (ADR-018). O fluxo (tela de entrada +
 * 5 etapas + resumo lateral) vive no componente de domínio QuotationGroupsWizard; a página só
 * define o layout e o monta. Rota provisória `/ofertas/nova` (exec-plan 0015).
 *
 * Deep-link / refresh: ao salvar o grupo, o id passa a viver na rota (`?grupo=<id>`). Recarregar a
 * página com esse id reidrata o wizard a partir do grupo salvo (GET) e retoma a etapa de Cotações —
 * o corretor não perde o trabalho num F5. Sem o id na rota, começa do zero (tela de entrada).
 *
 * Fluxo FOCADO: usa o layout `default` (sem o menu de navegação da app) — a lateral é ocupada
 * pelo resumo da oferta, conforme o protótipo. O cabeçalho próprio vive no QuotationGroupsWizard.
 */
import type { SelectedInsured, SelectedPolicyHolder } from '~/stores/quotationGroupWizard'
import type { GetQuotationGroupResponse } from '~/composables/useQuotationGroups'

definePageMeta({ layout: 'default' })

const wizard = useQuotationGroupWizardStore()
const route = useRoute()
const router = useRouter()
const { getQuotationGroup } = useQuotationGroups()
const { restore: restoreQuotations } = useQuotationPolling()

// A Corretora da oferta é a Corretora ativa da sessão (RN-064): o vínculo Usuário↔Corretora já é
// resolvido no servidor e exposto por `/api/me` (workspace switcher). O fan-out/seleção/minuta usam
// esse id; o backend valida a Habilitação ao cotar. Sem Corretora ativa, o passo 4 orienta a escolher.
const { activeWorkspace, hasWorkspaces, loadContext } = useWorkspaces()

const routeGroupId = computed(() => (typeof route.query.grupo === 'string' ? route.query.grupo : null))
// `preparing`: até resolver a Corretora ativa e uma eventual reidratação — evita piscar o wizard antes
// de decidir se precisa do gate de corretora (item C) ou de restaurar um grupo salvo.
const preparing = ref(true)
// Item C: gate de corretora — 2+ vínculos e nenhuma ativa → escolher a corretora antes do Passo 1,
// para nunca fazer todo o fluxo e só descobrir a falta no Passo 4.
const pickingBrokerage = ref(false)

function onBrokerageSelected(): void {
  pickingBrokerage.value = false
  if (activeWorkspace.value) wizard.setBrokerageId(activeWorkspace.value.id)
}

type PersonAddress = NonNullable<GetQuotationGroupResponse['policyHolder']['mainAddress']>

/** Endereço principal em uma linha — mesma forma das etapas 1/2 (com CEP formatado); nulo quando vazio. */
function formatPersonAddress(address: PersonAddress | null | undefined): string | null {
  if (!address) return null
  const digits = address.zipCode?.replace(/\D/g, '') ?? ''
  const cep = digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : address.zipCode
  const line = [
    [address.street, address.number].filter(Boolean).join(', '),
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    cep ? `CEP ${cep}` : '',
  ].filter(Boolean).join(' · ')
  return line || null
}

/** Escopo do contrato ('All' | 'Specific') → modo do wizard ('all' | 'specific'), inverso do salvar. */
function toWizardScopeMode(scopeMode: string): 'all' | 'specific' {
  return scopeMode === 'Specific' ? 'specific' : 'all'
}

/** Reidrata o wizard a partir do grupo salvo e do leque de Cotações persistido, retomando o passo 4. */
async function restoreFromRoute(groupId: string): Promise<void> {
  const group = await getQuotationGroup(groupId)

  const policyHolder: SelectedPolicyHolder = {
    id: group.policyHolder.id,
    name: group.policyHolder.name,
    documentNumber: group.policyHolder.documentNumber,
    mainAddress: formatPersonAddress(group.policyHolder.mainAddress),
  }
  const insured: SelectedInsured = {
    id: group.insured.id,
    name: group.insured.name,
    documentNumber: group.insured.documentNumber,
    socialName: group.insured.socialName ?? null,
    mainAddress: formatPersonAddress(group.insured.mainAddress),
    // RN-503: a oferta salva guarda a RÉPLICA do endereço, não o id do cadastro — então não há id a
    // reidratar. `null` diz ao servidor "preserva o que já está replicado": salvar de novo sem passar
    // pela etapa do Segurado não troca o endereço combinado. Trocar exige reescolher no passo 2.
    addressId: null,
  }

  wizard.setPolicyHolder(policyHolder)
  wizard.setInsured(insured)
  wizard.scope = { mode: toWizardScopeMode(group.scopeMode), insurerIds: [...group.insurerIds] }
  wizard.risk = {
    modalityId: group.modalityId,
    modalityName: group.modalityName,
    insuredAmount: group.insuredAmount,
    startDate: group.coverageStartDate,
    endDate: group.coverageEndDate,
    additionalCoverageIds: [...(group.additionalCoverageIds ?? [])],
    complementaryModalityId: null,
  }
  wizard.setQuotationGroupId(group.id)

  // Leque de Cotações persistido (GET barato — NÃO recota): popula a store e reflete a escolhida (RN-059).
  // Fixa a assinatura para o passo 4 preservar o resultado; ele retoma o polling ao montar se ainda cotando.
  await restoreQuotations()

  wizard.phase = 'steps'
  wizard.currentStep = 3
}

onMounted(async () => {
  // Corretora ativa da sessão (RN-064) → origem da Cotação. loadContext auto-ativa quando há só uma
  // (item C). Com ativa, propaga; sem ativa e com 2+ vínculos, abre o gate de corretora.
  await loadContext()
  if (activeWorkspace.value) wizard.setBrokerageId(activeWorkspace.value.id)

  const groupId = routeGroupId.value
  if (!groupId) {
    if (!activeWorkspace.value && hasWorkspaces.value) pickingBrokerage.value = true
    preparing.value = false
    return
  }

  try {
    await restoreFromRoute(groupId)
  }
  catch {
    // Grupo inexistente / sem acesso → começo limpo na tela de entrada, sem o id inválido na rota.
    wizard.reset()
    await router.replace('/ofertas/nova')
  }
  finally {
    preparing.value = false
  }
})

// Mantém o id do grupo salvo na rota (?grupo=<id>): a partir do salvamento (passo 3→4), o link passa a
// sobreviver a um refresh. Só adiciona quando muda — não mexe na rota em navegação normal.
watch(() => wizard.quotationGroupId, (id) => {
  if (id && route.query.grupo !== id) {
    void router.replace({ query: { ...route.query, grupo: id } })
  }
})
</script>

<template>
  <div
    v-if="preparing"
    class="nova-oferta__restoring"
  >
    <SiProgressCircular
      indeterminate
      :size="28"
      :width="3"
    />
    <span v-if="routeGroupId">Recuperando sua cotação…</span>
  </div>
  <div
    v-else-if="pickingBrokerage"
    class="nova-oferta__gate"
  >
    <SiCard class="nova-oferta__gate-card">
      <QuotationGroupsBrokeragePicker @selected="onBrokerageSelected" />
    </SiCard>
  </div>
  <QuotationGroupsWizard v-else />
</template>

<style scoped>
.nova-oferta__restoring {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--si-space-3);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.nova-oferta__gate {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--si-space-5);
}

.nova-oferta__gate-card {
  width: 100%;
  max-width: 520px;
  padding: var(--si-space-5) var(--si-space-6) var(--si-space-6);
}
</style>
