// =============================================================
// CanvasEditor — coração do editor. Monta o Stage do Konva com:
// - zoom (roda do mouse, ao redor do ponteiro) e pan (ferramenta
//   Mão ou Espaço pressionado)
// - Transformer com alças de redimensionar/rotacionar
// - seleção por clique, Shift-clique e retângulo de marquee
// - guias inteligentes (snap ao centro e às bordas do canvas)
// - criação por clique quando uma ferramenta de forma/texto está ativa
// - registro do exportador (rasteriza o artboard fielmente)
// =============================================================

import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva'
import {
  criarCaminho,
  criarForma,
  criarLinha,
  criarTexto,
} from '../../nucleo/elementos'
import { mimeDoFormato, registrarExportador } from '../../nucleo/exportacao'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useColabStore } from '../../estado/useColabStore'
import { useUiStore } from '../../estado/useUiStore'
import { Elemento, Ferramenta } from '../../tipos/projeto'
import { ElementoKonva } from './ElementoKonva'
import { OverlayTextoEdicao } from './OverlayTextoEdicao'
import { CamadaColab } from './CamadaColab'
import {
  IconeAgrupar,
  IconeCadeado,
  IconeColar,
  IconeCopiar,
  IconeDesagrupar,
  IconeDuplicar,
  IconeEncaixar,
  IconeFrente,
  IconeGrade,
  IconeLixeira,
  IconeTras,
} from '../icones/Icones'

const LIMIAR_SNAP = 6 // px de canvas para "grudar" nas guias
const COR_GUIA = '#ff3d71' // magenta das guias de alinhamento (docs/PROMPT-UI.md §6.4)
const TAM_GRADE = 50 // espaçamento da grade (px de canvas)
const SNAP_GRADE = 25 // passo do snap quando a grade está ativa

/** Guia de alinhamento: orientação, posição no eixo e âncora do rótulo numérico */
interface Guia {
  tipo: 'v' | 'h'
  pos: number
  ancora: number
  rotulo: string
}

/** Dimensões aproximadas (sem rotação) para snap e marquee */
function dimensoes(elemento: Elemento): { largura: number; altura: number } {
  if (elemento.tipo === 'linha' || elemento.tipo === 'caminho') {
    const xs = elemento.pontos.filter((_, i) => i % 2 === 0)
    const ys = elemento.pontos.filter((_, i) => i % 2 === 1)
    return { largura: Math.max(...xs) - Math.min(...xs), altura: Math.max(...ys) - Math.min(...ys) }
  }
  if (elemento.tipo === 'texto') {
    return { largura: elemento.largura, altura: elemento.tamanhoFonte * elemento.alturaLinha }
  }
  return { largura: elemento.largura, altura: elemento.altura }
}

