// Testes do escritor de ZIP (função pura).

import { describe, it, expect } from 'vitest'
import { criarZip, textoParaBytes } from './zip'

describe('criarZip', () => {
  it('gera um ZIP com assinaturas válidas', () => {
    const zip = criarZip([
      { nome: 'a.txt', dados: textoParaBytes('olá mundo') },
      { nome: 'pasta/b.xml', dados: textoParaBytes('<x/>') },
    ])
    // Assinatura de cabeçalho local (PK\x03\x04)
    expect([zip[0], zip[1], zip[2], zip[3]]).toEqual([0x50, 0x4b, 0x03, 0x04])
    // Assinatura de fim de diretório central (PK\x05\x06) nos últimos 22 bytes
    const eocd = zip.subarray(zip.length - 22)
    expect([eocd[0], eocd[1], eocd[2], eocd[3]]).toEqual([0x50, 0x4b, 0x05, 0x06])
    // Número de entradas = 2
    const view = new DataView(eocd.buffer, eocd.byteOffset)
    expect(view.getUint16(10, true)).toBe(2)
  })
})
