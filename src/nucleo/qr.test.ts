import { describe, expect, it } from 'vitest'
import { gerarQr, qrParaSvgDataUrl } from './qr'

describe('gerarQr', () => {
  it('texto curto gera versão 1 (21×21)', () => {
    const qr = gerarQr('HELLO')
    expect(qr.versao).toBe(1)
    expect(qr.tamanho).toBe(21)
    expect(qr.modulos).toHaveLength(21)
  })

  it('texto maior sobe de versão e mantém tamanho = v*4+17', () => {
    const qr = gerarQr('a'.repeat(30)) // não cabe na v1 (14) nem v2 (26)
    expect(qr.versao).toBe(3)
    expect(qr.tamanho).toBe(3 * 4 + 17)
  })

  it('estruturas fixas: localizadores, temporizadores e módulo escuro', () => {
    const { modulos, tamanho } = gerarQr('https://exemplo.com.br')
    // Cantos dos localizadores são escuros; separador é claro
    expect(modulos[0][0]).toBe(true)
    expect(modulos[3][3]).toBe(true)
    expect(modulos[7][7]).toBe(false)
    expect(modulos[0][tamanho - 1]).toBe(true)
    expect(modulos[tamanho - 1][0]).toBe(true)
    // Padrão temporal alterna na linha/coluna 6
    for (let i = 8; i < tamanho - 8; i++) {
      expect(modulos[6][i]).toBe(i % 2 === 0)
      expect(modulos[i][6]).toBe(i % 2 === 0)
    }
    // Módulo escuro obrigatório em (linha tamanho-8, coluna 8)
    expect(modulos[tamanho - 8][8]).toBe(true)
  })

  it('é determinístico e sensível ao conteúdo', () => {
    const a1 = gerarQr('designstudio')
    const a2 = gerarQr('designstudio')
    const b = gerarQr('designstudi0')
    expect(a1.modulos).toEqual(a2.modulos)
    expect(a1.modulos).not.toEqual(b.modulos)
  })

  it('rejeita texto vazio e texto além da versão 10', () => {
    expect(() => gerarQr('')).toThrow()
    expect(() => gerarQr('x'.repeat(300))).toThrow(/longo/i)
  })

  it('qrParaSvgDataUrl devolve um SVG data URL com a margem de sossego', () => {
    const url = qrParaSvgDataUrl('oi')
    expect(url.startsWith('data:image/svg+xml')).toBe(true)
    const svg = decodeURIComponent(url.split(',')[1])
    expect(svg).toContain('viewBox="0 0 29 29"') // 21 + 4+4 de margem
    expect(svg).toContain('<path')
  })
})
