// =============================================================
// Testes da serialização/desserialização de projetos.
// Ambiente node — sem DOM. Cobre round-trip, padrões, migração
// de versão (v1→v2), descarte de tipos desconhecidos e validação de id.
// =============================================================

import { describe, it, expect } from 'vitest'
import { serializarProjeto, desserializarProjeto } from './serializacao'
import { AJUSTES_NEUTROS, ANIMACAO_PADRAO, Projeto, VERSAO_ESQUEMA_ATUAL } from '../tipos/projeto'

const anim = () => ({ ...ANIMACAO_PADRAO })

describe('serializacao', () => {
  it('(a) round-trip preserva os campos essenciais de todos os tipos de elemento', () => {
    const projeto: Projeto = {
      versaoEsquema: VERSAO_ESQUEMA_ATUAL,
      id: 'proj-round-trip',
      nome: 'Projeto de Teste',
      larguraCanvas: 1200,
      alturaCanvas: 800,
      paginas: [
        {
          id: 'pagina-1',
          nome: 'Página 1',
          corFundo: '#101820',
          notas: '',
          transicao: 'fade',
          comentarios: [],
          elementos: [
            {
              id: 'txt-1',
              tipo: 'texto',
              nome: 'Título',
              x: 10,
              y: 20,
              rotacao: 0,
              opacidade: 0.9,
              visivel: true,
              bloqueado: false,
              mistura: 'normal',
              animacao: anim(),
              texto: 'Olá',
              fonte: 'Inter',
              tamanhoFonte: 48,
              negrito: true,
              italico: false,
              sublinhado: false,
              cor: '#ffffff',
              alinhamento: 'center',
              largura: 400,
              alturaLinha: 1.4,
              espacamentoLetras: 2,
            },
            {
              id: 'ret-1',
              tipo: 'retangulo',
              nome: 'Fundo',
              x: 0,
              y: 0,
              rotacao: 15,
              opacidade: 1,
              visivel: true,
              bloqueado: false,
              mistura: 'multiply',
              animacao: anim(),
              largura: 300,
              altura: 150,
              preenchimento: '#7c4dff',
              gradiente: {
                tipo: 'linear',
                angulo: 90,
                paradas: [
                  { deslocamento: 0, cor: '#7c4dff' },
                  { deslocamento: 1, cor: '#ec4899' },
                ],
              },
              corBorda: '#000000',
              espessuraBorda: 2,
              raioCanto: 12,
              pontas: 5,
            },
            {
              id: 'img-1',
              tipo: 'imagem',
              nome: 'Foto',
              x: 50,
              y: 60,
              rotacao: 0,
              opacidade: 0.75,
              visivel: false,
              bloqueado: true,
              mistura: 'screen',
              animacao: anim(),
              url: 'https://exemplo/img.png',
              largura: 200,
              altura: 120,
              raioCanto: 8,
              ajustes: { ...AJUSTES_NEUTROS, brilho: 20, contraste: -10, saturacao: 30 },
              filtro: 'clarendon',
              intensidadeFiltro: 0.8,
              mascara: 'circulo',
            },
            {
              id: 'lin-1',
              tipo: 'linha',
              nome: 'Divisor',
              x: 5,
              y: 5,
              rotacao: 0,
              opacidade: 1,
              visivel: true,
              bloqueado: false,
              mistura: 'normal',
              animacao: anim(),
              pontos: [0, 0, 200, 0],
              cor: '#ff0000',
              espessura: 3,
              tracejada: true,
            },
          ],
        },
      ],
      criadoEm: '2026-01-01T00:00:00.000Z',
      atualizadoEm: '2026-02-01T00:00:00.000Z',
    }

    const json = serializarProjeto(projeto)
    const restaurado = desserializarProjeto(json)

    expect(restaurado).toEqual(projeto)
    expect(restaurado.paginas[0].elementos.map((e) => e.tipo)).toEqual([
      'texto',
      'retangulo',
      'imagem',
      'linha',
    ])
  })

  it('(b) preenche padrões para campos ausentes', () => {
    const jsonParcial = JSON.stringify({
      versaoEsquema: 2,
      id: 'proj-parcial',
      larguraCanvas: 800,
      alturaCanvas: 600,
      paginas: [{ id: 'p1', elementos: [{ id: 'el-1', tipo: 'retangulo' }] }],
    })

    const projeto = desserializarProjeto(jsonParcial)
    const elemento = projeto.paginas[0].elementos[0]

    expect(projeto.nome).toBe('Design sem título')
    expect(projeto.paginas[0].corFundo).toBe('#ffffff')
    expect(elemento.opacidade).toBe(1)
    expect(elemento.visivel).toBe(true)
    expect(elemento.bloqueado).toBe(false)
    // Novo campo da Fase 2 recebe padrão neutro
    expect(elemento.mistura).toBe('normal')
  })

  it('(c) versaoEsquema maior que a atual lança erro', () => {
    const jsonFuturo = JSON.stringify({
      id: 'proj-futuro',
      versaoEsquema: VERSAO_ESQUEMA_ATUAL + 1,
      paginas: [],
    })

    expect(() => desserializarProjeto(jsonFuturo)).toThrow()
  })

  it('(d) descarta elemento de tipo desconhecido', () => {
    const json = JSON.stringify({
      versaoEsquema: 2,
      id: 'proj-misto',
      paginas: [
        {
          id: 'p1',
          elementos: [
            { id: 'valido', tipo: 'retangulo' },
            { id: 'invalido', tipo: 'holograma' },
          ],
        },
      ],
    })

    const projeto = desserializarProjeto(json)

    expect(projeto.paginas[0].elementos).toHaveLength(1)
    expect(projeto.paginas[0].elementos[0].tipo).toBe('retangulo')
    expect(projeto.paginas[0].elementos[0].id).toBe('valido')
  })

  it('(e) JSON sem id lança erro', () => {
    const jsonSemId = JSON.stringify({ nome: 'Sem identificador', paginas: [] })

    expect(() => desserializarProjeto(jsonSemId)).toThrow()
  })

  it('(f) migra projeto v1 (página única) para o esquema com páginas', () => {
    // Formato antigo: elementos e corFundo no topo, sem paginas
    const jsonV1 = JSON.stringify({
      versaoEsquema: 1,
      id: 'proj-antigo',
      nome: 'Legado',
      larguraCanvas: 1080,
      alturaCanvas: 1080,
      corFundo: '#222222',
      elementos: [{ id: 'r1', tipo: 'retangulo' }],
    })

    const projeto = desserializarProjeto(jsonV1)

    expect(projeto.versaoEsquema).toBe(VERSAO_ESQUEMA_ATUAL)
    expect(projeto.paginas).toHaveLength(1)
    expect(projeto.paginas[0].corFundo).toBe('#222222')
    expect(projeto.paginas[0].elementos).toHaveLength(1)
    expect(projeto.paginas[0].elementos[0].id).toBe('r1')
    // Campos novos preenchidos na migração
    expect(projeto.paginas[0].elementos[0].mistura).toBe('normal')
  })
})