export function CanvasEditor() {
  const projeto = useEditorStore((s) => s.projeto)
  const pagina = usePaginaAtiva()
  const selecionados = useEditorStore((s) => s.selecionados)
  const ferramenta = useEditorStore((s) => s.ferramenta)
  const zoom = useEditorStore((s) => s.zoom)
  const deslocamento = useEditorStore((s) => s.deslocamento)
  const textoEmEdicao = useEditorStore((s) => s.textoEmEdicao)

  const selecionar = useEditorStore((s) => s.selecionar)
  const alternarSelecao = useEditorStore((s) => s.alternarSelecao)
  const limparSelecao = useEditorStore((s) => s.limparSelecao)
  const definirZoom = useEditorStore((s) => s.definirZoom)
  const definirDeslocamento = useEditorStore((s) => s.definirDeslocamento)
  const definirFerramenta = useEditorStore((s) => s.definirFerramenta)
  const definirTextoEmEdicao = useEditorStore((s) => s.definirTextoEmEdicao)
  const adicionarElemento = useEditorStore((s) => s.adicionarElemento)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)
  const duplicarSelecionados = useEditorStore((s) => s.duplicarSelecionados)
  const removerSelecionados = useEditorStore((s) => s.removerSelecionados)
  const copiarSelecionados = useEditorStore((s) => s.copiarSelecionados)
  const colar = useEditorStore((s) => s.colar)
  const moverCamada = useEditorStore((s) => s.moverCamada)
  const agruparSelecionados = useEditorStore((s) => s.agruparSelecionados)
  const desagruparSelecionados = useEditorStore((s) => s.desagruparSelecionados)
  const aplicarAlteracao = useEditorStore((s) => s.aplicarAlteracao)

  const definirArrastando = useUiStore((s) => s.definirArrastando)
  const pedidoEncaixe = useUiStore((s) => s.pedidoEncaixe)
  const mostrarGrade = useUiStore((s) => s.mostrarGrade)
  const alternarGrade = useUiStore((s) => s.alternarGrade)

  const moverCursorColab = useColabStore((s) => s.moverCursor)
  const modoComentario = useColabStore((s) => s.modoComentario)
  const definirComentarioPendente = useColabStore((s) => s.definirComentarioPendente)
  const podeEditar = useColabStore((s) => s.papel === 'editor')

  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const camadaUiRef = useRef<Konva.Layer>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const nosRef = useRef<Map<string, Konva.Node>>(new Map())
  const marqueeInicio = useRef<{ x: number; y: number } | null>(null)

  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 })
  const [espacoPressionado, setEspacoPressionado] = useState(false)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [guias, setGuias] = useState<Guia[]>([])
  const [caneta, setCaneta] = useState<{ x: number; y: number }[]>([])
  const [canetaMouse, setCanetaMouse] = useState<{ x: number; y: number } | null>(null)
  const [lapis, setLapis] = useState<{ x: number; y: number }[] | null>(null)
  const [menuCtx, setMenuCtx] = useState<{ x: number; y: number } | null>(null)
  const idAjustado = useRef<string | null>(null)
  const encaixeTratado = useRef(0)
  // Posições iniciais da seleção no início de um arraste (grupo/multi-drag)
  const arrasteGrupo = useRef<{ idArrastado: string; posicoes: Map<string, { x: number; y: number }> } | null>(null)

  const modoPan = ferramenta === 'mao' || espacoPressionado
  const modoCaneta = ferramenta === 'caneta' && podeEditar
  const modoLapis = ferramenta === 'lapis' && podeEditar
  const ferramentaCriacao =
    podeEditar &&
    ferramenta !== 'selecao' &&
    ferramenta !== 'mao' &&
    ferramenta !== 'caneta' &&
    ferramenta !== 'lapis'

  // ---- Medição do contêiner (canvas ocupa todo o espaço disponível) ----
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const medir = () =>
      setTamanho({ largura: el.clientWidth, altura: el.clientHeight })
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  // ---- Encaixe: centraliza e ajusta o artboard ao espaço disponível ----
  const encaixar = useCallback(() => {
    if (!projeto || tamanho.largura < 40 || tamanho.altura < 40) return
    const margem = 80
    const escala = Math.min(
      (tamanho.largura - margem) / projeto.larguraCanvas,
      (tamanho.altura - margem) / projeto.alturaCanvas,
      1.5,
    )
    definirZoom(escala, {
      x: (tamanho.largura - projeto.larguraCanvas * escala) / 2,
      y: (tamanho.altura - projeto.alturaCanvas * escala) / 2,
    })
  }, [projeto, tamanho, definirZoom])

  // Encaixe inicial: uma única vez por projeto, após medir o contêiner
  useEffect(() => {
    if (!projeto || tamanho.largura < 40) return
    if (idAjustado.current === projeto.id) return
    encaixar()
    idAjustado.current = projeto.id
  }, [projeto, tamanho, encaixar])

  // Encaixe sob demanda (botão "Encaixar" da barra superior / menu)
  useEffect(() => {
    if (pedidoEncaixe === encaixeTratado.current) return
    encaixeTratado.current = pedidoEncaixe
    encaixar()
  }, [pedidoEncaixe, encaixar])

  // ---- Espaço pressionado ativa o pan temporário ----
  useEffect(() => {
    const ehCampo = (alvo: EventTarget | null) =>
      alvo instanceof HTMLElement &&
      (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
    const baixo = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !ehCampo(e.target)) {
        e.preventDefault()
        setEspacoPressionado(true)
      }
    }
    const cima = (e: KeyboardEvent) => {
      if (e.code === 'Space') setEspacoPressionado(false)
    }
    window.addEventListener('keydown', baixo)
    window.addEventListener('keyup', cima)
    return () => {
      window.removeEventListener('keydown', baixo)
      window.removeEventListener('keyup', cima)
    }
  }, [])

  // ---- Vincula os nós selecionados ao Transformer ----
  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    // Sem permissão de edição, não mostra alças de transformação
    const nos = podeEditar
      ? selecionados
          .map((id) => nosRef.current.get(id))
          .filter((n): n is Konva.Node => Boolean(n))
      : []
    tr.nodes(nos)
    tr.getLayer()?.batchDraw()
  }, [selecionados, pagina?.elementos, textoEmEdicao, podeEditar])

  // ---- Registro do exportador: rasteriza fielmente o artboard ----
  useEffect(() => {
    if (!projeto) return
    const { larguraCanvas, alturaCanvas } = projeto
    registrarExportador(({ formato, escala }) => {
      const stage = stageRef.current
      if (!stage) return null
      const ui = camadaUiRef.current
      const escalaAnterior = { x: stage.scaleX(), y: stage.scaleY() }
      const posAnterior = { x: stage.x(), y: stage.y() }
      const uiVisivel = ui?.visible() ?? true
      // Remove zoom/pan e a UI para capturar exatamente [0,0,w,h]
      ui?.visible(false)
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })
      stage.batchDraw()
      const url = stage.toDataURL({
        x: 0,
        y: 0,
        width: larguraCanvas,
        height: alturaCanvas,
        pixelRatio: escala,
        mimeType: mimeDoFormato(formato),
        quality: formato === 'jpg' ? 0.92 : 1,
      })
      // Restaura o estado de visualização
      stage.scale(escalaAnterior)
      stage.position(posAnterior)
      ui?.visible(uiVisivel)
      stage.batchDraw()
      return url
    })
    return () => registrarExportador(null)
  }, [projeto])

  const registrarNo = useMemo(
    () => (id: string, no: Konva.Node | null) => {
      if (no) nosRef.current.set(id, no)
      else nosRef.current.delete(id)
    },
    [],
  )

  // Finaliza (ou cancela) o caminho em construção com a ferramenta caneta
  const finalizarCaneta = useCallback(
    (fechado: boolean) => {
      setCaneta((atual) => {
        if (atual.length >= 2) {
          const inicio = atual[0]
          const pontos = atual.flatMap((p) => [p.x - inicio.x, p.y - inicio.y])
          adicionarElemento(criarCaminho(inicio.x, inicio.y, pontos, { fechado }))
          definirFerramenta('selecao')
        }
        return []
      })
      setCanetaMouse(null)
    },
    [adicionarElemento, definirFerramenta],
  )

  // Teclado da caneta: Enter finaliza, Esc cancela
  useEffect(() => {
    if (!modoCaneta) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        finalizarCaneta(false)
      } else if (e.key === 'Escape') {
        setCaneta([])
        setCanetaMouse(null)
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [modoCaneta, finalizarCaneta])

  if (!projeto || !pagina) return null

  /** Ids do grupo do elemento (ou só o próprio id, se não agrupado) */
  const idsDoGrupo = (id: string): string[] => {
    const el = pagina.elementos.find((it) => it.id === id)
    if (!el?.grupoId) return [id]
    return pagina.elementos.filter((it) => it.grupoId === el.grupoId).map((it) => it.id)
  }

  const aoSelecionarElemento = (
    id: string,
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // Ferramentas de desenho passam por cima dos elementos
    if (modoPan || modoCaneta || modoLapis) return
    const evento = e.evt as MouseEvent
    const grupo = idsDoGrupo(id)
    if (evento.shiftKey || evento.ctrlKey || evento.metaKey) {
      if (grupo.length === 1) alternarSelecao(id)
      else {
        // Alterna o grupo inteiro de uma vez
        const todosSelecionados = grupo.every((g) => selecionados.includes(g))
        selecionar(
          todosSelecionados
            ? selecionados.filter((s) => !grupo.includes(s))
            : [...new Set([...selecionados, ...grupo])],
        )
      }
    } else if (!selecionados.includes(id)) {
      selecionar(grupo)
    }
  }

  const pontoNoCanvas = (): { x: number; y: number } => {
    const stage = stageRef.current
    const pos = stage?.getRelativePointerPosition()
    return pos ?? { x: 0, y: 0 }
  }

  const criarNaPosicao = (ferramenta: Ferramenta, x: number, y: number) => {
    switch (ferramenta) {
      case 'retangulo':
      case 'elipse':
      case 'triangulo':
      case 'estrela': {
        const forma = criarForma(ferramenta, x, y)
        adicionarElemento(forma)
        break
      }
      case 'linha':
        adicionarElemento(criarLinha(x, y))
        break
      case 'texto': {
        const texto = criarTexto(x, y, { texto: 'Seu texto' })
        adicionarElemento(texto)
        definirTextoEmEdicao(texto.id)
        break
      }
    }
    definirFerramenta('selecao')
  }

  const aoApertarNoStage = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current
    if (!stage) return

    // Clique direito é do menu de contexto — não inicia marquee/criação
    if (e.evt.button === 2) return

    // Ferramenta lápis: começa um traço à mão livre
    if (modoLapis) {
      setLapis([pontoNoCanvas()])
      return
    }

    // Ferramenta caneta: cada clique adiciona um ponto ao caminho
    if (modoCaneta) {
      const p = pontoNoCanvas()
      if (caneta.length >= 2) {
        const inicio = caneta[0]
        if (Math.hypot(p.x - inicio.x, p.y - inicio.y) < 12 / zoom) {
          finalizarCaneta(true)
          return
        }
      }
      setCaneta((atual) => [...atual, p])
      return
    }

    // Modo comentário: o clique (em qualquer lugar) fixa a âncora do pino
    if (modoComentario) {
      const p = pontoNoCanvas()
      const alvo = e.target
      const idAlvo = alvo && alvo !== stage ? alvo.getParent()?.id() || null : null
      definirComentarioPendente({ x: p.x, y: p.y, elementoId: idAlvo })
      return
    }

    const cliqueVazio = e.target === stage || e.target.name() === 'fundo-artboard'
    if (!cliqueVazio) return

    if (ferramentaCriacao) {
      const p = pontoNoCanvas()
      criarNaPosicao(ferramenta, p.x, p.y)
      return
    }
    if (modoPan) return // o Stage cuida do arraste de pan

    // Clique em área vazia: inicia marquee e limpa seleção
    const p = pontoNoCanvas()
    marqueeInicio.current = p
    setMarquee({ x: p.x, y: p.y, w: 0, h: 0 })
    limparSelecao()
  }

  const aoMoverNoStage = () => {
    const ponteiro = pontoNoCanvas()
    moverCursorColab(ponteiro.x, ponteiro.y)
    if (modoCaneta && caneta.length > 0) setCanetaMouse(ponteiro)
    // Lápis: acumula pontos enquanto o botão está pressionado
    if (lapis) {
      const ultimo = lapis[lapis.length - 1]
      if (Math.hypot(ponteiro.x - ultimo.x, ponteiro.y - ultimo.y) > 2 / zoom) {
        setLapis([...lapis, ponteiro])
      }
      return
    }
    if (!marqueeInicio.current) return
    const p = ponteiro
    const inicio = marqueeInicio.current
    setMarquee({
      x: Math.min(inicio.x, p.x),
      y: Math.min(inicio.y, p.y),
      w: Math.abs(p.x - inicio.x),
      h: Math.abs(p.y - inicio.y),
    })
  }

  const aoSoltarNoStage = () => {
    // Lápis: finaliza o traço como um caminho suave
    if (lapis) {
      if (lapis.length >= 3) {
        const inicio = lapis[0]
        const pontos = lapis.flatMap((p) => [p.x - inicio.x, p.y - inicio.y])
        adicionarElemento(criarCaminho(inicio.x, inicio.y, pontos, { tensao: 0.4 }))
        definirFerramenta('selecao')
      }
      setLapis(null)
      return
    }
    if (marquee && marqueeInicio.current) {
      const dentro = pagina.elementos.filter((el) => {
        if (!el.visivel || el.bloqueado) return false
        const { largura, altura } = dimensoes(el)
        return (
          el.x < marquee.x + marquee.w &&
          el.x + largura > marquee.x &&
          el.y < marquee.y + marquee.h &&
          el.y + altura > marquee.y
        )
      })
      if (dentro.length > 0) {
        // Expande a seleção para incluir grupos inteiros
        const ids = new Set<string>()
        for (const el of dentro) idsDoGrupo(el.id).forEach((id) => ids.add(id))
        selecionar([...ids])
      }
    }
    marqueeInicio.current = null
    setMarquee(null)
  }

  // Zoom com a roda do mouse, mantendo o ponto sob o cursor fixo
  const aoRolar = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const ponteiro = stage.getPointerPosition()
    if (!ponteiro) return
    const alvoRelativo = {
      x: (ponteiro.x - deslocamento.x) / zoom,
      y: (ponteiro.y - deslocamento.y) / zoom,
    }
    const fator = 1.08
    const novoZoom = e.evt.deltaY > 0 ? zoom / fator : zoom * fator
    const zoomLimitado = Math.min(5, Math.max(0.1, novoZoom))
    definirZoom(zoomLimitado, {
      x: ponteiro.x - alvoRelativo.x * zoomLimitado,
      y: ponteiro.y - alvoRelativo.y * zoomLimitado,
    })
  }

  // Sinaliza início do arraste (esconde flutuantes); pan do Stage é ignorado
  const aoIniciarArrasteStage = (e: KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current
    if (!stage || e.target === stage) return
    definirArrastando(true)
    // Multi-drag: se o nó arrastado faz parte de uma seleção múltipla,
    // grava as posições iniciais para mover o conjunto junto.
    const no = e.target as Konva.Node
    const el = pagina.elementos.find(
      (it) => it.id === no.id() || nosRef.current.get(it.id) === no,
    )
    if (el && selecionados.includes(el.id) && selecionados.length > 1) {
      const posicoes = new Map<string, { x: number; y: number }>()
      for (const id of selecionados) {
        const alvo = pagina.elementos.find((it) => it.id === id)
        if (alvo && !alvo.bloqueado) posicoes.set(id, { x: alvo.x, y: alvo.y })
      }
      arrasteGrupo.current = { idArrastado: el.id, posicoes }
    }
  }

  // Snap às guias (centro/bordas do canvas) durante o arraste de elementos
  const aoArrastarNoStage = (e: KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current
    if (!stage || e.target === stage) return // arraste de pan não gera guias
    const no = e.target as Konva.Node
    const el = pagina.elementos.find((it) => it.id === no.id() || nosRef.current.get(it.id) === no)
    if (!el) return
    const { largura, altura } = dimensoes(el)
    const limiar = LIMIAR_SNAP / zoom
    const novasGuias: Guia[] = []

    // Grade ativa: encaixa a posição no passo da grade antes das guias
    if (mostrarGrade) {
      no.x(Math.round(no.x() / SNAP_GRADE) * SNAP_GRADE)
      no.y(Math.round(no.y() / SNAP_GRADE) * SNAP_GRADE)
    }

    // Alvos verticais: borda esq, centro, borda dir do canvas
    const alvosX = [0, projeto.larguraCanvas / 2, projeto.larguraCanvas]
    const bordasX = [no.x(), no.x() + largura / 2, no.x() + largura]
    for (const alvo of alvosX) {
      for (let i = 0; i < bordasX.length; i++) {
        if (Math.abs(bordasX[i] - alvo) < limiar) {
          no.x(alvo - (i === 0 ? 0 : i === 1 ? largura / 2 : largura))
          novasGuias.push({ tipo: 'v', pos: alvo, ancora: no.y(), rotulo: String(Math.round(alvo)) })
        }
      }
    }
    const alvosY = [0, projeto.alturaCanvas / 2, projeto.alturaCanvas]
    const bordasY = [no.y(), no.y() + altura / 2, no.y() + altura]
    for (const alvo of alvosY) {
      for (let i = 0; i < bordasY.length; i++) {
        if (Math.abs(bordasY[i] - alvo) < limiar) {
          no.y(alvo - (i === 0 ? 0 : i === 1 ? altura / 2 : altura))
          novasGuias.push({ tipo: 'h', pos: alvo, ancora: no.x(), rotulo: String(Math.round(alvo)) })
        }
      }
    }
    setGuias(novasGuias)

    // Multi-drag: os demais selecionados seguem o nó arrastado ao vivo
    const grupo = arrasteGrupo.current
    if (grupo && grupo.idArrastado === el.id) {
      const inicial = grupo.posicoes.get(el.id)
      if (inicial) {
        const dx = no.x() - inicial.x
        const dy = no.y() - inicial.y
        for (const [id, pos] of grupo.posicoes) {
          if (id === el.id) continue
          nosRef.current.get(id)?.position({ x: pos.x + dx, y: pos.y + dy })
        }
      }
    }
  }

  const aoTerminarArrasteStage = (e: KonvaEventObject<DragEvent>) => {
    setGuias([])
    definirArrastando(false)
    const stage = stageRef.current
    if (stage && e.target === stage) {
      definirDeslocamento({ x: stage.x(), y: stage.y() })
      return
    }
    // Consolida o multi-drag no modelo (o nó arrastado já persistiu o
    // próprio dragend; o histórico registrado lá cobre o estado pré-arraste,
    // então os demais movem sem registrar um segundo passo de undo).
    const grupo = arrasteGrupo.current
    if (grupo) {
      arrasteGrupo.current = null
      const no = e.target as Konva.Node
      const inicial = grupo.posicoes.get(grupo.idArrastado)
      if (inicial) {
        const dx = no.x() - inicial.x
        const dy = no.y() - inicial.y
        if (dx !== 0 || dy !== 0) {
          aplicarAlteracao(
            (atual) => ({
              ...atual,
              elementos: atual.elementos.map((it) => {
                if (it.id === grupo.idArrastado || !grupo.posicoes.has(it.id)) return it
                const pos = grupo.posicoes.get(it.id)!
                return { ...it, x: pos.x + dx, y: pos.y + dy }
              }),
            }),
            false,
          )
        }
      }
    }
  }

  const cursor = modoComentario || modoCaneta || modoLapis
    ? 'crosshair'
    : modoPan
      ? 'grab'
      : ferramentaCriacao
        ? 'crosshair'
        : 'default'

  // ---- Menu de contexto (clique direito) ----
  const aoAbrirMenuContexto = (e: React.MouseEvent) => {
    e.preventDefault()
    const caixa = containerRef.current?.getBoundingClientRect()
    if (!caixa) return
    // Clique direito em área vazia limpa a seleção (menu do canvas)
    const stage = stageRef.current
    const ponteiro = stage?.getPointerPosition()
    const alvo = ponteiro ? stage?.getIntersection(ponteiro) : null
    if (!alvo || alvo.name() === 'fundo-artboard') limparSelecao()
    // Limita a posição para o menu não vazar do contêiner
    const x = Math.min(e.clientX - caixa.left, caixa.width - 224)
    const y = Math.min(e.clientY - caixa.top, caixa.height - 260)
    setMenuCtx({ x: Math.max(4, x), y: Math.max(4, y) })
  }

  const acaoMenu = (fn: () => void) => () => {
    fn()
    setMenuCtx(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-superficie-100 dark:bg-superficie-950"
      style={{ cursor }}
      onContextMenu={aoAbrirMenuContexto}
    >
      <Stage
        ref={stageRef}
        width={tamanho.largura}
        height={tamanho.altura}
        scaleX={zoom}
        scaleY={zoom}
        x={deslocamento.x}
        y={deslocamento.y}
        draggable={modoPan}
        onWheel={aoRolar}
        onMouseDown={aoApertarNoStage}
        onMouseMove={aoMoverNoStage}
        onMouseUp={aoSoltarNoStage}
        onDblClick={() => modoCaneta && finalizarCaneta(false)}
        onDragStart={aoIniciarArrasteStage}
        onDragMove={aoArrastarNoStage}
        onDragEnd={aoTerminarArrasteStage}
      >
        {/* Camada de conteúdo: artboard + elementos */}
        <Layer>
          <Rect
            name="fundo-artboard"
            x={0}
            y={0}
            width={projeto.larguraCanvas}
            height={projeto.alturaCanvas}
            fill={pagina.corFundo}
            shadowColor="#000000"
            shadowOpacity={0.18}
            shadowBlur={24}
            shadowOffsetY={6}
          />
          {pagina.elementos.map((elemento) => (
            <ElementoKonva
              key={elemento.id}
              elemento={elemento}
              emEdicao={textoEmEdicao === elemento.id}
              permitirArraste={podeEditar && !modoCaneta && !modoLapis}
              registrarNo={registrarNo}
              aoSelecionar={aoSelecionarElemento}
              aoAlterar={(id, mudancas) => atualizarElementos([id], mudancas)}
              aoEditarTexto={podeEditar ? definirTextoEmEdicao : () => {}}
            />
          ))}
        </Layer>

        {/* Camada de UI: guias, marquee e transformer (oculta na exportação) */}
        <Layer ref={camadaUiRef}>
          {/* Grade de alinhamento (toggle no menu de contexto / paleta) */}
          {mostrarGrade &&
            Array.from(
              { length: Math.floor(projeto.larguraCanvas / TAM_GRADE) },
              (_, i) => (
                <Line
                  key={`gv${i}`}
                  points={[(i + 1) * TAM_GRADE, 0, (i + 1) * TAM_GRADE, projeto.alturaCanvas]}
                  stroke="#7c4dff"
                  opacity={0.12}
                  strokeWidth={1 / zoom}
                  listening={false}
                />
              ),
            )}
          {mostrarGrade &&
            Array.from(
              { length: Math.floor(projeto.alturaCanvas / TAM_GRADE) },
              (_, i) => (
                <Line
                  key={`gh${i}`}
                  points={[0, (i + 1) * TAM_GRADE, projeto.larguraCanvas, (i + 1) * TAM_GRADE]}
                  stroke="#7c4dff"
                  opacity={0.12}
                  strokeWidth={1 / zoom}
                  listening={false}
                />
              ),
            )}

          {/* Prévia do traço do lápis à mão livre */}
          {lapis && lapis.length > 1 && (
            <Line
              points={lapis.flatMap((p) => [p.x, p.y])}
              stroke="#7c4dff"
              strokeWidth={4 / zoom}
              tension={0.4}
              lineCap="round"
              lineJoin="round"
              listening={false}
            />
          )}

          {guias.map((guia, i) => (
            <Fragment key={i}>
              <Line
                points={
                  guia.tipo === 'v'
                    ? [guia.pos, 0, guia.pos, projeto.alturaCanvas]
                    : [0, guia.pos, projeto.larguraCanvas, guia.pos]
                }
                stroke={COR_GUIA}
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 4 / zoom]}
              />
              <Text
                text={guia.rotulo}
                x={guia.tipo === 'v' ? guia.pos + 6 / zoom : guia.ancora + 6 / zoom}
                y={guia.tipo === 'v' ? guia.ancora + 6 / zoom : guia.pos + 6 / zoom}
                fontSize={12 / zoom}
                fontStyle="bold"
                fill={COR_GUIA}
                listening={false}
              />
            </Fragment>
          ))}
          {marquee && (
            <Rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.w}
              height={marquee.h}
              fill="rgba(124, 77, 255, 0.12)"
              stroke="#7c4dff"
              strokeWidth={1 / zoom}
            />
          )}

          {/* Prévia do caminho em construção (ferramenta caneta) */}
          {caneta.length > 0 && (
            <>
              <Line
                points={[
                  ...caneta.flatMap((p) => [p.x, p.y]),
                  ...(canetaMouse ? [canetaMouse.x, canetaMouse.y] : []),
                ]}
                stroke="#7c4dff"
                strokeWidth={2 / zoom}
                dash={[6 / zoom, 4 / zoom]}
              />
              {caneta.map((p, i) => (
                <Rect
                  key={i}
                  x={p.x - 4 / zoom}
                  y={p.y - 4 / zoom}
                  width={8 / zoom}
                  height={8 / zoom}
                  fill={i === 0 ? '#22c55e' : '#ffffff'}
                  stroke="#7c4dff"
                  strokeWidth={1.5 / zoom}
                  cornerRadius={2 / zoom}
                />
              ))}
            </>
          )}

          <Transformer
            ref={transformerRef}
            rotateEnabled
            anchorSize={9}
            anchorCornerRadius={4}
            borderStroke="#7c4dff"
            anchorStroke="#7c4dff"
            boundBoxFunc={(caixaAnterior, novaCaixa) =>
              novaCaixa.width < 5 || novaCaixa.height < 5 ? caixaAnterior : novaCaixa
            }
          />
        </Layer>
      </Stage>

      {/* Overlay de edição de texto (fora do canvas Konva) */}
      {textoEmEdicao && (
        <OverlayTextoEdicao
          zoom={zoom}
          deslocamento={deslocamento}
          aoFechar={() => definirTextoEmEdicao(null)}
        />
      )}

      {/* Sobreposição de colaboração: cursores e comentários */}
      <CamadaColab />

      {/* Menu de contexto (clique direito) */}
      {menuCtx && (
        <>
          {/* Camada invisível que fecha o menu ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onMouseDown={() => setMenuCtx(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenuCtx(null)
            }}
          />
          <div
            role="menu"
            aria-label="Ações do canvas"
            className="absolute z-50 w-52 rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] p-1.5 shadow-flutuante dark:border-superficie-700"
            style={{ left: menuCtx.x, top: menuCtx.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {podeEditar && selecionados.length > 0 ? (
              <>
                <ItemMenu rotulo="Duplicar" atalho="Ctrl+D" onClick={acaoMenu(duplicarSelecionados)}>
                  <IconeDuplicar tamanho={16} />
                </ItemMenu>
                <ItemMenu rotulo="Copiar" atalho="Ctrl+C" onClick={acaoMenu(copiarSelecionados)}>
                  <IconeCopiar tamanho={16} />
                </ItemMenu>
                <ItemMenu rotulo="Colar" atalho="Ctrl+V" onClick={acaoMenu(colar)}>
                  <IconeColar tamanho={16} />
                </ItemMenu>
                <SeparadorMenu />
                <ItemMenu
                  rotulo="Trazer para frente"
                  onClick={acaoMenu(() => selecionados.forEach((id) => moverCamada(id, 'frente')))}
                >
                  <IconeFrente tamanho={16} />
                </ItemMenu>
                <ItemMenu
                  rotulo="Enviar para trás"
                  onClick={acaoMenu(() => selecionados.forEach((id) => moverCamada(id, 'tras')))}
                >
                  <IconeTras tamanho={16} />
                </ItemMenu>
                <SeparadorMenu />
                {selecionados.length >= 2 && (
                  <ItemMenu rotulo="Agrupar" atalho="Ctrl+G" onClick={acaoMenu(agruparSelecionados)}>
                    <IconeAgrupar tamanho={16} />
                  </ItemMenu>
                )}
                {selecionados.some(
                  (id) => pagina.elementos.find((it) => it.id === id)?.grupoId,
                ) && (
                  <ItemMenu rotulo="Desagrupar" atalho="Ctrl+Shift+G" onClick={acaoMenu(desagruparSelecionados)}>
                    <IconeDesagrupar tamanho={16} />
                  </ItemMenu>
                )}
                <ItemMenu
                  rotulo="Bloquear"
                  onClick={acaoMenu(() => atualizarElementos(selecionados, { bloqueado: true }))}
                >
                  <IconeCadeado tamanho={16} />
                </ItemMenu>
                <ItemMenu rotulo="Excluir" atalho="Del" perigo onClick={acaoMenu(removerSelecionados)}>
                  <IconeLixeira tamanho={16} />
                </ItemMenu>
              </>
            ) : (
              <>
                {podeEditar && (
                  <ItemMenu rotulo="Colar" atalho="Ctrl+V" onClick={acaoMenu(colar)}>
                    <IconeColar tamanho={16} />
                  </ItemMenu>
                )}
                <ItemMenu rotulo="Encaixar na tela" onClick={acaoMenu(encaixar)}>
                  <IconeEncaixar tamanho={16} />
                </ItemMenu>
                <ItemMenu rotulo="Zoom 100%" onClick={acaoMenu(() => definirZoom(1))}>
                  <span className="w-4 text-center text-[10px] font-bold">1:1</span>
                </ItemMenu>
                <ItemMenu
                  rotulo={mostrarGrade ? 'Ocultar grade' : 'Mostrar grade'}
                  onClick={acaoMenu(alternarGrade)}
                >
                  <IconeGrade tamanho={16} />
                </ItemMenu>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ---- Itens do menu de contexto ----

function ItemMenu({
  rotulo,
  atalho,
  perigo = false,
  onClick,
  children,
}: {
  rotulo: string
  atalho?: string
  perigo?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors duration-micro ${
        perigo
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
          : 'text-superficie-800 hover:bg-primaria-500/10 dark:text-superficie-100 dark:hover:bg-primaria-500/20'
      }`}
    >
      {children}
      <span className="flex-1">{rotulo}</span>
      {atalho && <span className="text-[10px] text-superficie-500">{atalho}</span>}
    </button>
  )
}

const SeparadorMenu = () => (
  <div className="mx-2 my-1 h-px bg-superficie-200 dark:bg-superficie-700" />
)
