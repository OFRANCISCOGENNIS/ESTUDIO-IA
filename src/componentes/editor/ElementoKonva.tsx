// =============================================================
// Renderiza um Elemento do projeto como um nó Konva.
// Camada de abstração: cada elemento é um <Group> posicionado em
// (x, y) com rotação/opacidade/mistura; a forma concreta é desenhada
// em coordenadas locais (origem = canto superior esquerdo). Assim o
// modelo de transformação é uniforme e o baking de escala fica
// centralizado. Recursos da Fase 2: gradientes, modos de mesclagem,
// filtros/ajustes de imagem e máscaras de recorte.
// =============================================================

import Konva from 'konva'
import type { Context } from 'konva/lib/Context'
import { Filter, KonvaEventObject } from 'konva/lib/Node'
import { type ReactNode, useCallback, useEffect, useRef } from 'react'
import {
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Star,
  Text,
  Wedge,
} from 'react-konva'
import {
  filtroAjustesDSP,
  filtroNitidezDSP,
  raioDesfoque,
  resolverAjustes,
  temEfeito,
} from '../../nucleo/filtros'
import {
  Elemento,
  FormatoMascara,
  Gradiente,
  ModoMistura,
} from '../../tipos/projeto'
import { useImagem } from '../../utilitarios/useImagem'
import { movimentoReduzido } from '../../hooks/usaMovimentoReduzido'

const DIMENSAO_MINIMA = 5

interface Props {
  elemento: Elemento
  emEdicao: boolean
  /** Permite arrastar (falso em modo somente-leitura/colaboração) */
  permitirArraste?: boolean
  registrarNo: (id: string, no: Konva.Node | null) => void
  aoSelecionar: (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => void
  aoAlterar: (id: string, mudancas: Partial<Elemento>) => void
  aoEditarTexto: (id: string) => void
}

export function ElementoKonva({
  elemento,
  emEdicao,
  permitirArraste = true,
  registrarNo,
  aoSelecionar,
  aoAlterar,
  aoEditarTexto,
}: Props) {
  const aoFinalizarArraste = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      aoAlterar(elemento.id, { x: e.target.x(), y: e.target.y() })
    },
    [aoAlterar, elemento.id],
  )

  const aoFinalizarTransformacao = useCallback(
    (e: KonvaEventObject<Event>) => {
      const no = e.target as Konva.Group
      const escalaX = no.scaleX()
      const escalaY = no.scaleY()
      const rotacao = no.rotation()
      const x = no.x()
      const y = no.y()
      no.scaleX(1)
      no.scaleY(1)

      const base: Partial<Elemento> = { x, y, rotacao }

      switch (elemento.tipo) {
        case 'texto':
          aoAlterar(elemento.id, {
            ...base,
            largura: Math.max(20, elemento.largura * escalaX),
            tamanhoFonte: Math.max(6, elemento.tamanhoFonte * escalaY),
          })
          break
        case 'linha':
        case 'caminho':
          aoAlterar(elemento.id, {
            ...base,
            pontos: elemento.pontos.map((valor, i) =>
              i % 2 === 0 ? valor * escalaX : valor * escalaY,
            ),
          })
          break
        default:
          aoAlterar(elemento.id, {
            ...base,
            largura: Math.max(DIMENSAO_MINIMA, elemento.largura * escalaX),
            altura: Math.max(DIMENSAO_MINIMA, elemento.altura * escalaY),
          })
      }
    },
    [aoAlterar, elemento],
  )

  // ---- Nascimento: elemento novo assenta com fade (§7.4) ----
  // Tween direto no nó Konva: zero re-render do React durante a animação.
  // Respeita prefers-reduced-motion (§7.7) e não mexe em transform, para
  // não brigar com arraste/Transformer se o usuário agir durante o fade.
  const noRef = useRef<Konva.Group | null>(null)
  const jaNasceu = useRef(false)
  const opacidadeAlvo = elemento.opacidade
  useEffect(() => {
    if (jaNasceu.current) return
    jaNasceu.current = true
    const no = noRef.current
    if (!no || movimentoReduzido()) return
    no.opacity(0)
    const tween = new Konva.Tween({
      node: no,
      opacity: opacidadeAlvo,
      duration: 0.24,
      easing: Konva.Easings.EaseOut,
    })
    tween.play()
    return () => {
      tween.destroy()
      no.opacity(opacidadeAlvo)
    }
    // Só no primeiro mount deste elemento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const propsGrupo = {
    ref: (no: Konva.Group | null) => {
      noRef.current = no
      registrarNo(elemento.id, no)
    },
    x: elemento.x,
    y: elemento.y,
    rotation: elemento.rotacao,
    opacity: elemento.opacidade,
    visible: elemento.visivel,
    draggable: permitirArraste && !elemento.bloqueado,
    globalCompositeOperation: composicao(elemento.mistura),
    // Perf (§11.4): objetos travados/ocultos saem do grafo de hit-test;
    // desenho "perfeito" e sombra em stroke são caros e imperceptíveis aqui.
    listening: elemento.visivel && !elemento.bloqueado,
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    onMouseDown: (e: KonvaEventObject<MouseEvent>) => aoSelecionar(elemento.id, e),
    onTap: (e: KonvaEventObject<TouchEvent>) => aoSelecionar(elemento.id, e),
    onDragEnd: aoFinalizarArraste,
    onTransformEnd: aoFinalizarTransformacao,
  }

  return (
    <Group {...propsGrupo}>
      <FormaInterna elemento={elemento} emEdicao={emEdicao} aoEditarTexto={aoEditarTexto} />
    </Group>
  )
}

