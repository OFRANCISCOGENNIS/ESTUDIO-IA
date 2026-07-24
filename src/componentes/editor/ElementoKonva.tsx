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
import { useCallback, useEffect, useRef } from 'react'
import {
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Star,
  Text,
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

const DIMENSAO_MINIMA = 5

interface Props {
  elemento: Elemento
  emEdicao: boolean
  registrarNo: (id: string, no: Konva.Node | null) => void
  aoSelecionar: (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => void
  aoAlterar: (id: string, mudancas: Partial<Elemento>) => void
  aoEditarTexto: (id: string) => void
}

export function ElementoKonva({
  elemento,
  emEdicao,
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

  const propsGrupo = {
    ref: (no: Konva.Node | null) => registrarNo(elemento.id, no),
    x: elemento.x,
    y: elemento.y,
    rotation: elemento.rotacao,
    opacity: elemento.opacidade,
    visible: elemento.visivel,
    draggable: !elemento.bloqueado,
    globalCompositeOperation: composicao(elemento.mistura),
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
    case 'texto':
      return (
        <Text
          text={elemento.texto}
          width={elemento.largura}
          fontSize={elemento.tamanhoFonte}
          fontFamily={elemento.fonte}
          fontStyle={estiloFonte(elemento.negrito, elemento.italico)}
          textDecoration={elemento.sublinhado ? 'underline' : ''}
          fill={elemento.cor}
          align={elemento.alinhamento}
          lineHeight={elemento.alturaLinha}
          letterSpacing={elemento.espacamentoLetras}
          visible={!emEdicao}
          onDblClick={() => aoEditarTexto(elemento.id)}
          onDblTap={() => aoEditarTexto(elemento.id)}
        />
      )
    case 'imagem':
      return <ImagemKonva elemento={elemento} />
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
