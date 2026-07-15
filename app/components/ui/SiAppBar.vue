<script setup lang="ts">
/**
 * SiAppBar — wrapper de VAppBar (ADR-013). Topbar do shell. Cor/elevação/altura curadas;
 * `title`, `density` etc. por $attrs. Slots livres (prepend, append, default).
 */
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  color?: string
  flat?: boolean
  elevation?: number | string
  height?: number | string
}>(), {
  color: 'surface',
  flat: true,
  elevation: undefined,
  height: undefined,
})
</script>

<template>
  <v-app-bar v-bind="$attrs" :color="color" :flat="flat" :elevation="elevation" :height="height">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-app-bar>
</template>
