// Testes do adaptador Claude com um cliente de mentira: nenhuma rede,
// nenhuma chave. O que interessa aqui é o que o adaptador faz com a
// resposta — sanear o que veio e não deixar o editor na mão quando a
// chamada falha.

import { describe, expect, it, vi } from 'vitest'
import {
  ClienteClaude,
  corValida,
  criarAdaptadorClaude,
  fonteValida,
  fracao,
  materializar,
  PedidoClaude,
} from './adaptadorClaude'
import { AdaptadorIA } from './tipos'

/** Cliente que devolve sempre a mesma coisa e registra os pedidos */
function clienteFixo(resposta: unknown) {
  const pedidos: PedidoClaude[] = []
  const cliente: ClienteClaude = {
    gerar: async (p) => {
      pedidos.push(p)
      return resposta
    },
  }
  return { cliente, pedidos }
}

const clienteQuebrado = (erro = new Error('sem rede')): ClienteClaude => ({
  gerar: async () => {
    throw erro
  },
})

/** Base de reserva reconhecível nos testes */
const baseFalsa: AdaptadorIA = {
  id: 'base',
  nome: 'Base',
  gerarTextos: async () => ['texto da base'],
  gerarDesign: async () => [
    {
      id: 'base-0',
      nome: 'Design da base',
      corFundo: '#000000',
      coresPreview: ['#000000', '#111111', '#222222'],
      gerarElementos: () => [],
    },
  ],
  sugerirEstilo: async () => ({
    parFonte: { nome: 'Base', titulo: 'Inter', corpo: 'Inter' },
    paleta: ['#000000'],
  }),
  removerFundo: async () => 'data:image/png;base64,base',
  extrairPaleta: async () => ['#abcdef'],
}

describe('saneamento', () => {
  it('aceita hex de 3, 6 e 8 dígitos e recusa o resto', () => {
    expect(corValida('#fff', '#000')).toBe('#fff')
    expect(corValida('#7C4DFF', '#000')).toBe('#7C4DFF')
    expect(corValida('#7c4dff80', '#000')).toBe('#7c4dff80')
    expect(corValida('rgb(1,2,3)', '#000')).toBe('#000')
    expect(corValida('vermelho', '#000')).toBe('#000')
    expect(corValida(42, '#000')).toBe('#000')
  })

  it('prende frações entre 0 e 1', () => {
    expect(fracao(0.5, 0)).toBe(0.5)
    expect(fracao(-3, 0)).toBe(0)
    expect(fracao(9, 0)).toBe(1)
    expect(fracao(NaN, 0.25)).toBe(0.25)
    expect(fracao('meio', 0.25)).toBe(0.25)
  })

  it('só deixa passar fonte que o app embute', () => {
    expect(fonteValida('Bebas Neue')).toBe('Bebas Neue')
    expect(fonteValida('Comic Sans MS')).toBe('Inter')
    expect(fonteValida(undefined)).toBe('Inter')
  })
})

describe('materializar', () => {
  it('converte frações para o tamanho do canvas', () => {
    const el = materializar(
      { tipo: 'retangulo', x: 0.1, y: 0.25, largura: 0.5, altura: 0.2, cor: '#ff0000' },
      1000,
      2000,
    )

    expect(el).toMatchObject({ tipo: 'retangulo', x: 100, y: 500, largura: 500, altura: 400 })
  })

  it('mede o texto pela ALTURA, para o mesmo layout servir a outro formato', () => {
    const quadrado = materializar(
      { tipo: 'texto', x: 0, y: 0, largura: 0.8, altura: 0.1, conteudo: 'Oi', tamanhoTexto: 0.1 },
      1080,
      1080,
    )
    const story = materializar(
      { tipo: 'texto', x: 0, y: 0, largura: 0.8, altura: 0.1, conteudo: 'Oi', tamanhoTexto: 0.1 },
      1080,
      1920,
    )

    expect(quadrado).toMatchObject({ tamanhoFonte: 108 })
    expect(story).toMatchObject({ tamanhoFonte: 192 })
  })

  it('descarta texto vazio em vez de criar uma camada fantasma', () => {
    expect(materializar({ tipo: 'texto', conteudo: '   ', tamanhoTexto: 0.1 }, 1080, 1080)).toBeNull()
  })

  it('descarta tipo desconhecido', () => {
    expect(materializar({ tipo: 'holograma' }, 1080, 1080)).toBeNull()
  })

  it('corrige cor inválida em vez de deixar entrar no documento', () => {
    const el = materializar({ tipo: 'retangulo', cor: 'azul-bebê' }, 1080, 1080)

    expect(el).toMatchObject({ preenchimento: '#7c4dff' })
  })
})

