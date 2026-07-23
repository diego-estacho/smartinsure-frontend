// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { required } from '~/lib/rules'

import SiButton from '~/components/ui/SiButton.vue'
import SiTextField from '~/components/ui/SiTextField.vue'
import SiCurrencyField from '~/components/ui/SiCurrencyField.vue'
import SiForm from '~/components/ui/SiForm.vue'
import SiPagination from '~/components/ui/SiPagination.vue'
import SiStepper from '~/components/ui/SiStepper.vue'
import SiIconButton from '~/components/ui/SiIconButton.vue'

describe('SiButton — curado + passthrough (ADR-013)', () => {
  it('aplica defaults do DS: primary, rounded-md, variante flat', async () => {
    const w = await mountSuspended(SiButton, { slots: { default: () => 'Salvar' } })
    const btn = w.find('.v-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('bg-primary')
    expect(btn.classes()).toContain('rounded-md')
    expect(btn.classes()).toContain('v-btn--variant-flat')
    expect(w.text()).toContain('Salvar')
  })

  it('cor curada sobrescreve o default', async () => {
    const w = await mountSuspended(SiButton, { props: { color: 'error' }, slots: { default: () => 'X' } })
    expect(w.find('.v-btn').classes()).toContain('bg-error')
  })

  it('passthrough: atributos não-declarados vão pro VBtn (disabled)', async () => {
    const w = await mountSuspended(SiButton, { attrs: { disabled: true }, slots: { default: () => 'X' } })
    expect(w.find('.v-btn').classes()).toContain('v-btn--disabled')
  })
})

describe('SiTextField — v-model', () => {
  it('emite update:modelValue ao digitar', async () => {
    const w = await mountSuspended(SiTextField, { props: { modelValue: '' } })
    await w.find('input').setValue('corretor')
    const emitted = w.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted?.at(-1)).toEqual(['corretor'])
  })
})

describe('SiCurrencyField — BRL', () => {
  it('formata o número em BRL no input (R$ 1.240,50)', async () => {
    const w = await mountSuspended(SiCurrencyField, { props: { modelValue: 1240.5 } })
    const value = (w.find('input').element as HTMLInputElement).value
    expect(value).toContain('1.240,50')
    expect(value).toContain('R$')
  })
})

describe('SiForm — validação nativa', () => {
  it('validate() reprova quando um campo obrigatório está vazio', async () => {
    const w = await mountSuspended(SiForm, {
      slots: {
        default: () => h(SiTextField, { modelValue: '', rules: [required()] }),
      },
    })
    const exposed = (w.vm.$ as unknown as { exposed: { validate: () => Promise<{ valid: boolean }> } }).exposed
    const result = await exposed.validate()
    expect(result.valid).toBe(false)
  })
})

describe('SiPagination — navegação (ref InsurePoint)', () => {
  it('resumo "Mostrando N de total" usa o último item da página', async () => {
    const w = await mountSuspended(SiPagination, { props: { page: 1, itemsPerPage: 10, total: 2313 } })
    expect(w.text()).toContain('Mostrando 10 de 2313 resultados')
  })

  it('janela com reticências para muitas páginas: 1 … atual±1 … total', async () => {
    const w = await mountSuspended(SiPagination, { props: { page: 1, itemsPerPage: 10, total: 2313 } })
    const labels = w.findAll('.si-pagination__page').map(b => b.text())
    expect(labels[0]).toBe('1')
    expect(labels.at(-1)).toBe('232') // ceil(2313/10)
    expect(w.findAll('.si-pagination__ellipsis').length).toBeGreaterThan(0)
  })

  it('clicar num número emite update:page', async () => {
    const w = await mountSuspended(SiPagination, { props: { page: 1, itemsPerPage: 10, total: 2313 } })
    const ultima = w.findAll('.si-pagination__page').at(-1)!
    await ultima.trigger('click')
    expect(w.emitted('update:page')?.at(-1)).toEqual([232])
  })

  it('marca a página ativa', async () => {
    const w = await mountSuspended(SiPagination, { props: { page: 2, itemsPerPage: 10, total: 2313 } })
    const ativa = w.find('.si-pagination__page--active')
    expect(ativa.exists()).toBe(true)
    expect(ativa.text()).toBe('2')
  })
})

