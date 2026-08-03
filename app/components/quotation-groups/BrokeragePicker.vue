<script setup lang="ts">
/**
 * Seletor de Corretora do fluxo de cotação (item C, RN-064). Gate no INÍCIO da oferta: quando o
 * usuário tem 2+ Corretoras vinculadas e nenhuma ativa, ele escolhe aqui — antes do Passo 1 — para
 * nunca fazer todo o fluxo e só descobrir no Passo 4 que faltava a Corretora. Com uma única Corretora
 * o fluxo nem chega aqui (auto-ativada em `useWorkspaces`). Também é reusado no "trocar" (dialog).
 * A troca reemite o acesso no servidor (ADR-065); o front só reflete.
 */
const emit = defineEmits<{ selected: [] }>()

const { workspaces, activeWorkspace, selectWorkspace } = useWorkspaces()

const chosen = ref<string | null>(activeWorkspace.value?.id ?? null)
const saving = ref(false)
const error = ref<string | null>(null)

async function confirm(): Promise<void> {
  if (!chosen.value) {
    error.value = 'Selecione uma corretora para continuar.'
    return
  }
  saving.value = true
  error.value = null
  try {
    await selectWorkspace(chosen.value)
    emit('selected')
  }
  catch {
    error.value = 'Não foi possível selecionar a corretora. Tente novamente.'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="si-broker-pick">
    <h2 class="si-broker-pick__title">
      Selecione a corretora desta cotação
    </h2>
    <p class="si-broker-pick__hint">
      Você tem mais de uma corretora vinculada. A cotação é feita pela corretora escolhida — você pode trocá-la depois.
    </p>

    <SiRadioGroup v-model="chosen">
      <button
        v-for="w in workspaces"
        :key="w.id"
        type="button"
        class="si-broker-pick__item"
        :class="{ 'si-broker-pick__item--on': chosen === w.id }"
        @click="chosen = w.id"
      >
        <SiRadio
          :value="w.id"
          hide-details
          tabindex="-1"
        />
        <SiAvatar :size="36">
          <SiIcon
            icon="building"
            :size="18"
          />
        </SiAvatar>
        <span class="si-broker-pick__item-text">
          <span class="si-broker-pick__item-name">{{ w.name }}</span>
          <span class="si-broker-pick__item-doc">{{ w.document }}</span>
        </span>
      </button>
    </SiRadioGroup>

    <SiAlert
      v-if="error"
      type="error"
      class="mt-3 mb-0"
      :text="error"
    />

    <div class="si-broker-pick__actions">
      <SiButton
        :loading="saving"
        :append-icon="'arrowRight'"
        @click="confirm"
      >
        Continuar
      </SiButton>
    </div>
  </div>
</template>

<style scoped>
.si-broker-pick__title {
  margin: var(--si-space-4) 0 var(--si-space-1);
  font-size: var(--si-fs-h4);
  font-weight: var(--si-font-weight-semibold);
}

.si-broker-pick__hint {
  margin: 0 0 var(--si-space-4);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: var(--si-fs-small);
}

.si-broker-pick__item {
  display: flex;
  align-items: center;
  gap: var(--si-space-2);
  width: 100%;
  padding: var(--si-space-2) var(--si-space-3);
  border: 1px solid var(--si-cinza-claro);
  border-radius: var(--si-radius-md);
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  font: inherit;
  text-align: start;
  transition:
    border-color var(--si-dur-fast) var(--si-ease-out),
    background-color var(--si-dur-fast) var(--si-ease-out);
}

.si-broker-pick__item + .si-broker-pick__item {
  margin-top: var(--si-space-2);
}

.si-broker-pick__item:hover {
  border-color: rgb(var(--v-theme-primary));
}

.si-broker-pick__item--on {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.si-broker-pick__item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.si-broker-pick__item-name {
  font-size: var(--si-fs-small);
  font-weight: var(--si-font-weight-semibold);
}

.si-broker-pick__item-doc {
  font-size: var(--si-fs-caption, 0.75rem);
  color: var(--si-cinza);
  font-variant-numeric: tabular-nums;
}

.si-broker-pick__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--si-space-6);
  padding-top: var(--si-space-5);
  border-top: 1px solid var(--si-cinza-claro);
}
</style>
