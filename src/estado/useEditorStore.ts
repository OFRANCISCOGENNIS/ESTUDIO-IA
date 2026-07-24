// =============================================================
// Store do editor — estado em tempo real do canvas.
// Toda mutação de elementos passa por `aplicarAlteracao`, que
// registra o snapshot no histórico (undo/redo) e agenda o
// auto-save com debounce de 2 segundos.
// =============================================================

import { create } from 'zustand'
import { Historico } from '../nucleo/historico'
import { clonarElemento } from '../nucleo/elementos'
import { exportarDataUrl } from '../nucleo/exportacao'
import { debounce } from '../utilitarios/tempo'
import { Elemento, Ferramenta, Projeto } from '../tipos/projeto'
import { useProjetosStore } from './useProjetosStore'

export type EstadoSalvamento = 'salvo' | 'pendente' | 'salvando'

/** Parte do estado coberta pelo histórico de undo/redo */
interface SnapshotHistorico {
  elementos: Elemento[]
  corFundo: string
}

interface EstadoEditor {
  projeto: Projeto | null
  selecionados: string[]
  ferramenta: Ferramenta
  zoom: number
  /** Deslocamento do stage (pan) em pixels de tela */
  deslocamento: { x: number; y: number }
  estadoSalvamento: EstadoSalvamento
  /** Id do texto em edição inline (overlay), ou null */
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

  /** Aplica uma mutação nos elementos/fundo com registro no histórico */
  aplicarAlteracao: (
    mutador: (atual: SnapshotHistorico) => SnapshotHistorico,
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

  desfazer: () => void
  refazer: () => void

  salvarAgora: () => void
}

// Histórico e área de transferência vivem fora do estado reativo
const historico = new Historico()
let areaTransferencia: Elemento[] = []

function snapshotDe(projeto: Projeto): string {
  return JSON.stringify({ elementos: projeto.elementos, corFundo: projeto.corFundo })
}

/** Dimensões dos elementos para alinhamento (linha usa a extensão dos pontos) */
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
    // Miniatura em baixa resolução (largura ~320px) para o dashboard
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

  return {
    projeto: null,
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
      // Garante persistência imediata ao sair do editor
      persistir()
      historico.limpar()
      set({ projeto: null, selecionados: [], textoEmEdicao: null })
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
      const { projeto } = get()
      if (!projeto) return
      if (registrarHistorico) {
        historico.registrar(snapshotDe(projeto))
        atualizarFlagsHistorico()
      }
      const resultado = mutador({
        elementos: projeto.elementos,
        corFundo: projeto.corFundo,
      })
      set({
        projeto: {
          ...projeto,
          elementos: resultado.elementos,
          corFundo: resultado.corFundo,
        },
      })
      agendarSalvamento()
    },

    adicionarElemento: (elemento, selecionarNovo = true) => {
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, elemento],
      }))
      if (selecionarNovo) set({ selecionados: [elemento.id], ferramenta: 'selecao' })
    },

    aplicarTemplate: (elementos, corFundo) => {
      // Substitui todo o conteúdo do canvas (operação desfazível)
      get().aplicarAlteracao(() => ({ elementos, corFundo }))
      set({ selecionados: [] })
    },

    atualizarElementos: (ids, mudancas) => {
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((elemento) =>
          ids.includes(elemento.id)
            ? ({ ...elemento, ...mudancas } as Elemento)
            : elemento,
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
      const { projeto, selecionados } = get()
      if (!projeto || selecionados.length === 0) return
      const copias = projeto.elementos
        .filter((elemento) => selecionados.includes(elemento.id))
        .map((elemento) => clonarElemento(elemento))
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, ...copias],
      }))
      set({ selecionados: copias.map((c) => c.id) })
    },

    copiarSelecionados: () => {
      const { projeto, selecionados } = get()
      if (!projeto) return
      areaTransferencia = projeto.elementos.filter((elemento) =>
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
      const { projeto } = get()
      if (!projeto) return
      const indice = projeto.elementos.findIndex((e) => e.id === id)
      if (indice < 0) return
      const destino =
        direcao === 'topo'
          ? projeto.elementos.length - 1
          : direcao === 'fundo'
            ? 0
            : direcao === 'frente'
              ? Math.min(projeto.elementos.length - 1, indice + 1)
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

    desfazer: () => {
      const { projeto } = get()
      if (!projeto) return
      const anterior = historico.desfazer(snapshotDe(projeto))
      if (anterior === null) return
      const estado = JSON.parse(anterior) as SnapshotHistorico
      set({
        projeto: { ...projeto, elementos: estado.elementos, corFundo: estado.corFundo },
        // Remove da seleção ids que deixaram de existir
        selecionados: get().selecionados.filter((id) =>
          estado.elementos.some((e) => e.id === id),
        ),
      })
      atualizarFlagsHistorico()
      agendarSalvamento()
    },

    refazer: () => {
      const { projeto } = get()
      if (!projeto) return
      const proximo = historico.refazer(snapshotDe(projeto))
      if (proximo === null) return
      const estado = JSON.parse(proximo) as SnapshotHistorico
      set({
        projeto: { ...projeto, elementos: estado.elementos, corFundo: estado.corFundo },
        selecionados: get().selecionados.filter((id) =>
          estado.elementos.some((e) => e.id === id),
        ),
      })
      atualizarFlagsHistorico()
      agendarSalvamento()
    },

    salvarAgora: persistir,
  }
})
