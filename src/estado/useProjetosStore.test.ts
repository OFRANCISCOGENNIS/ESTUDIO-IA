// Testes do caminho de falha do localStorage. O bug original: quando a
// cota estourava, `salvarProjeto` engolia o erro e o índice — gravado
// logo depois, sem proteção — lançava uma exceção que subia pelo
// auto-save. O editor ficava preso em "salvando" e nada era persistido.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Projeto } from '../tipos/projeto'
import { VERSAO_ESQUEMA_ATUAL } from '../tipos/projeto'

/** localStorage de mentira, com cota controlável por teste */
function instalarLocalStorage(limiteBytes = Infinity) {
  const dados = new Map<string, string>()
  const armazenamento = {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => {
      const total =
        [...dados.entries()]
          .filter(([c]) => c !== chave)
          .reduce((t, [c, v]) => t + c.length + v.length, 0) +
        chave.length +
        valor.length
      if (total > limiteBytes) {
        const erro = new Error('QuotaExceededError')
        erro.name = 'QuotaExceededError'
        throw erro
      }
      dados.set(chave, valor)
    },
    removeItem: (chave: string) => void dados.delete(chave),
    clear: () => dados.clear(),
  }
  vi.stubGlobal('localStorage', armazenamento)
  return dados
}

const projetoDe = (id: string, recheio = ''): Projeto => ({
  versaoEsquema: VERSAO_ESQUEMA_ATUAL,
  id,
  nome: `Projeto ${id}`,
  larguraCanvas: 1080,
  alturaCanvas: 1080,
  paginas: [
    {
      id: 'pagina-1',
      nome: 'Página 1',
      corFundo: '#ffffff',
      elementos: [],
      notas: recheio,
      transicao: 'fade',
      comentarios: [],
    },
  ],
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
})

/** A store lê o índice no momento do import, então recarregamos por teste */
async function carregarStore() {
  vi.resetModules()
  return (await import('./useProjetosStore')).useProjetosStore
}

describe('useProjetosStore — persistência', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('devolve true quando o projeto cabe', async () => {
    instalarLocalStorage()
    const store = await carregarStore()

    expect(store.getState().salvarProjeto(projetoDe('a'))).toBe(true)
  })

  it('devolve false quando a cota estoura, em vez de lançar', async () => {
    instalarLocalStorage(200)
    const store = await carregarStore()

    const salvar = () => store.getState().salvarProjeto(projetoDe('a', 'x'.repeat(5000)))

    // O ponto do bug: isto lançava e derrubava o auto-save
    expect(salvar).not.toThrow()
    expect(salvar()).toBe(false)
  })

  it('não lança quando só o índice não cabe', async () => {
    // Espaço para o projeto, mas não para projeto + índice
    const projeto = projetoDe('a')
    const dados = instalarLocalStorage(JSON.stringify(projeto).length + 40)
    const store = await carregarStore()

    expect(() => store.getState().salvarProjeto(projeto)).not.toThrow()
    expect(store.getState().salvarProjeto(projeto)).toBe(false)
    // O projeto em si foi gravado, mesmo com o índice falhando
    expect(dados.has('dsp:projeto:a')).toBe(true)
  })

  it('cai para o salvamento sem miniatura antes de desistir', async () => {
    const comMiniatura = { ...projetoDe('a'), miniatura: `data:image/jpeg;base64,${'m'.repeat(3000)}` }
    // Cabe sem a miniatura, não cabe com ela
    const semMiniatura = JSON.stringify({ ...comMiniatura, miniatura: undefined })
    const dados = instalarLocalStorage(semMiniatura.length + 600)
    const store = await carregarStore()

    expect(store.getState().salvarProjeto(comMiniatura)).toBe(true)
    expect(dados.get('dsp:projeto:a')).not.toContain('mmmm')
  })

  it('mantém o resumo em memória mesmo quando nada foi gravado', async () => {
    instalarLocalStorage(50)
    const store = await carregarStore()

    store.getState().salvarProjeto(projetoDe('a'))

    // O dashboard continua mostrando o projeto da sessão atual
    expect(store.getState().resumos.map((r) => r.id)).toContain('a')
  })
})
