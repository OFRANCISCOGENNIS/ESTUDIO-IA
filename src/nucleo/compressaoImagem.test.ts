import { describe, expect, it, vi } from 'vitest'
import { comprimirAteCaber, FormatoImagem } from './compressaoImagem'

/**
 * Codificador falso: o tamanho cai com o quadrado da escala (como área
 * de imagem) e o JPEG sai bem menor que o PNG, imitando o comportamento
 * real do canvas.
 */
function codificadorFalso(bytesPngEmEscala1: number, razaoJpeg = 0.15) {
  return (escala: number, formato: FormatoImagem) => {
    const base = bytesPngEmEscala1 * escala * escala
    const bytes = Math.round(formato === 'jpeg' ? base * razaoJpeg : base)
    return `data:image/${formato};base64,${'x'.repeat(bytes)}`
  }
}

const TETO = 1000

describe('comprimirAteCaber', () => {
  it('mantém a escala cheia quando já cabe', () => {
    const r = comprimirAteCaber(codificadorFalso(500), true, TETO)

    expect(r.escala).toBe(1)
    expect(r.formato).toBe('png')
    expect(r.perdeuTransparencia).toBe(false)
  })

  it('reduz a escala até caber, preservando o PNG', () => {
    // 2000 em escala 1; escala 0.75 → 1125 (não cabe); 0.55 → 605 (cabe)
    const r = comprimirAteCaber(codificadorFalso(2000), true, TETO)

    expect(r.formato).toBe('png')
    expect(r.escala).toBe(0.55)
    expect(r.url.length).toBeLessThanOrEqual(TETO)
    expect(r.perdeuTransparencia).toBe(false)
  })

  it('abre mão da transparência quando nenhum PNG cabe', () => {
    // PNG nem na menor escala cabe; o JPEG cabe já na escala cheia
    const r = comprimirAteCaber(codificadorFalso(20_000), true, TETO)

    expect(r.formato).toBe('jpeg')
    expect(r.perdeuTransparencia).toBe(true)
    expect(r.url.length).toBeLessThanOrEqual(TETO)
  })

  it('usa só JPEG quando não há transparência a preservar', () => {
    const codificar = vi.fn(codificadorFalso(5000))
    const r = comprimirAteCaber(codificar, false, TETO)

    expect(r.formato).toBe('jpeg')
    expect(r.perdeuTransparencia).toBe(false)
    expect(codificar.mock.calls.every(([, f]) => f === 'jpeg')).toBe(true)
  })

  it('para de tentar assim que encontra uma versão que cabe', () => {
    const codificar = vi.fn(codificadorFalso(500))
    comprimirAteCaber(codificar, true, TETO)

    expect(codificar).toHaveBeenCalledTimes(1)
  })

  it('devolve a menor tentativa quando nada cabe, em vez de falhar', () => {
    // Enorme nos dois formatos: nenhuma combinação chega ao teto
    const r = comprimirAteCaber(codificadorFalso(10_000_000), true, TETO)

    expect(r.url.length).toBeGreaterThan(TETO)
    // A menor possível: JPEG na escala mais agressiva
    expect(r.formato).toBe('jpeg')
    expect(r.escala).toBe(0.4)
  })
})
