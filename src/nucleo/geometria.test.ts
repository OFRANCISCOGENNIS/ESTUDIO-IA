import { afterEach, describe, expect, it } from 'vitest'
import { caixaDe, deslocamentoPara, registrarMedidor } from './geometria'
import { ANIMACAO_PADRAO, Elemento } from '../tipos/projeto'

const base = (extras: Record<string, unknown> = {}) => ({
  id: 'e1',
  nome: 'Elemento',
  x: 0,
  y: 0,
  rotacao: 0,
  opacidade: 1,
  visivel: true,
  bloqueado: false,
  mistura: 'normal' as const,
  animacao: { ...ANIMACAO_PADRAO },
  ...extras,
})

const retangulo = (extras: Record<string, unknown> = {}): Elemento =>
  ({
    ...base(extras),
    tipo: 'retangulo',
    largura: 200,
    altura: 100,
    preenchimento: '#000',
    corBorda: '#0000',
    espessuraBorda: 0,
    raioCanto: 0,
    pontas: 5,
    ...extras,
  }) as Elemento

const texto = (extras: Record<string, unknown> = {}): Elemento =>
  ({
    ...base(extras),
    tipo: 'texto',
    texto: 'Uma linha',
    fonte: 'Inter',
    tamanhoFonte: 40,
    negrito: false,
    italico: false,
    sublinhado: false,
    cor: '#000',
    alinhamento: 'left',
    largura: 300,
    alturaLinha: 1.2,
    espacamentoLetras: 0,
    efeito: 'nenhum',
    textura: 'nenhuma',
    ...extras,
  }) as Elemento

const caminho = (pontos: number[], extras: Record<string, unknown> = {}): Elemento =>
  ({
    ...base(extras),
    tipo: 'caminho',
    pontos,
    fechado: false,
    tensao: 0,
    preenchimento: 'transparent',
    corBorda: '#000',
    espessuraBorda: 3,
    ...extras,
  }) as Elemento

afterEach(() => registrarMedidor(null))

describe('caixaDe — formas', () => {
  it('usa largura e altura declaradas', () => {
    expect(caixaDe(retangulo({ x: 10, y: 20 }))).toEqual({
      x: 10,
      y: 20,
      largura: 200,
      altura: 100,
    })
  })
})

describe('caixaDe — linha e caminho', () => {
  it('soma o deslocamento dos pontos à origem', () => {
    // O desenho começa 40px à direita e 10 abaixo da origem: a caixa
    // precisa acompanhar, senão alinhar encosta a origem na borda e
    // deixa o traço para dentro.
    const c = caixaDe(caminho([40, 10, 140, 60], { x: 100, y: 200 }))

    expect(c).toEqual({ x: 140, y: 210, largura: 100, altura: 50 })
  })

  it('lida com pontos fora de ordem', () => {
    const c = caixaDe(caminho([200, 80, 0, 0, 50, 120]))

    expect(c).toEqual({ x: 0, y: 0, largura: 200, altura: 120 })
  })

  it('não quebra com lista de pontos vazia', () => {
    expect(caixaDe(caminho([], { x: 5, y: 5 }))).toEqual({
      x: 5,
      y: 5,
      largura: 0,
      altura: 0,
    })
  })
})

describe('caixaDe — texto', () => {
  it('conta as quebras explícitas quando não há canvas', () => {
    const c = caixaDe(texto({ texto: 'Linha 1\nLinha 2\nLinha 3' }))

    // 3 linhas × 40px × 1.2 — antes media 48px, uma linha só
    expect(c.altura).toBe(144)
  })

  it('prefere a medição real do canvas, que enxerga a quebra automática', () => {
    registrarMedidor((id) => (id === 'e1' ? { largura: 300, altura: 240 } : null))

    expect(caixaDe(texto({ texto: 'texto longo que quebra sozinho' })).altura).toBe(240)
  })

  it('cai na contagem quando o medidor não conhece o elemento', () => {
    registrarMedidor(() => null)

    expect(caixaDe(texto()).altura).toBe(48)
  })
})

describe('caixaDe — rotação', () => {
  it('devolve a caixa alinhada aos eixos de um retângulo girado', () => {
    // 200×100 girado 90° ocupa 100×200
    const c = caixaDe(retangulo({ x: 0, y: 0, rotacao: 90 }))

    expect(c.largura).toBeCloseTo(100, 6)
    expect(c.altura).toBeCloseTo(200, 6)
    // Girando em torno da origem, o corpo vai para a esquerda
    expect(c.x).toBeCloseTo(-100, 6)
    expect(c.y).toBeCloseTo(0, 6)
  })

  it('45° aumenta os dois lados', () => {
    const c = caixaDe(retangulo({ largura: 100, altura: 100, rotacao: 45 }))

    expect(c.largura).toBeCloseTo(141.42, 1)
    expect(c.altura).toBeCloseTo(141.42, 1)
  })

  it('360° equivale a não girar', () => {
    expect(caixaDe(retangulo({ x: 7, y: 9, rotacao: 360 }))).toEqual(
      caixaDe(retangulo({ x: 7, y: 9 })),
    )
  })
})

describe('deslocamentoPara', () => {
  const caixa = { x: 100, y: 50, largura: 200, altura: 100 }

  it('encosta o início no alvo', () => {
    expect(deslocamentoPara(caixa, 'x', 'inicio', 0)).toBe(-100)
  })

  it('centra no alvo', () => {
    expect(deslocamentoPara(caixa, 'x', 'centro', 540)).toBe(340) // 540 - 200
  })

  it('encosta o fim no alvo', () => {
    expect(deslocamentoPara(caixa, 'y', 'fim', 1080)).toBe(930) // 1080 - 150
  })

  it('devolve zero quando já está no lugar', () => {
    expect(deslocamentoPara(caixa, 'x', 'inicio', 100)).toBe(0)
  })
})