describe('SiStepper — estados e navegação (DS Stepper)', () => {
  const steps = [{ label: 'A' }, { label: 'B' }, { label: 'C' }]

  function statesOf(w: Awaited<ReturnType<typeof mountSuspended>>) {
    return w.findAll('.si-stepper__step').map((s) => {
      if (s.classes().some(c => c.endsWith('--done'))) return 'done'
      if (s.classes().some(c => c.endsWith('--current'))) return 'current'
      return 'todo'
    })
  }

  it('classifica etapas: concluída (<current), atual (=current), futura (>current)', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 1 } })
    expect(statesOf(w)).toEqual(['done', 'current', 'todo'])
  })

  it('etapa concluída não mostra número (mostra o check); atual/futura mostram o número', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 1 } })
    const dots = w.findAll('.si-stepper__dot')
    expect(dots[0]!.text()).toBe('') // done → check, sem número
    expect(dots[1]!.text()).toBe('2') // current → número
    expect(dots[2]!.text()).toBe('3') // todo → número
  })

  it('conector fica verde só até a etapa atual', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 1 } })
    const conns = w.findAll('.si-stepper__connector')
    expect(conns[0]!.classes()).toContain('si-stepper__connector--done')
    expect(conns[1]!.classes()).not.toContain('si-stepper__connector--done')
  })

  it('clickable: clicar numa etapa já alcançada (<=current) emite update:current', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 2, clickable: true } })
    await w.findAll('.si-stepper__label-block')[0]!.trigger('click')
    expect(w.emitted('update:current')?.at(-1)).toEqual([0])
  })

  it('clickable: clicar numa etapa futura (>current) não navega', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 0, clickable: true } })
    await w.findAll('.si-stepper__label-block')[2]!.trigger('click')
    expect(w.emitted('update:current')).toBeFalsy()
  })

  it('sem clickable: clicar não emite (indicador só de leitura)', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 2 } })
    await w.findAll('.si-stepper__label-block')[0]!.trigger('click')
    expect(w.emitted('update:current')).toBeFalsy()
  })

  it('orientação vertical aplica o modificador', async () => {
    const w = await mountSuspended(SiStepper, { props: { steps, current: 0, orientation: 'vertical' } })
    expect(w.find('.si-stepper').classes()).toContain('si-stepper--vertical')
  })
})

describe('SiIconButton — botão-ícone discreto (DS .iconbtn)', () => {
  it('renderiza um VBtn text com a classe do skin e o ícone', async () => {
    const w = await mountSuspended(SiIconButton, { props: { icon: 'eye' }, attrs: { 'aria-label': 'Ver' } })
    const btn = w.find('.v-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('si-icon-button')
    expect(btn.classes()).toContain('v-btn--variant-text')
    expect(w.find('.v-icon').exists()).toBe(true)
  })

  it('tone="view" adiciona o modificador de hover verde; neutro (default) não', async () => {
    const view = await mountSuspended(SiIconButton, { props: { icon: 'eye', tone: 'view' }, attrs: { 'aria-label': 'Ver' } })
    expect(view.find('.v-btn').classes()).toContain('si-icon-button--view')

    const neutral = await mountSuspended(SiIconButton, { props: { icon: 'pencil' }, attrs: { 'aria-label': 'Editar' } })
    expect(neutral.find('.v-btn').classes()).not.toContain('si-icon-button--view')
  })

  it('passthrough: repassa atributos de ativador/eventos ao VBtn (aria-label)', async () => {
    const w = await mountSuspended(SiIconButton, { props: { icon: 'dotsHorizontal' }, attrs: { 'aria-label': 'Mais ações' } })
    expect(w.find('.v-btn').attributes('aria-label')).toBe('Mais ações')
  })
})