// ---- Desenho da forma concreta em coordenadas locais ----

function FormaInterna({
  elemento,
  emEdicao,
  aoEditarTexto,
}: {
  elemento: Elemento
  emEdicao: boolean
  aoEditarTexto: (id: string) => void
}) {
  switch (elemento.tipo) {
    case 'retangulo':
      return (
        <Rect
          width={elemento.largura}
          height={elemento.altura}
          {...preenchimentoForma(elemento.preenchimento, elemento.gradiente, elemento.largura, elemento.altura, false)}
          stroke={corBorda(elemento.corBorda, elemento.espessuraBorda)}
          strokeWidth={elemento.espessuraBorda}
          cornerRadius={elemento.raioCanto}
        />
      )
    case 'elipse':
      return (
        <Ellipse
          x={elemento.largura / 2}
          y={elemento.altura / 2}
          radiusX={elemento.largura / 2}
          radiusY={elemento.altura / 2}
          {...preenchimentoForma(elemento.preenchimento, elemento.gradiente, elemento.largura, elemento.altura, true)}
          stroke={corBorda(elemento.corBorda, elemento.espessuraBorda)}
          strokeWidth={elemento.espessuraBorda}
        />
      )
    case 'triangulo':
      return (
        <Line
          points={[elemento.largura / 2, 0, elemento.largura, elemento.altura, 0, elemento.altura]}
          closed
          {...preenchimentoForma(elemento.preenchimento, elemento.gradiente, elemento.largura, elemento.altura, false)}
          stroke={corBorda(elemento.corBorda, elemento.espessuraBorda)}
          strokeWidth={elemento.espessuraBorda}
        />
      )
    case 'estrela':
      return (
        <Star
          x={elemento.largura / 2}
          y={elemento.altura / 2}
          numPoints={Math.max(3, elemento.pontas)}
          innerRadius={Math.min(elemento.largura, elemento.altura) / 4}
          outerRadius={Math.min(elemento.largura, elemento.altura) / 2}
          {...preenchimentoForma(elemento.preenchimento, elemento.gradiente, elemento.largura, elemento.altura, true)}
          stroke={corBorda(elemento.corBorda, elemento.espessuraBorda)}
          strokeWidth={elemento.espessuraBorda}
        />
      )
    case 'linha':
      return (
        <Line
          points={elemento.pontos}
          stroke={elemento.cor}
          strokeWidth={elemento.espessura}
          lineCap="round"
          dash={elemento.tracejada ? [elemento.espessura * 3, elemento.espessura * 2] : undefined}
        />
      )
    case 'caminho':
      return (
        <Line
          points={elemento.pontos}
          closed={elemento.fechado}
          tension={elemento.tensao}
          fill={elemento.fechado && elemento.preenchimento !== 'transparent' ? elemento.preenchimento : undefined}
          stroke={corBorda(elemento.corBorda, elemento.espessuraBorda)}
          strokeWidth={elemento.espessuraBorda}
          lineCap="round"
          lineJoin="round"
        />
      )
    case 'texto':
      return <TextoKonva elemento={elemento} emEdicao={emEdicao} aoEditarTexto={aoEditarTexto} />
    case 'imagem':
      return <ImagemKonva elemento={elemento} />
    case 'grafico':
      return <GraficoKonva elemento={elemento} />
    case 'tabela':
      return <TabelaKonva elemento={elemento} />
  }
}

