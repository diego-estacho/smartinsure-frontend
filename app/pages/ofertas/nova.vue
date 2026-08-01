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
const { activeWorkspace, loadContext } = useWorkspaces()

// Com o id na rota, a página começa em modo de reidratação — evita piscar a tela de entrada antes de
// restaurar (o wizard só monta com a store já preenchida, então o passo 4 não refaz o fan-out).
const routeGroupId = computed(() => (typeof route.query.grupo === 'string' ? route.query.grupo : null))
const restoring = ref(Boolean(routeGroupId.value))

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
    coverageMulta: group.includesPenaltyCoverage,
    coverageLabor: group.includesLaborCoverage,
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
  // Corretora ativa da sessão (RN-064) → origem da Cotação. loadContext é idempotente (carrega 1x);
  // sem Corretora ativa não inventa nada — o passo 4 orienta a selecionar uma.
  await loadContext()
  if (activeWorkspace.value) wizard.setBrokerageId(activeWorkspace.value.id)

  const groupId = routeGroupId.value
  if (!groupId) return

  try {
    await restoreFromRoute(groupId)
  }
  catch {
    // Grupo inexistente / sem acesso → começo limpo na tela de entrada, sem o id inválido na rota.
    wizard.reset()
    await router.replace('/ofertas/nova')
  }
  finally {
    restoring.value = false
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
    v-if="restoring"
    class="nova-oferta__restoring"
  >
    <SiProgressCircular
      indeterminate
      :size="28"
      :width="3"
    />
    <span>Recuperando sua cotação…</span>
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
</style>
