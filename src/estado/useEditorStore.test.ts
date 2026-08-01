// Testes do store do editor no caminho de persistência e edição em
// massa. Ambiente node: sem Konva montado, `exportarDataUrl` devolve
// null e o salvamento segue sem miniatura — exatamente o que queremos
// exercitar aqui.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ANIMACAO_PADRAO, Elemento, Projeto, VERSAO_ESQUEMA_ATUAL } from '../tipos/projeto'

/** localStorage de mentira, com contagem de gravações e bloqueio sob demanda */
function instalarLocalStorage() {
  const dados = new Map<string, string>()
  const contagem = new Map<string, number>()
  let bloqueado = false
  vi.stubGlobal('localStorage', {
    getItem: (chave: string) => dados.get(chave) ?? null,
    setItem: (chave: string, valor: string) => {
      if (bloqueado) {
        const erro = new Error('QuotaExceededError')
        erro.name = 'QuotaExceededError'
        throw erro
      }
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
      dados.set(chave, valor)
    },
    removeItem: (chave: string) => void dados.delete(chave),
    clear: () => dados.clear(),
  })
  return { dados, contagem, bloquear: () => void (bloqueado = true) }
}

const base = (id: string, nome: string) => ({
  id,
  nome,
  x: 0,
  y: 0,
  rotacao: 0,
  opacidade: 1,
  visivel: true,
  bloqueado: false,
  mistura: 'normal' as const,
  animacao: { ...ANIMACAO_PADRAO },
})

const elementos = (): Elemento[] => [
  {
    ...base('txt-1', 'Título'),
    tipo: 'texto',
    texto: 'Preço sob consulta',
    fonte: 'Inter',
    tamanhoFonte: 32,
    negrito: false,
    italico: false,
    sublinhado: false,
    cor: '#1f2937',
    alinhamento: 'left',
    largura: 300,
    alturaLinha: 1.2,
    espacamentoLetras: 0,
    efeito: 'nenhum',
    textura: 'nenhuma',
  },
  {
    ...base('ret-1', 'Fundo'),
    tipo: 'retangulo',
    largura: 100,
    altura: 100,
    preenchimento: '#7c4dff',
    corBorda: '#00000000',
    espessuraBorda: 0,
    raioCanto: 0,
    pontas: 5,
  },
]

const projetoDe = (id: string): Projeto => ({
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
      elementos: elementos(),
      notas: '',
      transicao: 'fade',
      comentarios: [],
    },
  ],
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
})

/** Retângulo de 100×100 numa posição x, para os testes de distribuição */
const meioRetangulo = (id: string, x: number): Elemento => ({
  ...base(id, id),
  x,
  tipo: 'retangulo',
  largura: 100,
  altura: 100,
  preenchimento: '#7c4dff',
  corBorda: '#00000000',
  espessuraBorda: 0,
  raioCanto: 0,
  pontas: 5,
})

/** Ambas as stores precisam vir do MESMO grafo de módulos recarregado */
async function carregarStores() {
  vi.resetModules()
  const { useEditorStore } = await import('./useEditorStore')
  const { useProjetosStore } = await import('./useProjetosStore')
  return { editor: useEditorStore, projetos: useProjetosStore }
}

const textoDe = (projeto: Projeto | null) => {
  const el = projeto?.paginas[0].elementos.find((e) => e.id === 'txt-1')
  return el && el.tipo === 'texto' ? el.texto : null
}

