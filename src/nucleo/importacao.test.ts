import { describe, expect, it } from 'vitest'
import { importarProjeto } from './importacao'
import { serializarProjeto } from './serializacao'
import { VERSAO_ESQUEMA_ATUAL, Projeto } from '../tipos/projeto'

const projeto = (extras: Partial<Projeto> = {}): Projeto => ({
  versaoEsquema: VERSAO_ESQUEMA_ATUAL,
  id: 'original',
  nome: 'Cartaz',
  larguraCanvas: 1080,
  alturaCanvas: 1080,
  paginas: [
    {
      id: 'pagina-1',
      nome: 'Página 1',
      corFundo: '#ffffff',
      elementos: [],
      notas: '',
      transicao: 'fade',
      comentarios: [],
    },
  ],
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
  ...extras,
})

const id = () => 'novo-id'

describe('importarProjeto', () => {
  it('faz o ciclo completo com o que o editor baixa', () => {
    const r = importarProjeto(serializarProjeto(projeto()), id)

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.projeto.nome).toBe('Cartaz')
    expect(r.projeto.paginas).toHaveLength(1)
  })

  it('dá um id novo, para não sobrescrever o original', () => {
    const r = importarProjeto(serializarProjeto(projeto()), id)

    expect(r.ok && r.projeto.id).toBe('novo-id')
  })

  it('migra um projeto de esquema antigo', () => {
    // v1: elementos no topo, sem páginas
    const antigo = JSON.stringify({
      versaoEsquema: 1,
      id: 'velho',
      nome: 'Antigo',
      larguraCanvas: 800,
      alturaCanvas: 600,
      corFundo: '#ff0000',
      elementos: [],
      criadoEm: '2026-01-01T00:00:00.000Z',
      atualizadoEm: '2026-01-01T00:00:00.000Z',
    })

    const r = importarProjeto(antigo, id)

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.projeto.paginas).toHaveLength(1)
    expect(r.projeto.paginas[0].corFundo).toBe('#ff0000')
    expect(r.projeto.versaoEsquema).toBe(VERSAO_ESQUEMA_ATUAL)
  })

  it('recusa JSON malformado sem lançar', () => {
    const r = importarProjeto('{ isto não é json', id)

    expect(r).toEqual({ ok: false, erro: 'Este arquivo não é um projeto do DesignStudio.' })
  })

  it('recusa um JSON válido que não é um projeto', () => {
    const r = importarProjeto('{"qualquer":"coisa"}', id)

    expect(r.ok).toBe(false)
  })

  it('recusa arquivo vazio', () => {
    expect(importarProjeto('   ', id)).toEqual({ ok: false, erro: 'O arquivo está vazio.' })
  })

  it('explica quando o projeto vem de uma versão futura', () => {
    const futuro = JSON.stringify({ ...projeto(), versaoEsquema: VERSAO_ESQUEMA_ATUAL + 1 })

    const r = importarProjeto(futuro, id)

    expect(r.ok).toBe(false)
    if (r.ok) return
    // A mensagem precisa dizer o que fazer, não só que falhou
    expect(r.erro).toContain('Atualize o aplicativo')
  })

  it('dá um nome ao projeto que veio sem nome', () => {
    const r = importarProjeto(serializarProjeto(projeto({ nome: '   ' })), id)

    expect(r.ok && r.projeto.nome).toBe('Projeto importado')
  })
})
