<script setup lang="ts">
/**
 * Home (`/`) = o painel (dashboard). É a página inicial do usuário logado — o login
 * redireciona pra cá. Reprodução do protótipo do design system
 * (`design system/ui_kits/web/index.html`) no stack do app: kit `Si` + tokens + `@mdi/js`,
 * traduzido pelo de-para (docs/design-system-map.md, ADR-019). Página fina (ADR-018):
 * orquestra layout + composição; cada bloco é um componente de domínio em components/dashboard/.
 *
 * DADOS SÃO MOCK (useDashboardMock) — existe só para validar a fidelidade ao DS. Sem backend
 * ainda; a busca e "Nova apólice" são ilustrativas. Quando o contrato existir, troca-se o mock
 * por consumo do BFF (ADR-008) e removem-se os no-ops. Exec-plan 0009.
 */

definePageMeta({ layout: 'shell' })
useHead({ title: 'Painel — SmartInsure' })

const dashboard = useDashboardMock()
const period = ref('month')
const search = ref('')
</script>

<template>
  <div class="si-painel">
    <header class="si-painel__toolbar">
      <SiTextField
        v-model="search"
        class="si-painel__search"
        placeholder="Buscar apólice, segurado ou CPF…"
        density="compact"
        hide-details
        :prepend-inner-icon="'search'"
      />

      <div class="si-painel__actions">
        <SiButton
          variant="text"
          icon
          aria-label="Notificações"
        >
          <SiIcon :icon="'bell'" />
        </SiButton>
        <SiButton
          variant="text"
          icon
          aria-label="Ajuda"
        >
          <SiIcon :icon="'helpCircle'" />
        </SiButton>
        <SiButton :prepend-icon="'plus'">
          Nova apólice
        </SiButton>
      </div>
    </header>

    <SiAlert
      type="info"
      variant="tonal"
      class="si-painel__notice"
      text="Painel de demonstração — dados ilustrativos (mock) para validar a fidelidade ao design system. Ainda sem backend."
    />

    <div class="si-painel__head">
      <div class="si-painel__intro">
        <span class="si-painel__eyebrow">Painel do parceiro · {{ dashboard.context }}</span>
        <h1 class="si-painel__title">
          {{ dashboard.greeting }}
        </h1>
        <p class="si-painel__sub">
          {{ dashboard.highlight }}
        </p>
      </div>

      <DashboardFilters v-model="period" />
    </div>

    <DashboardKpis :items="dashboard.kpis" />

    <div class="si-painel__grid">
      <DashboardTrendChart
        :title="dashboard.chart.title"
        :updated-at="dashboard.chart.updatedAt"
        :current="dashboard.chart.current"
        :previous="dashboard.chart.previous"
      />
      <DashboardActivity :entries="dashboard.activity" />
    </div>
  </div>
</template>

<style scoped>
.si-painel {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-5);
  padding: var(--si-space-6) var(--si-space-8) var(--si-space-16);
}

.si-painel__toolbar {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-painel__search {
  flex: 1 1 auto;
  max-width: 480px;
}

.si-painel__actions {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  margin-left: auto;
}

.si-painel__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--si-space-4);
}

.si-painel__intro {
  min-width: 0;
}

.si-painel__eyebrow {
  font-size: var(--si-fs-eyebrow);
  line-height: var(--si-lh-eyebrow);
  letter-spacing: var(--si-ls-eyebrow);
  text-transform: uppercase;
  font-weight: var(--si-font-weight-semibold);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-painel__title {
  margin: var(--si-space-1) 0 0;
  font-size: var(--si-fs-h2);
  line-height: var(--si-lh-h2);
  letter-spacing: var(--si-ls-h2);
  font-weight: var(--si-font-weight-semibold);
}

.si-painel__sub {
  margin: var(--si-space-1) 0 0;
  font-size: var(--si-fs-small);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.si-painel__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--si-space-4);
}

@media (max-width: 960px) {
  .si-painel {
    padding: var(--si-space-4) var(--si-space-4) var(--si-space-12);
  }

  .si-painel__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .si-painel__search {
    max-width: none;
  }

  .si-painel__actions {
    margin-left: 0;
    justify-content: flex-end;
  }

  .si-painel__head {
    flex-direction: column;
    align-items: stretch;
  }

  .si-painel__grid {
    grid-template-columns: 1fr;
  }
}
</style>
