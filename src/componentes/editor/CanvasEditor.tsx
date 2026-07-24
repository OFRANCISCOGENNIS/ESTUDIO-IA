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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage, Transformer } from 'react-konva'
import {
  criarForma,
  criarLinha,
  criarTexto,
} from '../../nucleo/elementos'
import { mimeDoFormato, registrarExportador } from '../../nucleo/exportacao'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { Elemento, Ferramenta } from '../../tipos/projeto'
import { ElementoKonva } from './ElementoKonva'
import { OverlayTextoEdicao } from './OverlayTextoEdicao'

const LIMIAR_SNAP = 6 // px de canvas para "grudar" nas guias

/** Dimensões aproximadas (sem rotação) para snap e marquee */
function dimensoes(elemento: Elemento): { largura: number; altura: number } {
  if (elemento.tipo === 'linha') {
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

  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const camadaUiRef = useRef<Konva.Layer>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const nosRef = useRef<Map<string, Konva.Node>>(new Map())
  const marqueeInicio = useRef<{ x: number; y: number } | null>(null)

  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 })
  const [espacoPressionado, setEspacoPressionado] = useState(false)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [guias, setGuias] = useState<number[][]>([])
  const idAjustado = useRef<string | null>(null)

  const modoPan = ferramenta === 'mao' || espacoPressionado
  const ferramentaCriacao = ferramenta !== 'selecao' && ferramenta !== 'mao'

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

  // ---- Ajuste inicial: centraliza e encaixa o artboard ao abrir ----
  // Encaixa uma única vez por projeto, só depois de o contêiner ser medido.
  useEffect(() => {
    if (!projeto || tamanho.largura < 40 || tamanho.altura < 40) return
    if (idAjustado.current === projeto.id) return
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
    idAjustado.current = projeto.id
  }, [projeto, tamanho, definirZoom])

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
    const nos = selecionados
      .map((id) => nosRef.current.get(id))
      .filter((n): n is Konva.Node => Boolean(n))
    tr.nodes(nos)
    tr.getLayer()?.batchDraw()
  }, [selecionados, pagina?.elementos, textoEmEdicao])

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

  if (!projeto || !pagina) return null

  const aoSelecionarElemento = (
    id: string,
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (modoPan) return
    const evento = e.evt as MouseEvent
    if (evento.shiftKey || evento.ctrlKey || evento.metaKey) {
      alternarSelecao(id)
    } else if (!selecionados.includes(id)) {
      selecionar([id])
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
    if (!marqueeInicio.current) return
    const p = pontoNoCanvas()
    const inicio = marqueeInicio.current
    setMarquee({
      x: Math.min(inicio.x, p.x),
      y: Math.min(inicio.y, p.y),
      w: Math.abs(p.x - inicio.x),
      h: Math.abs(p.y - inicio.y),
    })
  }

  const aoSoltarNoStage = () => {
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
      if (dentro.length > 0) selecionar(dentro.map((el) => el.id))
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

  // Snap às guias (centro/bordas do canvas) durante o arraste de elementos
  const aoArrastarNoStage = (e: KonvaEventObject<DragEvent>) => {
    const stage = stageRef.current
    if (!stage || e.target === stage) return // arraste de pan não gera guias
    const no = e.target as Konva.Node
    const el = pagina.elementos.find((it) => it.id === no.id() || nosRef.current.get(it.id) === no)
    if (!el) return
    const { largura, altura } = dimensoes(el)
    const limiar = LIMIAR_SNAP / zoom
    const novasGuias: number[][] = []

    // Alvos verticais: borda esq, centro, borda dir do canvas
    const alvosX = [0, projeto.larguraCanvas / 2, projeto.larguraCanvas]
    const bordasX = [no.x(), no.x() + largura / 2, no.x() + largura]
    for (const alvo of alvosX) {
      for (let i = 0; i < bordasX.length; i++) {
        if (Math.abs(bordasX[i] - alvo) < limiar) {
          no.x(alvo - (i === 0 ? 0 : i === 1 ? largura / 2 : largura))
          novasGuias.push([alvo, 0, alvo, projeto.alturaCanvas])
        }
      }
    }
    const alvosY = [0, projeto.alturaCanvas / 2, projeto.alturaCanvas]
    const bordasY = [no.y(), no.y() + altura / 2, no.y() + altura]
    for (const alvo of alvosY) {
      for (let i = 0; i < bordasY.length; i++) {
        if (Math.abs(bordasY[i] - alvo) < limiar) {
          no.y(alvo - (i === 0 ? 0 : i === 1 ? altura / 2 : altura))
          novasGuias.push([0, alvo, projeto.larguraCanvas, alvo])
        }
      }
    }
    setGuias(novasGuias)
  }

  const aoTerminarArrasteStage = (e: KonvaEventObject<DragEvent>) => {
    setGuias([])
    const stage = stageRef.current
    if (stage && e.target === stage) {
      definirDeslocamento({ x: stage.x(), y: stage.y() })
    }
  }

  const cursor = modoPan
    ? espacoPressionado
      ? 'grab'
      : 'grab'
    : ferramentaCriacao
      ? 'crosshair'
      : 'default'

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-superficie-100 dark:bg-superficie-950"
      style={{ cursor }}
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
              registrarNo={registrarNo}
              aoSelecionar={aoSelecionarElemento}
              aoAlterar={(id, mudancas) => atualizarElementos([id], mudancas)}
              aoEditarTexto={definirTextoEmEdicao}
            />
          ))}
        </Layer>

        {/* Camada de UI: guias, marquee e transformer (oculta na exportação) */}
        <Layer ref={camadaUiRef}>
          {guias.map((pontos, i) => (
            <Line
              key={i}
              points={pontos}
              stroke="#e879f9"
              strokeWidth={1 / zoom}
              dash={[4 / zoom, 4 / zoom]}
            />
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
    </div>
  )
}
