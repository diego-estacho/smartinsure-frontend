// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import { VLayout } from 'vuetify/components'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mdiMenu } from '~/lib/icons'

import SiAppBar from '~/components/ui/SiAppBar.vue'
import SiNavigationDrawer from '~/components/ui/SiNavigationDrawer.vue'

import SiButton from '~/components/ui/SiButton.vue'
import SiIconButton from '~/components/ui/SiIconButton.vue'
import SiIcon from '~/components/ui/SiIcon.vue'
import SiChip from '~/components/ui/SiChip.vue'
import SiCard from '~/components/ui/SiCard.vue'
import SiAlert from '~/components/ui/SiAlert.vue'
import SiDivider from '~/components/ui/SiDivider.vue'
import SiBadge from '~/components/ui/SiBadge.vue'
import SiAvatar from '~/components/ui/SiAvatar.vue'
import SiList from '~/components/ui/SiList.vue'
import SiListItem from '~/components/ui/SiListItem.vue'
import SiDataTable from '~/components/ui/SiDataTable.vue'
import SiTextField from '~/components/ui/SiTextField.vue'
import SiTextarea from '~/components/ui/SiTextarea.vue'
import SiSelect from '~/components/ui/SiSelect.vue'
import SiCheckbox from '~/components/ui/SiCheckbox.vue'
import SiSwitch from '~/components/ui/SiSwitch.vue'
import SiRadioGroup from '~/components/ui/SiRadioGroup.vue'
import SiRadio from '~/components/ui/SiRadio.vue'
import SiProgressCircular from '~/components/ui/SiProgressCircular.vue'
import SiProgressLinear from '~/components/ui/SiProgressLinear.vue'
import SiTooltip from '~/components/ui/SiTooltip.vue'
import SiMenu from '~/components/ui/SiMenu.vue'
import SiDialog from '~/components/ui/SiDialog.vue'
import SiForm from '~/components/ui/SiForm.vue'
import SiDocField from '~/components/ui/SiDocField.vue'
import SiCurrencyField from '~/components/ui/SiCurrencyField.vue'
import SiDateField from '~/components/ui/SiDateField.vue'
import SiTabs from '~/components/ui/SiTabs.vue'
import SiTab from '~/components/ui/SiTab.vue'
import SiExpansionPanels from '~/components/ui/SiExpansionPanels.vue'
import SiExpansionPanel from '~/components/ui/SiExpansionPanel.vue'

// Vitrine viva em teste (ADR-013 §7): todo wrapper monta sem erro.
const standalone: Array<[string, unknown, Record<string, unknown>]> = [
  ['SiButton', SiButton, {}],
  ['SiIconButton', SiIconButton, { icon: 'eye', 'aria-label': 'ver' }],
  ['SiIcon', SiIcon, { icon: mdiMenu }],
  ['SiChip', SiChip, {}],
  ['SiCard', SiCard, {}],
  ['SiAlert', SiAlert, { type: 'success', text: 'ok' }],
  ['SiDivider', SiDivider, {}],
  ['SiBadge', SiBadge, { content: 1 }],
  ['SiAvatar', SiAvatar, {}],
  ['SiList', SiList, {}],
  ['SiListItem', SiListItem, { title: 'item' }],
  ['SiDataTable', SiDataTable, { headers: [{ title: 'A', key: 'a' }], items: [{ a: 1 }] }],
  ['SiTextField', SiTextField, { label: 'x' }],
  ['SiTextarea', SiTextarea, { label: 'x' }],
  ['SiSelect', SiSelect, { items: ['a', 'b'] }],
  ['SiCheckbox', SiCheckbox, { label: 'x' }],
  ['SiSwitch', SiSwitch, { label: 'x' }],
  ['SiRadioGroup', SiRadioGroup, {}],
  ['SiProgressCircular', SiProgressCircular, {}],
  ['SiProgressLinear', SiProgressLinear, {}],
  ['SiTooltip', SiTooltip, { text: 'dica' }],
  ['SiMenu', SiMenu, {}],
  ['SiDialog', SiDialog, {}],
  ['SiForm', SiForm, {}],
  ['SiDocField', SiDocField, { label: 'doc' }],
  ['SiCurrencyField', SiCurrencyField, { label: 'valor' }],
  ['SiDateField', SiDateField, { label: 'data' }],
]

describe('smoke — todos os wrappers montam', () => {
  it.each(standalone)('%s monta', async (_name, comp, props) => {
    // Monta sem erro. Overlays (menu/dialog) fechados renderizam via teleport
    // (DOM vazio no wrapper), então checamos a instância, não o HTML visível.
    const w = await mountSuspended(comp as never, { props })
    expect(w.vm).toBeTruthy()
  })

  it('SiRadioGroup + SiRadio compõem', async () => {
    const w = await mountSuspended(SiRadioGroup, {
      slots: { default: () => h(SiRadio, { label: 'A', value: 'a' }) },
    })
    expect(w.find('.v-radio').exists()).toBe(true)
  })

  it('SiTabs + SiTab compõem', async () => {
    const w = await mountSuspended(SiTabs, {
      slots: { default: () => h(SiTab, { value: 'a', text: 'A' }) },
    })
    expect(w.find('.v-tab').exists()).toBe(true)
  })

  it('SiExpansionPanels + SiExpansionPanel compõem', async () => {
    const w = await mountSuspended(SiExpansionPanels, {
      slots: { default: () => h(SiExpansionPanel, { title: 'T' }) },
    })
    expect(w.find('.v-expansion-panel').exists()).toBe(true)
  })

  it('SiAppBar + SiNavigationDrawer montam dentro de um layout', async () => {
    const w = await mountSuspended({
      render: () => h(VLayout, () => [h(SiAppBar), h(SiNavigationDrawer, { modelValue: true })]),
    })
    expect(w.find('.v-app-bar').exists()).toBe(true)
    expect(w.find('.v-navigation-drawer').exists()).toBe(true)
  })
})
