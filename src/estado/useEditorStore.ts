// =============================================================
// Store do editor — estado em tempo real do canvas.
// A partir do esquema 2 o projeto tem várias PÁGINAS; todas as
// mutações de elementos/fundo atuam na PÁGINA ATIVA. `aplicarAlteracao`
// registra o snapshot (undo/redo cobre inclusive páginas) e agenda o
// auto-save com debounce de 2 segundos.
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { Historico } from '../nucleo/historico'
import { clonarElemento } from '../nucleo/elementos'
import { exportarDataUrl } from '../nucleo/exportacao'
import { debounce } from '../utilitarios/tempo'
import { Elemento, Ferramenta, Pagina, Projeto } from '../tipos/projeto'
import { useProjetosStore } from './useProjetosStore'

export type EstadoSalvamento = 'salvo' | 'pendente' | 'salvando'

/** Parte do estado (por página) coberta pelo histórico de undo/redo */
interface SnapshotPagina {
  elementos: Elemento[]
  corFundo: string
}

interface EstadoEditor {
  projeto: Projeto | null
  paginaAtivaId: string
  selecionados: string[]
  ferramenta: Ferramenta
  zoom: number
  deslocamento: { x: number; y: number }
  estadoSalvamento: EstadoSalvamento
  textoEmEdicao: string | null
  podeDesfazer: boolean
  podeRefazer: boolean

  abrirProjeto: (projeto: Projeto) => void
  fecharProjeto: () => void
  renomearProjeto: (nome: string) => void

  definirFerramenta: (ferramenta: Ferramenta) => void
  definirZoom: (zoom: number, deslocamento?: { x: number; y: number }) => void
  definirDeslocamento: (deslocamento: { x: number; y: number }) => void
  definirTextoEmEdicao: (id: string | null) => void

  selecionar: (ids: string[]) => void
  alternarSelecao: (id: string) => void
  limparSelecao: () => void

  aplicarAlteracao: (
    mutador: (atual: SnapshotPagina) => SnapshotPagina,
    registrarHistorico?: boolean,
  ) => void
  adicionarElemento: (elemento: Elemento, selecionarNovo?: boolean) => void
  aplicarTemplate: (elementos: Elemento[], corFundo: string) => void
  atualizarElementos: (ids: string[], mudancas: Partial<Elemento>) => void
  removerSelecionados: () => void
  duplicarSelecionados: () => void
  copiarSelecionados: () => void
  colar: () => void
  moverSelecionados: (dx: number, dy: number) => void
  reordenarElemento: (id: string, novoIndice: number) => void
  moverCamada: (id: string, direcao: 'frente' | 'tras' | 'topo' | 'fundo') => void
  alinharSelecionados: (
    eixo: 'esquerda' | 'centroH' | 'direita' | 'topo' | 'centroV' | 'base',
  ) => void
  definirCorFundo: (cor: string) => void

  // ---- Páginas ----
  adicionarPagina: () => void
  duplicarPagina: (id: string) => void
  removerPagina: (id: string) => void
  selecionarPagina: (id: string) => void
  renomearPagina: (id: string, nome: string) => void

  desfazer: () => void
  refazer: () => void

  salvarAgora: () => void
}

// Histórico e área de transferência vivem fora do estado reativo
const historico = new Historico()
let areaTransferencia: Elemento[] = []

/** Snapshot do histórico: todas as páginas (cobre add/remover/reordenar) */
function snapshotDe(projeto: Projeto): string {
  return JSON.stringify(projeto.paginas)
}

/** Índice e objeto da página ativa (ou -1/null) */
function paginaAtiva(
  projeto: Projeto | null,
  paginaAtivaId: string,
): { indice: number; pagina: Pagina | null } {
  if (!projeto) return { indice: -1, pagina: null }
  const indice = projeto.paginas.findIndex((p) => p.id === paginaAtivaId)
  return { indice, pagina: indice >= 0 ? projeto.paginas[indice] : null }
}

/** Clona os elementos de uma página com novos ids (para duplicar página) */
function clonarElementosParaPagina(elementos: Elemento[]): Elemento[] {
  return elementos.map((el) => ({ ...structuredClone(el), id: nanoid(10) }))
}