describe('criarAdaptadorClaude — geração de texto', () => {
  it('devolve as variações do modelo', async () => {
    const { cliente, pedidos } = clienteFixo({ opcoes: ['Um', 'Dois', 'Três'] })
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    expect(await ia.gerarTextos('titulo', 'café', 'ousado')).toEqual(['Um', 'Dois', 'Três'])
    // O tipo e o tom precisam chegar ao modelo, não só o assunto
    expect(pedidos[0].usuario).toContain('café')
    expect(pedidos[0].usuario).toContain('título')
    expect(pedidos[0].usuario).toContain('ousado')
  })

  it('cai para o motor local quando a chamada falha', async () => {
    const aoFalhar = vi.fn()
    const ia = criarAdaptadorClaude(clienteQuebrado(), { base: baseFalsa, aoFalhar })

    expect(await ia.gerarTextos('titulo', 'café', 'ousado')).toEqual(['texto da base'])
    expect(aoFalhar).toHaveBeenCalledOnce()
  })

  it('cai para o motor local quando a resposta vem vazia', async () => {
    const { cliente } = clienteFixo({ opcoes: [] })
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    expect(await ia.gerarTextos('cta', 'x', 'amigavel')).toEqual(['texto da base'])
  })
})

describe('criarAdaptadorClaude — design', () => {
  const respostaDesign = {
    opcoes: [
      {
        nome: 'Cartaz noturno',
        corFundo: '#101820',
        coresPreview: ['#101820', '#ffb703', '#ffffff'],
        elementos: [
          { tipo: 'retangulo', x: 0, y: 0.6, largura: 1, altura: 0.4, cor: '#ffb703' },
          {
            tipo: 'texto',
            x: 0.1,
            y: 0.2,
            largura: 0.8,
            altura: 0.2,
            conteudo: 'Noite de jazz',
            tamanhoTexto: 0.12,
            fonte: 'Playfair Display',
            negrito: true,
            cor: '#ffffff',
            alinhamento: 'center',
          },
        ],
      },
    ],
  }

  it('constrói os elementos só quando o formato é conhecido', async () => {
    const { cliente } = clienteFixo(respostaDesign)
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    const [opcao] = await ia.gerarDesign('festa de jazz')
    expect(opcao.nome).toBe('Cartaz noturno')
    expect(opcao.corFundo).toBe('#101820')

    const noQuadrado = opcao.gerarElementos(1080, 1080)
    const noStory = opcao.gerarElementos(1080, 1920)

    expect(noQuadrado).toHaveLength(2)
    expect(noQuadrado[0]).toMatchObject({ tipo: 'retangulo', y: 648, altura: 432 })
    expect(noStory[0]).toMatchObject({ tipo: 'retangulo', y: 1152, altura: 768 })
  })

  it('preserva a ordem, que é a ordem de empilhamento', async () => {
    const { cliente } = clienteFixo(respostaDesign)
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    const [opcao] = await ia.gerarDesign('festa')
    expect(opcao.gerarElementos(1080, 1080).map((e) => e.tipo)).toEqual(['retangulo', 'texto'])
  })

  it('descarta opção sem elementos em vez de criar um cartão vazio', async () => {
    const { cliente } = clienteFixo({
      opcoes: [{ nome: 'Vazia', corFundo: '#fff', coresPreview: [], elementos: [] }],
    })
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    expect((await ia.gerarDesign('x'))[0].nome).toBe('Design da base')
  })

  it('completa coresPreview faltantes', async () => {
    const { cliente } = clienteFixo({
      opcoes: [
        {
          nome: 'Parcial',
          corFundo: '#123456',
          coresPreview: ['#123456'],
          elementos: [{ tipo: 'retangulo', x: 0, y: 0, largura: 1, altura: 1, cor: '#fff' }],
        },
      ],
    })
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    const [opcao] = await ia.gerarDesign('x')
    expect(opcao.coresPreview).toHaveLength(3)
    expect(opcao.coresPreview[0]).toBe('#123456')
  })

  it('cai para o motor local quando a chamada falha', async () => {
    const ia = criarAdaptadorClaude(clienteQuebrado(), { base: baseFalsa })

    expect((await ia.gerarDesign('x'))[0].nome).toBe('Design da base')
  })
})

describe('criarAdaptadorClaude — estilo e pixels', () => {
  it('valida as fontes sugeridas contra as embutidas', async () => {
    const { cliente } = clienteFixo({
      parFonte: { nome: 'Editorial', titulo: 'Helvetica Neue', corpo: 'Roboto' },
      paleta: ['#112233', 'não é cor', '#445566'],
    })
    const ia = criarAdaptadorClaude(cliente, { base: baseFalsa })

    const estilo = await ia.sugerirEstilo('revista')
    expect(estilo.parFonte.titulo).toBe('Inter') // Helvetica não é embutida
    expect(estilo.parFonte.corpo).toBe('Roboto')
    expect(estilo.paleta).toEqual(['#112233', '#445566'])
  })

  it('não manda operação de pixel para a rede', async () => {
    const gerar = vi.fn()
    const ia = criarAdaptadorClaude({ gerar }, { base: baseFalsa })
    const imagem = {} as HTMLImageElement

    expect(await ia.removerFundo(imagem)).toBe('data:image/png;base64,base')
    expect(await ia.extrairPaleta(imagem, 5)).toEqual(['#abcdef'])
    expect(gerar).not.toHaveBeenCalled()
  })
})
