// =============================================================
// Testes da serialização/desserialização de projetos.
// Ambiente node — sem DOM. Cobre round-trip, padrões, migração
// de versão, descarte de tipos desconhecidos e validação de id.
// =============================================================

import { describe, it, expect } from 'vitest'
import { serializarProjeto, desserializarProjeto } from './serializacao'
import { Projeto, VERSAO_ESQUEMA_ATUAL } from '../tipos/projeto'

describe('serializacao', () => {
  it('(a) round-trip preserva os campos essenciais de todos os tipos de elemento', () => {
    const projeto: Projeto = {
      versaoEsquema: VERSAO_ESQUEMA_ATUAL,
      id: 'proj-round-trip',
      nome: 'Projeto de Teste',
      larguraCanvas: 1200,
      alturaCanvas: 800,
      corFundo: '#101820',
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
          largura: 300,
          altura: 150,
          preenchimento: '#7c4dff',
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
          url: 'https://exemplo/img.png',
          largura: 200,
          altura: 120,
          raioCanto: 8,
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
          pontos: [0, 0, 200, 0],
          cor: '#ff0000',
          espessura: 3,
          tracejada: true,
        },
      ],
      criadoEm: '2026-01-01T00:00:00.000Z',
      atualizadoEm: '2026-02-01T00:00:00.000Z',
    }

    const json = serializarProjeto(projeto)
    const restaurado = desserializarProjeto(json)

    // O projeto inteiro volta idêntico nos campos essenciais.
    expect(restaurado).toEqual(projeto)
    // Confirma que os quatro tipos sobreviveram ao ciclo.
    expect(restaurado.elementos.map((e) => e.tipo)).toEqual([
      'texto',
      'retangulo',
      'imagem',
      'linha',
    ])
  })

  it('(b) preenche padrões para campos ausentes', () => {
    const jsonParcial = JSON.stringify({
      id: 'proj-parcial',
      larguraCanvas: 800,
      alturaCanvas: 600,
      elementos: [{ id: 'el-1', tipo: 'retangulo' }],
    })

    const projeto = desserializarProjeto(jsonParcial)

    // Projeto sem 'nome' recebe o título padrão.
    expect(projeto.nome).toBe('Design sem título')
    // Padrões de projeto.
    expect(projeto.corFundo).toBe('#ffffff')
    // Elemento sem 'opacidade' vira 1.
    expect(projeto.elementos[0].opacidade).toBe(1)
    // Elemento visível por padrão e desbloqueado.
    expect(projeto.elementos[0].visivel).toBe(true)
    expect(projeto.elementos[0].bloqueado).toBe(false)
  })

  it('(c) versaoEsquema maior que a atual lança erro', () => {
    const jsonFuturo = JSON.stringify({
      id: 'proj-futuro',
      versaoEsquema: VERSAO_ESQUEMA_ATUAL + 1,
      elementos: [],
    })

    expect(() => desserializarProjeto(jsonFuturo)).toThrow()
  })

  it('(d) descarta elemento de tipo desconhecido', () => {
    const json = JSON.stringify({
      id: 'proj-misto',
      elementos: [
        { id: 'valido', tipo: 'retangulo' },
        { id: 'invalido', tipo: 'holograma' },
      ],
    })

    const projeto = desserializarProjeto(json)

    expect(projeto.elementos).toHaveLength(1)
    expect(projeto.elementos[0].tipo).toBe('retangulo')
    expect(projeto.elementos[0].id).toBe('valido')
  })

  it('(e) JSON sem id lança erro', () => {
    const jsonSemId = JSON.stringify({ nome: 'Sem identificador', elementos: [] })

    expect(() => desserializarProjeto(jsonSemId)).toThrow()
  })
})
