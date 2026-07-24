// Testes do gerador de PDF (função pura).

import { describe, it, expect } from 'vitest'
import { criarPdf } from './pdf'

const jpegFalso = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9])

describe('criarPdf', () => {
  it('gera um PDF válido na estrutura básica', () => {
    const pdf = criarPdf([{ jpeg: jpegFalso, largura: 100, altura: 200 }])
    const texto = new TextDecoder('latin1').decode(pdf)
    expect(texto.startsWith('%PDF-1.4')).toBe(true)
    expect(texto).toContain('/Type /Catalog')
    expect(texto).toContain('/Filter /DCTDecode')
    expect(texto).toContain('/MediaBox [0 0 100 200]')
    expect(texto.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('cria uma página por imagem', () => {
    const pdf = criarPdf([
      { jpeg: jpegFalso, largura: 100, altura: 100 },
      { jpeg: jpegFalso, largura: 100, altura: 100 },
      { jpeg: jpegFalso, largura: 100, altura: 100 },
    ])
    const texto = new TextDecoder('latin1').decode(pdf)
    expect(texto).toContain('/Count 3')
    expect((texto.match(/\/Type \/Page[^s]/g) ?? []).length).toBe(3)
  })
})
