<script setup lang="ts">
import { mdiArrowRight, mdiDomain, mdiOfficeBuildingOutline, mdiShieldCheckOutline } from '~/lib/icons'

// Home dentro do shell (sidebar). Atalhos apenas pra jornadas que existem —
// jornada nova entra aqui quando a rota dela nascer (OPEN-01: sem termo de
// domínio não ratificado, sem promessa de tela futura).
definePageMeta({ layout: 'shell' })
useHead({ title: 'SmartInsure' })

const shortcuts = [
  {
    title: 'Corretoras',
    description: 'Cadastro, situação e habilitações de seguradora das corretoras.',
    to: '/corretoras',
    icon: mdiOfficeBuildingOutline,
  },
  {
    title: 'Tomadores',
    description: 'Cadastro, endereços e nomeações dos tomadores.',
    to: '/tomadores',
    icon: mdiDomain,
  },
]
</script>

<template>
  <VContainer class="si-home">
    <div class="si-home__hero">
      <SiIcon
        :icon="mdiShieldCheckOutline"
        size="40"
        color="primary"
      />
      <div>
        <h1 class="text-h5">
          Bem-vindo ao SmartInsure
        </h1>
        <p class="text-body-2 si-home__subtitle">
          Selecione uma área no menu ao lado ou use os atalhos abaixo.
        </p>
      </div>
    </div>

    <div class="si-home__grid">
      <SiCard
        v-for="shortcut in shortcuts"
        :key="shortcut.to"
        class="si-home__card pa-5"
        :elevation="1"
        hover
        :to="shortcut.to"
      >
        <div class="si-home__card-header">
          <SiIcon
            :icon="shortcut.icon"
            size="28"
            color="primary"
          />
          <h2 class="text-subtitle-1">
            {{ shortcut.title }}
          </h2>
        </div>

        <p class="text-body-2 si-home__card-description">
          {{ shortcut.description }}
        </p>

        <div class="si-home__card-action">
          <SiButton
            variant="text"
            color="primary"
            :append-icon="mdiArrowRight"
            :to="shortcut.to"
          >
            Acessar
          </SiButton>
        </div>
      </SiCard>
    </div>
  </VContainer>
</template>

<style scoped>
.si-home {
  max-width: var(--si-container-wide);
}

.si-home__hero {
  display: flex;
  align-items: center;
  gap: var(--si-space-4);
  margin-block: var(--si-space-8) var(--si-space-6);
}

.si-home__hero h1 {
  margin: 0;
}

.si-home__subtitle {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.si-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--si-space-4);
}

.si-home__card {
  display: flex;
  flex-direction: column;
  gap: var(--si-space-3);
}

.si-home__card-header {
  display: flex;
  align-items: center;
  gap: var(--si-space-3);
}

.si-home__card-header h2 {
  margin: 0;
}

.si-home__card-description {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.72);
  flex: 1;
}

.si-home__card-action {
  display: flex;
  justify-content: flex-end;
}
</style>