/** Dimensões dos elementos para alinhamento */
function dimensoesDe(elemento: Elemento): { largura: number; altura: number } {
  if (elemento.tipo === 'linha') {
    const xs = elemento.pontos.filter((_, i) => i % 2 === 0)
    const ys = elemento.pontos.filter((_, i) => i % 2 === 1)
    return {
      largura: Math.max(...xs) - Math.min(...xs),
      altura: Math.max(...ys) - Math.min(...ys),
    }
  }
  if (elemento.tipo === 'texto') {
    return { largura: elemento.largura, altura: elemento.tamanhoFonte * elemento.alturaLinha }
  }
  return { largura: elemento.largura, altura: elemento.altura }
}

export const useEditorStore = create<EstadoEditor>((set, get) => {
  // ---- Auto-save com debounce de 2s e miniatura para o dashboard ----
  const persistir = () => {
    const { projeto } = get()
    if (!projeto) return
    set({ estadoSalvamento: 'salvando' })
    let miniatura = projeto.miniatura
    try {
      const escala = Math.min(1, 320 / projeto.larguraCanvas)
      miniatura = exportarDataUrl({ formato: 'jpg', escala }) ?? miniatura
    } catch {
      // Sem canvas montado (ex.: teste) — segue sem miniatura nova
    }
    const salvo: Projeto = {
      ...projeto,
      miniatura,
      atualizadoEm: new Date().toISOString(),
    }
    useProjetosStore.getState().salvarProjeto(salvo)
    set({ projeto: salvo, estadoSalvamento: 'salvo' })
  }
  const persistirComDebounce = debounce(persistir, 2000)
  const agendarSalvamento = () => {
    set({ estadoSalvamento: 'pendente' })
    persistirComDebounce()
  }

  const atualizarFlagsHistorico = () =>
    set({ podeDesfazer: historico.podeDesfazer(), podeRefazer: historico.podeRefazer() })

  /** Substitui a página ativa por uma versão transformada */
  const mutarPaginaAtiva = (
    transformar: (pagina: Pagina) => Pagina,
    registrarHistorico = true,
  ) => {
    const { projeto, paginaAtivaId } = get()
    if (!projeto) return
    const { indice, pagina } = paginaAtiva(projeto, paginaAtivaId)
    if (!pagina) return
    if (registrarHistorico) {
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
    }
    const paginas = [...projeto.paginas]
    paginas[indice] = transformar(pagina)
    set({ projeto: { ...projeto, paginas } })
    agendarSalvamento()
  }

  /** Elementos da página ativa (ou lista vazia) */
  const elementosAtivos = (): Elemento[] => {
    const { projeto, paginaAtivaId } = get()
    return paginaAtiva(projeto, paginaAtivaId).pagina?.elementos ?? []
  }

  return {
    projeto: null,
    paginaAtivaId: '',
    selecionados: [],
    ferramenta: 'selecao',
    zoom: 1,
    deslocamento: { x: 0, y: 0 },
    estadoSalvamento: 'salvo',
    textoEmEdicao: null,
    podeDesfazer: false,
    podeRefazer: false,

    abrirProjeto: (projeto) => {
      historico.limpar()
      set({
        projeto,
        paginaAtivaId: projeto.paginas[0]?.id ?? '',
        selecionados: [],
        ferramenta: 'selecao',
        zoom: 1,
        deslocamento: { x: 0, y: 0 },
        estadoSalvamento: 'salvo',
        textoEmEdicao: null,
        podeDesfazer: false,
        podeRefazer: false,
      })
    },

    fecharProjeto: () => {
      persistir()
      historico.limpar()
      set({ projeto: null, paginaAtivaId: '', selecionados: [], textoEmEdicao: null })
    },

    renomearProjeto: (nome) => {
      const { projeto } = get()
      if (!projeto) return
      set({ projeto: { ...projeto, nome: nome.trim() || 'Design sem título' } })
      agendarSalvamento()
    },

    definirFerramenta: (ferramenta) => set({ ferramenta }),
    definirZoom: (zoom, deslocamento) =>
      set({
        zoom: Math.min(5, Math.max(0.1, zoom)),
        ...(deslocamento ? { deslocamento } : {}),
      }),
    definirDeslocamento: (deslocamento) => set({ deslocamento }),
    definirTextoEmEdicao: (id) => set({ textoEmEdicao: id }),

    selecionar: (ids) => set({ selecionados: ids }),
    alternarSelecao: (id) => {
      const { selecionados } = get()
      set({
        selecionados: selecionados.includes(id)
          ? selecionados.filter((s) => s !== id)
          : [...selecionados, id],
      })
    },
    limparSelecao: () => set({ selecionados: [] }),

    aplicarAlteracao: (mutador, registrarHistorico = true) => {
      mutarPaginaAtiva((pagina) => {
        const resultado = mutador({ elementos: pagina.elementos, corFundo: pagina.corFundo })
        return { ...pagina, elementos: resultado.elementos, corFundo: resultado.corFundo }
      }, registrarHistorico)
    },

    adicionarElemento: (elemento, selecionarNovo = true) => {
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, elemento],
      }))
      if (selecionarNovo) set({ selecionados: [elemento.id], ferramenta: 'selecao' })
    },

    aplicarTemplate: (elementos, corFundo) => {
      get().aplicarAlteracao(() => ({ elementos, corFundo }))
      set({ selecionados: [] })
    },

    atualizarElementos: (ids, mudancas) => {
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((elemento) =>
          ids.includes(elemento.id) ? ({ ...elemento, ...mudancas } as Elemento) : elemento,
        ),
      }))
    },

    removerSelecionados: () => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.filter(
          (elemento) => !selecionados.includes(elemento.id) || elemento.bloqueado,
        ),
      }))
      set({ selecionados: [] })
    },

    duplicarSelecionados: () => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      const copias = elementosAtivos()
        .filter((elemento) => selecionados.includes(elemento.id))
        .map((elemento) => clonarElemento(elemento))
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, ...copias],
      }))
      set({ selecionados: copias.map((c) => c.id) })
    },

    copiarSelecionados: () => {
      const { selecionados } = get()
      areaTransferencia = elementosAtivos().filter((elemento) =>
        selecionados.includes(elemento.id),
      )
    },

    colar: () => {
      if (areaTransferencia.length === 0) return
      const copias = areaTransferencia.map((elemento) => clonarElemento(elemento))
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, ...copias],
      }))
      set({ selecionados: copias.map((c) => c.id) })
    },

    moverSelecionados: (dx, dy) => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((elemento) =>
          selecionados.includes(elemento.id) && !elemento.bloqueado
            ? { ...elemento, x: elemento.x + dx, y: elemento.y + dy }
            : elemento,
        ),
      }))
    },

    reordenarElemento: (id, novoIndice) => {
      get().aplicarAlteracao((atual) => {
        const indiceAtual = atual.elementos.findIndex((e) => e.id === id)
        if (indiceAtual < 0) return atual
        const elementos = [...atual.elementos]
        const [removido] = elementos.splice(indiceAtual, 1)
        elementos.splice(Math.max(0, Math.min(elementos.length, novoIndice)), 0, removido)
        return { ...atual, elementos }
      })
    },

    moverCamada: (id, direcao) => {
      const elementos = elementosAtivos()
      const indice = elementos.findIndex((e) => e.id === id)
      if (indice < 0) return
      const destino =
        direcao === 'topo'
          ? elementos.length - 1
          : direcao === 'fundo'
            ? 0
            : direcao === 'frente'
              ? Math.min(elementos.length - 1, indice + 1)
              : Math.max(0, indice - 1)
      if (destino === indice) return
      get().reordenarElemento(id, destino)
    },

    alinharSelecionados: (eixo) => {
      const { projeto, selecionados } = get()
      if (!projeto || selecionados.length === 0) return
      const { larguraCanvas, alturaCanvas } = projeto
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((elemento) => {
          if (!selecionados.includes(elemento.id) || elemento.bloqueado) return elemento
          const { largura, altura } = dimensoesDe(elemento)
          switch (eixo) {
            case 'esquerda':
              return { ...elemento, x: 0 }
            case 'centroH':
              return { ...elemento, x: (larguraCanvas - largura) / 2 }
            case 'direita':
              return { ...elemento, x: larguraCanvas - largura }
            case 'topo':
              return { ...elemento, y: 0 }
            case 'centroV':
              return { ...elemento, y: (alturaCanvas - altura) / 2 }
            case 'base':
              return { ...elemento, y: alturaCanvas - altura }
          }
        }),
      }))
    },

    definirCorFundo: (cor) => {
      get().aplicarAlteracao((atual) => ({ ...atual, corFundo: cor }))
    },

    // ---- Páginas ----
    adicionarPagina: () => {
      const { projeto } = get()
      if (!projeto) return
      const nova: Pagina = {
        id: nanoid(10),
        nome: `Página ${projeto.paginas.length + 1}`,
        corFundo: '#ffffff',
        elementos: [],
      }
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      set({
        projeto: { ...projeto, paginas: [...projeto.paginas, nova] },
        paginaAtivaId: nova.id,
        selecionados: [],
      })
      agendarSalvamento()
    },

    duplicarPagina: (id) => {
      const { projeto } = get()
      if (!projeto) return
      const indice = projeto.paginas.findIndex((p) => p.id === id)
      if (indice < 0) return
      const original = projeto.paginas[indice]
      const copia: Pagina = {
        id: nanoid(10),
        nome: `${original.nome} (cópia)`,
        corFundo: original.corFundo,
        elementos: clonarElementosParaPagina(original.elementos),
      }
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      const paginas = [...projeto.paginas]
      paginas.splice(indice + 1, 0, copia)
      set({ projeto: { ...projeto, paginas }, paginaAtivaId: copia.id, selecionados: [] })
      agendarSalvamento()
    },

    removerPagina: (id) => {
      const { projeto, paginaAtivaId } = get()
      if (!projeto || projeto.paginas.length <= 1) return
      const indice = projeto.paginas.findIndex((p) => p.id === id)
      if (indice < 0) return
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      const paginas = projeto.paginas.filter((p) => p.id !== id)
      const novoAtivo =
        paginaAtivaId === id
          ? paginas[Math.max(0, indice - 1)].id
          : paginaAtivaId
      set({ projeto: { ...projeto, paginas }, paginaAtivaId: novoAtivo, selecionados: [] })
      agendarSalvamento()
    },

    selecionarPagina: (id) => {
      const { projeto } = get()
      if (!projeto || !projeto.paginas.some((p) => p.id === id)) return
      set({ paginaAtivaId: id, selecionados: [], textoEmEdicao: null })
    },

    renomearPagina: (id, nome) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) =>
        p.id === id ? { ...p, nome: nome.trim() || p.nome } : p,
      )
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
    },

    desfazer: () => {
      const { projeto } = get()
      if (!projeto) return
      const anterior = historico.desfazer(snapshotDe(projeto))
      if (anterior === null) return
      aplicarSnapshotPaginas(anterior)
    },

    refazer: () => {
      const { projeto } = get()
      if (!projeto) return
      const proximo = historico.refazer(snapshotDe(projeto))
      if (proximo === null) return
      aplicarSnapshotPaginas(proximo)
    },

    salvarAgora: persistir,
  }

  /** Restaura um snapshot de páginas (undo/redo) preservando página ativa */
  function aplicarSnapshotPaginas(snapshot: string) {
    const { projeto, paginaAtivaId, selecionados } = get()
    if (!projeto) return
    const paginas = JSON.parse(snapshot) as Pagina[]
    const aindaExiste = paginas.some((p) => p.id === paginaAtivaId)
    const ativo = aindaExiste ? paginaAtivaId : paginas[0]?.id ?? ''
    const idsValidos = paginas.find((p) => p.id === ativo)?.elementos.map((e) => e.id) ?? []
    set({
      projeto: { ...projeto, paginas },
      paginaAtivaId: ativo,
      selecionados: selecionados.filter((id) => idsValidos.includes(id)),
    })
    atualizarFlagsHistorico()
    agendarSalvamento()
  }
})