describe('useEditorStore — auto-save', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('descarrega o salvamento pendente antes de abrir outro projeto', async () => {
    // O bug: `persistir` lê o estado ATUAL. Um debounce agendado pelo
    // projeto A disparava depois da troca e gravava o projeto B; a
    // última edição de A sumia. Trocar pelo seletor do topo bastava.
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor, projetos } = await carregarStores()

    editor.getState().abrirProjeto(projetoDe('a'))
    editor.getState().renomearProjeto('Cartaz revisado')
    editor.getState().abrirProjeto(projetoDe('b'))
    vi.advanceTimersByTime(5000)

    expect(projetos.getState().carregarProjeto('a')?.nome).toBe('Cartaz revisado')
  })

  it('fechar o projeto grava o que estava pendente', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor, projetos } = await carregarStores()

    editor.getState().abrirProjeto(projetoDe('a'))
    editor.getState().renomearProjeto('Antes de sair')
    editor.getState().fecharProjeto()

    expect(projetos.getState().carregarProjeto('a')?.nome).toBe('Antes de sair')
  })

  it('não grava duas vezes quando os dois ritmos se sobrepõem', async () => {
    vi.useFakeTimers()
    const loja = instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    loja.contagem.clear()

    // Arrastar (ritmo rápido, 400 ms) e logo depois renomear (800 ms):
    // sem cancelamento, os dois temporizadores venciam e salvavam.
    editor.getState().atualizarElementos(['txt-1'], { x: 50 })
    editor.getState().renomearProjeto('Outro nome')
    vi.advanceTimersByTime(5000)

    expect(loja.contagem.get('dsp:projeto:a')).toBe(1)
  })

  it('marca erro quando o armazenamento recusa a gravação', async () => {
    vi.useFakeTimers()
    const loja = instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    loja.bloquear()

    editor.getState().renomearProjeto('Não vai caber')
    vi.advanceTimersByTime(5000)

    expect(editor.getState().estadoSalvamento).toBe('erro')
  })
})

describe('useEditorStore — agrupamento', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('mantém o vínculo de grupo depois de salvar e recarregar', async () => {
    // O grupo sobrevivia ao undo (que não normaliza) mas sumia no
    // recarregamento: `normalizarElemento` não copiava `grupoId`.
    instalarLocalStorage()
    const { editor, projetos } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))

    editor.getState().selecionar(['txt-1', 'ret-1'])
    editor.getState().agruparSelecionados()
    editor.getState().salvarAgora()

    const recarregado = projetos.getState().carregarProjeto('a')
    const grupos = recarregado?.paginas[0].elementos.map((e) => e.grupoId)
    expect(grupos?.[0]).toBeTruthy()
    expect(grupos?.[0]).toBe(grupos?.[1])
  })

  it('desagrupar também persiste', async () => {
    instalarLocalStorage()
    const { editor, projetos } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    editor.getState().selecionar(['txt-1', 'ret-1'])
    editor.getState().agruparSelecionados()

    editor.getState().desagruparSelecionados()
    editor.getState().salvarAgora()

    const recarregado = projetos.getState().carregarProjeto('a')
    expect(recarregado?.paginas[0].elementos.every((e) => e.grupoId === undefined)).toBe(true)
  })
})

describe('useEditorStore — substituirTexto', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('trata a troca como texto literal, mesmo contendo $', async () => {
    // `String.replace` lê `$&` como "o trecho encontrado". Trocar por
    // "R$&nbsp;99" produzia "R$consultanbsp;99".
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))

    const trocas = editor.getState().substituirTexto('consulta', 'R$&nbsp;99')

    expect(trocas).toBe(1)
    expect(textoDe(editor.getState().projeto)).toBe('Preço sob R$&nbsp;99')
  })

  it('conta as ocorrências e ignora maiúsculas', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))

    expect(editor.getState().substituirTexto('PREÇO', 'Valor')).toBe(1)
    expect(textoDe(editor.getState().projeto)).toBe('Valor sob consulta')
  })

  it('não mexe em nada quando não encontra', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))

    expect(editor.getState().substituirTexto('inexistente', 'x')).toBe(0)
    expect(textoDe(editor.getState().projeto)).toBe('Preço sob consulta')
  })
})