// ---- Imagem com filtros/ajustes e máscara ----

function ImagemKonva({
  elemento,
}: {
  elemento: Extract<Elemento, { tipo: 'imagem' }>
}) {
  const imagem = useImagem(elemento.url)
  const ref = useRef<Konva.Image>(null)

  // Ajustes efetivos: preset (× intensidade) somado aos ajustes manuais
  const ajustes = resolverAjustes(elemento.filtro, elemento.intensidadeFiltro, elemento.ajustes)
  const ativo = Boolean(imagem) && temEfeito(ajustes)
  const chaveAjustes = JSON.stringify(ajustes)

  // Aplica/limpa filtros do Konva e refaz o cache quando algo muda
  useEffect(() => {
    const no = ref.current
    if (!no || !imagem) return
    if (ativo) {
      const filtros: Filter[] = [filtroAjustesDSP]
      if (ajustes.desfoque > 0) filtros.push(Konva.Filters.Blur)
      if (ajustes.nitidez > 0) filtros.push(filtroNitidezDSP)
      no.filters(filtros)
      no.cache()
    } else {
      no.filters([])
      no.clearCache()
    }
    no.getLayer()?.batchDraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagem, ativo, chaveAjustes, elemento.largura, elemento.altura, elemento.mascara])

  if (!imagem) {
    return (
      <Rect
        width={elemento.largura}
        height={elemento.altura}
        fill="#e5e7eb"
        cornerRadius={elemento.raioCanto}
      />
    )
  }

  const konvaImage = (
    <KonvaImage
      ref={ref}
      image={imagem}
      width={elemento.largura}
      height={elemento.altura}
      cornerRadius={elemento.mascara === 'nenhuma' ? elemento.raioCanto : 0}
      // Atributos lidos pelos filtros customizados
      ajustesDSP={ajustes}
      nitidezDSP={ajustes.nitidez}
      blurRadius={raioDesfoque(ajustes.desfoque)}
    />
  )

  if (elemento.mascara === 'nenhuma') return konvaImage

  return (
    <Group
      clipFunc={(ctx: Context) =>
        desenharMascara(ctx, elemento.mascara, elemento.largura, elemento.altura, elemento.raioCanto)
      }
    >
      {konvaImage}
    </Group>
  )
}

// ---- Texto com efeitos criativos e texturas ----

const TEXTURAS: Record<string, (number | string)[]> = {
  dourado: [0, '#fff6c0', 0.45, '#e9c94b', 0.5, '#b8860b', 0.6, '#e9c94b', 1, '#8a6d1f'],
  prata: [0, '#ffffff', 0.5, '#c7ccd1', 1, '#6b7280'],
  metal: [0, '#e5e7eb', 0.5, '#6b7280', 1, '#111827'],
  fogo: [0, '#fde68a', 0.5, '#f97316', 1, '#b91c1c'],
  gelo: [0, '#ffffff', 0.5, '#bae6fd', 1, '#0284c7'],
}

