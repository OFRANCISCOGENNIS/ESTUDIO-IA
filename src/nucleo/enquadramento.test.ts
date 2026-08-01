import { describe, expect, it } from 'vitest'
import {
  desenhoParaRecorte,
  RECORTE_CHEIO,
  recorteEhCheio,
  recorteRelativo,
} from './enquadramento'

const quadrado = { largura: 400, altura: 400 }

describe('recorteRelativo', () => {
  it('não corta nada quando a foto tem a proporção do quadro', () => {
    expect(recorteRelativo(1, quadrado)).toEqual(RECORTE_CHEIO)
  })

  it('corta as laterais de uma foto panorâmica num quadro quadrado', () => {
    // 2:1 num quadro 1:1 → usa metade da largura, altura inteira
    const r = recorteRelativo(2, quadrado)

    expect(r.largura).toBeCloseTo(0.5, 6)
    expect(r.altura).toBe(1)
    // Foco central: sobra 0.5, metade de cada lado
    expect(r.x).toBeCloseTo(0.25, 6)
    expect(r.y).toBe(0)
  })

  it('corta topo e base de uma foto vertical num quadro quadrado', () => {
    const r = recorteRelativo(0.5, quadrado)

    expect(r.largura).toBe(1)
    expect(r.altura).toBeCloseTo(0.5, 6)
    expect(r.y).toBeCloseTo(0.25, 6)
  })

  it('o foco escolhe onde a janela pousa', () => {
    const esquerda = recorteRelativo(2, quadrado, { x: 0, y: 0.5 })
    const direita = recorteRelativo(2, quadrado, { x: 1, y: 0.5 })

    expect(esquerda.x).toBe(0)
    expect(direita.x).toBeCloseTo(0.5, 6)
  })

  it('o zoom aperta a janela sem sair da foto', () => {
    const r = recorteRelativo(1, quadrado, { x: 0.5, y: 0.5 }, 2)

    expect(r.largura).toBeCloseTo(0.5, 6)
    expect(r.altura).toBeCloseTo(0.5, 6)
    expect(r.x).toBeCloseTo(0.25, 6)
  })

  it('não aceita zoom menor que 1 — afastar deixaria buraco no quadro', () => {
    expect(recorteRelativo(1, quadrado, { x: 0.5, y: 0.5 }, 0.2)).toEqual(RECORTE_CHEIO)
  })

  it('a janela nunca sai da foto, nem com foco fora da faixa', () => {
    const r = recorteRelativo(2, quadrado, { x: 5, y: -3 })

    expect(r.x + r.largura).toBeLessThanOrEqual(1)
    expect(r.y).toBeGreaterThanOrEqual(0)
  })

  it('devolve a foto inteira quando a proporção da fonte é desconhecida', () => {
    // Projetos antigos não guardam a proporção; sem ela, esticar é o
    // único comportamento que não inventa recorte.
    expect(recorteRelativo(0, quadrado)).toEqual(RECORTE_CHEIO)
    expect(recorteRelativo(NaN, quadrado)).toEqual(RECORTE_CHEIO)
  })

  it('sobrevive a quadro degenerado', () => {
    expect(recorteRelativo(2, { largura: 0, altura: 100 })).toEqual(RECORTE_CHEIO)
  })
})

describe('recorteEhCheio', () => {
  it('reconhece a foto inteira', () => {
    expect(recorteEhCheio(RECORTE_CHEIO)).toBe(true)
    expect(recorteEhCheio(recorteRelativo(2, quadrado))).toBe(false)
  })
})

describe('desenhoParaRecorte', () => {
  it('amplia e desloca a foto para a janela cair sobre o quadro', () => {
    // Metade da largura da foto ocupa os 400px do quadro: a foto
    // inteira precisa de 800, deslocada 200 para a esquerda.
    const d = desenhoParaRecorte(recorteRelativo(2, quadrado), quadrado)

    expect(d.largura).toBeCloseTo(800, 6)
    expect(d.altura).toBeCloseTo(400, 6)
    expect(d.x).toBeCloseTo(-200, 6)
    expect(d.y).toBeCloseTo(0, 6)
  })

  it('sem recorte, desenha a foto no tamanho do quadro', () => {
    expect(desenhoParaRecorte(RECORTE_CHEIO, quadrado)).toEqual({
      x: -0,
      y: -0,
      largura: 400,
      altura: 400,
    })
  })

  it('foco na borda direita encosta a foto pela direita', () => {
    const r = recorteRelativo(2, quadrado, { x: 1, y: 0.5 })
    const d = desenhoParaRecorte(r, quadrado)

    // A foto ampliada mede 800; para ver o fim dela, desloca -400
    expect(d.x).toBeCloseTo(-400, 6)
    expect(d.x + d.largura).toBeCloseTo(400, 6)
  })
})