describe('useEditorStore — variações de formato', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('conta apenas as variações que realmente couberam', async () => {
    // Antes contava o laço, não a gravação: anunciava "2 variações
    // criadas" com o armazenamento cheio e nada salvo.
    const loja = instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    loja.bloquear()

    const resultado = editor.getState().gerarVariacoesFormato([
      { nome: 'Story', largura: 1080, altura: 1920 },
      { nome: 'Post', largura: 1080, altura: 1350 },
    ])

    expect(resultado).toEqual({ criados: 0, falharam: 2 })
  })

  it('grava as variações pedidas e ignora o formato atual', async () => {
    instalarLocalStorage()
    const { editor, projetos } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))

    const resultado = editor.getState().gerarVariacoesFormato([
      { nome: 'Story', largura: 1080, altura: 1920 },
      { nome: 'Igual', largura: 1080, altura: 1080 },
    ])

    expect(resultado).toEqual({ criados: 1, falharam: 0 })
    expect(projetos.getState().resumos.some((r) => r.nome.endsWith('· Story'))).toBe(true)
  })
})

describe('useEditorStore — alinhar e distribuir', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const posicao = (editor: Awaited<ReturnType<typeof carregarStores>>['editor'], id: string) => {
    const el = editor.getState().projeto?.paginas[0].elementos.find((e) => e.id === id)
    return { x: el?.x, y: el?.y }
  }

  it('alinha o texto pela caixa, contando as linhas que ele tem', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    const projeto = projetoDe('a')
    // 3 linhas × 32px × 1.2 = 115.2 de altura; centrar em 1080 dá y=482.4.
    // Medindo uma linha só (38.4), o resultado seria 520.8 — fora do centro.
    const texto = projeto.paginas[0].elementos[0]
    if (texto.tipo === 'texto') texto.texto = 'Uma\nDuas\nTrês'
    editor.getState().abrirProjeto(projeto)

    editor.getState().selecionar(['txt-1'])
    editor.getState().alinharSelecionados('centroV')

    expect(posicao(editor, 'txt-1').y).toBeCloseTo(482.4, 1)
  })

  it('encosta o fim da caixa na borda direita', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))

    editor.getState().selecionar(['ret-1'])
    editor.getState().alinharSelecionados('direita')

    // Retângulo de 100 num canvas de 1080
    expect(posicao(editor, 'ret-1').x).toBe(980)
  })

  it('distribui usando a caixa, não a origem', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    // Três retângulos de 100 em x = 0, 300 e 900
    editor.getState().atualizarElementos(['ret-1'], { x: 0, y: 0 })
    editor.getState().adicionarElemento({ ...meioRetangulo('ret-2', 300) })
    editor.getState().adicionarElemento({ ...meioRetangulo('ret-3', 900) })

    editor.getState().selecionar(['ret-1', 'ret-2', 'ret-3'])
    editor.getState().distribuirSelecionados('horizontal')

    // Vão total 900 - 100 = 800 menos o miolo (100) dividido em 2 = 350
    expect(posicao(editor, 'ret-2').x).toBeCloseTo(450, 6)
  })
})

describe('useEditorStore — duplicar grupo', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('as cópias formam um grupo novo, não entram no original', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    editor.getState().selecionar(['txt-1', 'ret-1'])
    editor.getState().agruparSelecionados()
    const grupoOriginal = editor.getState().projeto?.paginas[0].elementos[0].grupoId

    editor.getState().duplicarSelecionados()

    const els = editor.getState().projeto?.paginas[0].elementos ?? []
    expect(els).toHaveLength(4)
    const copias = els.slice(2)
    expect(copias[0].grupoId).toBeTruthy()
    expect(copias[0].grupoId).toBe(copias[1].grupoId)
    // O ponto do bug: antes as cópias herdavam o grupo do original
    expect(copias[0].grupoId).not.toBe(grupoOriginal)
  })

  it('copiar um elemento solto de um grupo desfaz o vínculo', async () => {
    vi.useFakeTimers()
    instalarLocalStorage()
    const { editor } = await carregarStores()
    editor.getState().abrirProjeto(projetoDe('a'))
    editor.getState().selecionar(['txt-1', 'ret-1'])
    editor.getState().agruparSelecionados()

    editor.getState().selecionar(['txt-1'])
    editor.getState().duplicarSelecionados()

    const els = editor.getState().projeto?.paginas[0].elementos ?? []
    expect(els[els.length - 1].grupoId).toBeUndefined()
  })
})