function TextoKonva({
  elemento,
  emEdicao,
  aoEditarTexto,
}: {
  elemento: Extract<Elemento, { tipo: 'texto' }>
  emEdicao: boolean
  aoEditarTexto: (id: string) => void
}) {
  const base = {
    text: elemento.texto,
    width: elemento.largura,
    fontSize: elemento.tamanhoFonte,
    fontFamily: elemento.fonte,
    fontStyle: estiloFonte(elemento.negrito, elemento.italico),
    textDecoration: elemento.sublinhado ? 'underline' : '',
    align: elemento.alinhamento,
    lineHeight: elemento.alturaLinha,
    letterSpacing: elemento.espacamentoLetras,
  }

  // Preenchimento: sólido ou textura (gradiente vertical)
  const preenchimento: Record<string, unknown> =
    elemento.textura !== 'nenhuma' && TEXTURAS[elemento.textura]
      ? {
          fillPriority: 'linear-gradient',
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: 0, y: elemento.tamanhoFonte * 1.1 },
          fillLinearGradientColorStops: TEXTURAS[elemento.textura],
        }
      : { fill: elemento.cor }

  // Efeitos
  const efeito: Record<string, unknown> = {}
  if (elemento.efeito === 'sombra') {
    Object.assign(efeito, { shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 6, shadowOffsetX: 4, shadowOffsetY: 4 })
  } else if (elemento.efeito === 'contorno') {
    Object.assign(efeito, { stroke: '#111827', strokeWidth: elemento.tamanhoFonte * 0.06, fillAfterStrokeEnabled: true })
  } else if (elemento.efeito === 'neon') {
    Object.assign(efeito, {
      shadowColor: elemento.cor,
      shadowBlur: 18,
      shadowOpacity: 1,
      stroke: elemento.cor,
      strokeWidth: elemento.tamanhoFonte * 0.02,
      fillAfterStrokeEnabled: true,
    })
  }

  const dbl = { onDblClick: () => aoEditarTexto(elemento.id), onDblTap: () => aoEditarTexto(elemento.id) }

  if (elemento.efeito === 'eco') {
    return (
      <Group {...dbl}>
        {[3, 2, 1].map((i) => (
          <Text key={i} {...base} x={i * 8} y={i * 8} fill={elemento.cor} opacity={0.18 * i} listening={false} />
        ))}
        <Text {...base} {...preenchimento} visible={!emEdicao} {...dbl} />
      </Group>
    )
  }

  return <Text {...base} {...preenchimento} {...efeito} visible={!emEdicao} {...dbl} />
}

// ---- Gráficos (barras, pizza, linhas, funil) ----

