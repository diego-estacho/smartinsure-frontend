<script setup lang="ts">
/**
 * QuotationGroupsHeader — cabeçalho do fluxo "nova oferta" (protótipo design_handoff_nova_oferta,
 * exec-plan 0015). Marca à esquerda; à direita a conta e "Sair e cancelar oferta". O fluxo é
 * focado: NÃO há o menu de navegação da app (o resumo ocupa a lateral no desktop).
 *
 * A identidade real do usuário depende de contrato (OPEN-03) — por isso conta neutra, sem inventar
 * nome (mesmo critério do shell/0014). "Sair e cancelar oferta" descarta o rascunho e volta à lista.
 */
const { isMobile } = useIsMobile()
const wizard = useQuotationGroupWizardStore()

async function exitAndCancel(): Promise<void> {
  wizard.reset()
  await navigateTo('/cotacoes')
}
</script>

<template>
  <header class="si-qg-header">
    <NuxtLink
      to="/cotacoes"
      class="si-qg-header__brand"
      aria-label="SmartInsure — voltar para cotações"
    >
      <img
        src="/brand/symbol.png"
        alt=""
        width="28"
        height="28"
        class="si-qg-header__symbol"
      >
      <span class="si-qg-header__wordmark">
        <span class="si-qg-header__smart">Smart</span><span class="si-qg-header__insure">insure</span>
      </span>
    </NuxtLink>

    <div class="si-qg-header__actions">
      <div
        v-if="!isMobile"
        class="si-qg-header__account"
      >
        <SiAvatar
          color="primary"
          :size="34"
        >
          <SiIcon
            icon="user"
            :size="18"
          />
        </SiAvatar>
        <span class="si-qg-header__account-label">Minha conta</span>
      </div>

      <SiButton
        variant="outlined"
        color="secondary"
        @click="exitAndCancel"
      >
        Sair e cancelar oferta
      </SiButton>
    </div>
  </header>
</template>

<style scoped>
.si-qg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--si-space-3);
  padding: var(--si-space-5) var(--si-space-8);
  border-bottom: 1px solid var(--si-cinza-claro);
}

.si-qg-header__brand {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  text-decoration: none;
}

.si-qg-header__symbol {
  object-fit: contain;
}

.si-qg-header__wordmark {
  font-weight: var(--si-font-weight-bold);
  font-size: var(--si-fs-h4);
  letter-spacing: var(--si-ls-h2);
  white-space: nowrap;
}

.si-qg-header__smart {
  color: rgb(var(--v-theme-primary));
}

.si-qg-header__insure {
  color: rgb(var(--v-theme-on-surface));
}

.si-qg-header__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-4);
}

.si-qg-header__account {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
}

.si-qg-header__account-label {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-medium);
}
</style>
