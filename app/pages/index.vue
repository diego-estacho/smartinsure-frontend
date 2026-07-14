<script setup lang="ts">
import { mdiShieldCheckOutline } from '~/lib/icons'

// Landing neutra — sem termo de domínio nem status (OPEN-01 aberta: glossário e
// máquina de estados ainda não ratificados). As jornadas entram quando fechar.
useHead({ title: 'SmartInsure' })
</script>

<template>
  <v-main>
    <v-container class="py-16">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card :elevation="2" class="pa-6">
            <div class="d-flex align-center mb-4" style="gap: var(--si-space-3)">
              <v-icon :icon="mdiShieldCheckOutline" size="32" color="primary" />
              <h1 class="text-h5">SmartInsure</h1>
            </div>
            <p class="text-body-1 mb-4">
              Scaffold do frontend. A estrutura está pronta; as telas entram quando o
              domínio for ratificado.
            </p>
            <v-chip color="success" variant="tonal" size="small">ambiente pronto</v-chip>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