function GraficoKonva({ elemento }: { elemento: Extract<Elemento, { tipo: 'grafico' }> }) {
  const { largura: L, altura: A, dados, cores, corTexto, mostrarValores } = elemento
  const cor = (i: number) => cores[i % cores.length] || '#7c4dff'
  const valores = dados.map((d) => d.valor)
  const max = Math.max(1, ...valores)
  const padE = 12
  const padB = 28
  const padT = 14
  const chartL = Math.max(1, L - padE * 2)
  const chartA = Math.max(1, A - padB - padT)

  const rotulo = (texto: string, x: number, y: number, w: number, cor: string, tam = 12, align: 'left' | 'center' = 'center') => (
    <Text text={texto} x={x} y={y} width={w} align={align} fontSize={tam} fontFamily="Inter" fill={cor} />
  )

  if (elemento.tipoGrafico === 'pizza') {
    const total = Math.max(1, valores.reduce((s, v) => s + v, 0))
    const raio = Math.min(L, A) / 2 - 16
    let inicio = -90
    return (
      <Group>
        {dados.map((d, i) => {
          const angulo = (d.valor / total) * 360
          const w = (
            <Wedge key={i} x={L / 2} y={A / 2} radius={raio} angle={angulo} rotation={inicio} fill={cor(i)} stroke="#ffffff" strokeWidth={2} />
          )
          inicio += angulo
          return w
        })}
      </Group>
    )
  }

  if (elemento.tipoGrafico === 'funil') {
    const largMax = chartL
    const alturaSeg = chartA / Math.max(1, dados.length)
    return (
      <Group>
        {dados.map((d, i) => {
          const wTop = (d.valor / max) * largMax
          const prox = dados[i + 1]
          const wBase = ((prox ? prox.valor : d.valor) / max) * largMax
          const y = padT + i * alturaSeg
          const cx = L / 2
          return (
            <Group key={i}>
              <Line
                points={[cx - wTop / 2, y, cx + wTop / 2, y, cx + wBase / 2, y + alturaSeg - 4, cx - wBase / 2, y + alturaSeg - 4]}
                closed
                fill={cor(i)}
              />
              {mostrarValores && rotulo(`${d.rotulo}: ${d.valor}`, 0, y + alturaSeg / 2 - 8, L, corTexto)}
            </Group>
          )
        })}
      </Group>
    )
  }

  if (elemento.tipoGrafico === 'linhas') {
    const passo = dados.length > 1 ? chartL / (dados.length - 1) : chartL
    const pontos = dados.flatMap((d, i) => [padE + i * passo, padT + chartA - (d.valor / max) * chartA])
    return (
      <Group>
        <Line points={pontos} stroke={cor(0)} strokeWidth={3} lineCap="round" lineJoin="round" tension={0.3} />
        {dados.map((d, i) => (
          <Group key={i}>
            <Ellipse x={padE + i * passo} y={padT + chartA - (d.valor / max) * chartA} radiusX={4} radiusY={4} fill={cor(0)} />
            {rotulo(d.rotulo, padE + i * passo - passo / 2, A - padB + 6, passo, corTexto)}
          </Group>
        ))}
      </Group>
    )
  }

  // barras (padrão)
  const passo = chartL / Math.max(1, dados.length)
  const largBarra = passo * 0.6
  return (
    <Group>
      {dados.map((d, i) => {
        const h = (d.valor / max) * chartA
        const x = padE + i * passo + (passo - largBarra) / 2
        const y = padT + chartA - h
        return (
          <Group key={i}>
            <Rect x={x} y={y} width={largBarra} height={h} fill={cor(i)} cornerRadius={4} />
            {mostrarValores && rotulo(String(d.valor), x - passo * 0.2, y - 16, largBarra + passo * 0.4, corTexto, 11)}
            {rotulo(d.rotulo, padE + i * passo, A - padB + 6, passo, corTexto)}
          </Group>
        )
      })}
    </Group>
  )
}

// ---- Tabelas ----

function TabelaKonva({ elemento }: { elemento: Extract<Elemento, { tipo: 'tabela' }> }) {
  const { celulas, largura: L, altura: A } = elemento
  const linhas = celulas.length || 1
  const colunas = Math.max(1, ...celulas.map((r) => r.length))
  const colW = L / colunas
  const rowH = A / linhas
  const conteudo: ReactNode[] = []
  for (let r = 0; r < linhas; r++) {
    for (let c = 0; c < colunas; c++) {
      const x = c * colW
      const y = r * rowH
      const cabecalho = r === 0
      const fundo = cabecalho ? elemento.corCabecalho : r % 2 === 0 ? '#f9fafb' : '#ffffff'
      conteudo.push(
        <Rect key={`f${r}-${c}`} x={x} y={y} width={colW} height={rowH} fill={fundo} stroke={elemento.corLinha} strokeWidth={1} />,
      )
      conteudo.push(
        <Text
          key={`t${r}-${c}`}
          x={x + 8}
          y={y + rowH / 2 - 7}
          width={colW - 16}
          text={celulas[r]?.[c] ?? ''}
          fontSize={13}
          fontFamily="Inter"
          fontStyle={cabecalho ? 'bold' : 'normal'}
          fill={cabecalho ? elemento.corCabecalhoTexto : elemento.corTexto}
          ellipsis
          wrap="none"
        />,
      )
    }
  }
  return <Group>{conteudo}</Group>
}

// ---- Máscaras de recorte (desenho do caminho no contexto) ----

