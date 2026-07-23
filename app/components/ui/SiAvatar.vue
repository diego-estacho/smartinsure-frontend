<script setup lang="ts">
/**
 * SiAvatar — wrapper de VAvatar (ADR-013) alinhado ao DS (components/Avatar.jsx): círculo,
 * iniciais em tint verde (verde-100 / verde-800) quando SEM `color`, tamanhos xs..xl
 * (24–72px), fonte das iniciais a 40% do tamanho e um `status` dot opcional (online/away/
 * offline/busy) com borda branca no canto inferior direito. `image`, `icon`, `text` seguem
 * por $attrs; slot default para conteúdo custom (iniciais/ícone).
 */
defineOptions({ inheritAttrs: false })

const SIZES: Record<string, number> = {
  // DS
  xs: 24, sm: 32, md: 40, lg: 56, xl: 72,
  // Vuetify (retrocompat)
  'x-small': 24, small: 32, default: 40, large: 48, 'x-large': 56,
}

const STATUS_LABEL: Record<string, string> = {
  online: 'Online',
  away: 'Ausente',
  offline: 'Offline',
  busy: 'Ocupado',
}

const props = withDefaults(defineProps<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'x-small' | 'small' | 'default' | 'large' | 'x-large' | number | string
  color?: string
  status?: 'online' | 'away' | 'offline' | 'busy'
  rounded?: boolean | string
}>(), {
  size: 'md',
  color: undefined,
  status: undefined,
  rounded: undefined,
})

// Resolve o tamanho em px (aceita keyword do DS/Vuetify, número ou string numérica).
const px = computed(() => {
  const s = props.size
  if (typeof s === 'number') return s
  const n = Number(s)
  if (!Number.isNaN(n)) return n
  return SIZES[s] ?? 40 // fallback = md
})

// DS: fonte das iniciais a 40% e dot a 28% do tamanho (mínimo 8px).
const fontSize = computed(() => Math.round(px.value * 0.4))
const dotSize = computed(() => Math.max(8, Math.round(px.value * 0.28)))
</script>

<template>
  <span class="si-avatar-wrap">
    <VAvatar
      :class="['si-avatar', !color ? 'si-avatar--initials' : undefined]"
      v-bind="$attrs"
      :size="px"
      :color="color"
      :rounded="rounded"
      :style="!color ? { fontSize: `${fontSize}px` } : undefined"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
    </VAvatar>

    <span
      v-if="status"
      class="si-avatar__status"
      :class="`si-avatar__status--${status}`"
      :style="{ inlineSize: `${dotSize}px`, blockSize: `${dotSize}px` }"
      :aria-label="STATUS_LABEL[status]"
    />
  </span>
</template>
