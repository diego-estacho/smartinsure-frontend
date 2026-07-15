import { describe, it, expect } from 'vitest'
import { baseColors, brandColors, semanticColors, lightTheme } from '../../app/assets/styles/tokens/tokens'

// ADR-006 + ADR-013: os design tokens são a fonte única visual. Este teste trava a
// paleta base e a separação marca/semântica que sustenta o whitelabel.
describe('design tokens (ADR-006, ADR-013)', () => {
  it('expõe a paleta base completa em hex para o tema Vuetify', () => {
    const required = [
      'primary', 'secondary', 'surface', 'background',
      'info', 'success', 'warning', 'error',
    ] as const
    for (const name of required) {
      expect(baseColors[name], `cor '${name}'`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('monta o tema claro a partir das cores base', () => {
    expect(lightTheme.dark).toBe(false)
    expect(lightTheme.colors.primary).toBe(baseColors.primary)
  })

  it('mantém success como literal próprio, não como referência a primary (ADR-013 §3)', () => {
    // Mesmo coincidindo no valor hoje, são tokens independentes: trocar a cor de marca
    // (whitelabel) não pode recolorir um estado semântico de sucesso.
    expect(semanticColors.success).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect('success' in brandColors).toBe(false)
    expect('primary' in semanticColors).toBe(false)
  })
})
