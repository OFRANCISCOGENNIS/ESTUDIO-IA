// Testes do exportador SVG (função pura).

import { describe, it, expect } from 'vitest'
import { paginaParaSvg } from './svg'
import { criarForma, criarImagem, criarTexto } from '../elementos'
import { Pagina } from '../../tipos/projeto'

function paginaDe(): Pagina {
  const retangulo = criarForma('retangulo', 10, 10, {
    largura: 100,
    altura: 50,
    gradiente: {
      tipo: 'linear',
      angulo: 90,
      paradas: [
        { deslocamento: 0, cor: '#7c4dff' },
        { deslocamento: 1, cor: '#ec4899' },
      ],
    },
  })
  const texto = criarTexto(20, 80, { texto: 'Linha 1\nLinha 2', alinhamento: 'center' })
  const imagem = criarImagem('data:image/png;base64,AAAA', 0, 0, 120, 120, { mascara: 'circulo' })
  return {
    id: 'p1',
    nome: 'Página 1',
    corFundo: '#101820',
    elementos: [retangulo, texto, imagem],
    notas: '',
    transicao: 'fade',
  }
}

describe('paginaParaSvg', () => {
  it('gera um documento SVG com o tamanho e o fundo corretos', () => {
    const svg = paginaParaSvg(paginaDe(), 1080, 1080)
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('width="1080"')
    expect(svg).toContain('fill="#101820"') // retângulo de fundo
    expect(svg.endsWith('</svg>')).toBe(true)
  })

  it('inclui formas, gradiente, texto multilinha e imagem com máscara', () => {
    const svg = paginaParaSvg(paginaDe(), 1080, 1080)
    expect(svg).toContain('<rect')
    expect(svg).toContain('linearGradient')
    expect(svg).toContain('url(#g0)')
    expect(svg).toContain('<text')
    expect((svg.match(/<tspan/g) ?? []).length).toBe(2) // duas linhas
    expect(svg).toContain('<image')
    expect(svg).toContain('clipPath')
  })

  it('escapa caracteres especiais no texto', () => {
    const pagina = paginaDe()
    pagina.elementos[1] = criarTexto(0, 0, { texto: 'A & B < C' })
    const svg = paginaParaSvg(pagina, 100, 100)
    expect(svg).toContain('A &amp; B &lt; C')
  })
})

describe('paginaParaSvg — enquadramento de imagem', () => {
  const pagina = (imagem: ReturnType<typeof criarImagem>): Pagina => ({
    id: 'p1',
    nome: 'Página 1',
    corFundo: '#ffffff',
    elementos: [imagem],
    notas: '',
    transicao: 'fade',
    comentarios: [],
  })

  it('esticar continua com preserveAspectRatio none', () => {
    const img = criarImagem('data:image/png;base64,AAAA', 0, 0, 200, 200, {
      enquadramento: 'esticar',
    })

    const svg = paginaParaSvg(pagina(img), 400, 400)
    expect(svg).toContain('preserveAspectRatio="none"')
    expect(svg).not.toContain('<g clip-path')
  })

  it('preenchendo, desenha a foto ampliada e confinada no quadro', () => {
    // Foto 2:1 num quadro 1:1 → a foto inteira precisa do dobro da
    // largura do quadro, deslocada metade para a esquerda.
    const img = criarImagem('data:image/png;base64,AAAA', 0, 0, 200, 200, {
      enquadramento: 'preencher',
      proporcaoFonte: 2,
      foco: { x: 0.5, y: 0.5 },
      zoom: 1,
    })

    const svg = paginaParaSvg(pagina(img), 400, 400)

    expect(svg).toContain('<clipPath')
    expect(svg).toContain('width="400"') // 200 / 0.5
    expect(svg).toContain('x="-100"') // -(0.25/0.5) * 200
  })

  it('não recorta quando a foto já tem a proporção do quadro', () => {
    const img = criarImagem('data:image/png;base64,AAAA', 0, 0, 200, 200, {
      enquadramento: 'preencher',
      proporcaoFonte: 1,
    })

    // Sem sobra não há o que cortar: volta ao caminho simples
    expect(paginaParaSvg(pagina(img), 400, 400)).toContain('preserveAspectRatio="none"')
  })

  it('sem proporção conhecida, não inventa recorte', () => {
    const img = criarImagem('data:image/png;base64,AAAA', 0, 0, 200, 100, {
      enquadramento: 'preencher',
      proporcaoFonte: 0,
    })

    expect(paginaParaSvg(pagina(img), 400, 400)).toContain('preserveAspectRatio="none"')
  })
})