function desenharMascara(
  ctx: Context,
  formato: FormatoMascara,
  w: number,
  h: number,
  raio: number,
): void {
  ctx.beginPath()
  switch (formato) {
    case 'circulo':
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2, false)
      break
    case 'arredondado': {
      const r = Math.min(raio > 0 ? raio : Math.min(w, h) * 0.15, Math.min(w, h) / 2)
      ctx.moveTo(r, 0)
      ctx.lineTo(w - r, 0)
      ctx.arc(w - r, r, r, -Math.PI / 2, 0)
      ctx.lineTo(w, h - r)
      ctx.arc(w - r, h - r, r, 0, Math.PI / 2)
      ctx.lineTo(r, h)
      ctx.arc(r, h - r, r, Math.PI / 2, Math.PI)
      ctx.lineTo(0, r)
      ctx.arc(r, r, r, Math.PI, Math.PI * 1.5)
      break
    }
    case 'triangulo':
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      break
    case 'estrela': {
      const cx = w / 2
      const cy = h / 2
      const externo = Math.min(w, h) / 2
      const interno = externo * 0.5
      const pontas = 5
      for (let i = 0; i < pontas * 2; i++) {
        const raioP = i % 2 === 0 ? externo : interno
        const angulo = -Math.PI / 2 + (i * Math.PI) / pontas
        const px = cx + raioP * Math.cos(angulo)
        const py = cy + raioP * Math.sin(angulo)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      break
    }
    case 'coracao':
      ctx.moveTo(w / 2, h * 0.28)
      ctx.bezierCurveTo(w * 0.42, h * 0.1, w * 0.05, h * 0.18, w * 0.06, h * 0.42)
      ctx.bezierCurveTo(w * 0.06, h * 0.62, w * 0.35, h * 0.78, w / 2, h * 0.94)
      ctx.bezierCurveTo(w * 0.65, h * 0.78, w * 0.94, h * 0.62, w * 0.94, h * 0.42)
      ctx.bezierCurveTo(w * 0.95, h * 0.18, w * 0.58, h * 0.1, w / 2, h * 0.28)
      break
    default:
      ctx.rect(0, 0, w, h)
  }
  ctx.closePath()
}

// ---- Auxiliares de preenchimento/estilo ----

/** Props de preenchimento: sólido ou gradiente, conforme a geometria */
function preenchimentoForma(
  cor: string,
  gradiente: Gradiente | undefined,
  largura: number,
  altura: number,
  centrado: boolean,
): Record<string, unknown> {
  if (!gradiente || gradiente.paradas.length < 2) return { fill: cor }
  const paradas = gradiente.paradas.flatMap((p) => [p.deslocamento, p.cor])
  // Origem local: formas centradas (elipse/estrela) usam (0,0); o resto usa o canto
  const cx = centrado ? 0 : largura / 2
  const cy = centrado ? 0 : altura / 2
  if (gradiente.tipo === 'radial') {
    return {
      fillRadialGradientStartPoint: { x: cx, y: cy },
      fillRadialGradientEndPoint: { x: cx, y: cy },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndRadius: Math.max(largura, altura) / 2,
      fillRadialGradientColorStops: paradas,
    }
  }
  const rad = (gradiente.angulo * Math.PI) / 180
  const dx = Math.cos(rad)
  const dy = Math.sin(rad)
  return {
    fillLinearGradientStartPoint: { x: cx - (dx * largura) / 2, y: cy - (dy * altura) / 2 },
    fillLinearGradientEndPoint: { x: cx + (dx * largura) / 2, y: cy + (dy * altura) / 2 },
    fillLinearGradientColorStops: paradas,
  }
}

/** Konva pinta borda mesmo com espessura 0; retorna undefined nesse caso */
function corBorda(cor: string, espessura: number): string | undefined {
  return espessura > 0 ? cor : undefined
}

function estiloFonte(negrito: boolean, italico: boolean): string {
  const partes = [negrito ? 'bold' : '', italico ? 'italic' : ''].filter(Boolean)
  return partes.length > 0 ? partes.join(' ') : 'normal'
}

/** Converte o modo de mistura para o globalCompositeOperation do canvas */
function composicao(mistura: ModoMistura): GlobalCompositeOperation | undefined {
  return mistura === 'normal' ? undefined : mistura
}
