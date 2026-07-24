// =============================================================
// Renderiza um Elemento do projeto como um nó Konva.
// Camada de abstração: cada elemento é um <Group> posicionado em
// (x, y) com rotação/opacidade; a forma concreta é desenhada em
// coordenadas locais (origem = canto superior esquerdo do elemento).
// Assim o modelo de transformação é uniforme para todos os tipos e
// o baking de escala (onTransformEnd) fica centralizado.
// =============================================================

import Konva from 'konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { useCallback } from 'react'
import {
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Star,
  Text,
} from 'react-konva'
import { Elemento } from '../../tipos/projeto'
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
  // Ao arrastar, grava a nova posição do grupo
  const aoFinalizarArraste = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      aoAlterar(elemento.id, { x: e.target.x(), y: e.target.y() })
    },
    [aoAlterar, elemento.id],
  )

  // Ao redimensionar/rotacionar, "assa" a escala do grupo de volta
  // nas dimensões concretas do elemento e zera a escala do nó.
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
          fill={elemento.preenchimento}
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
          fill={elemento.preenchimento}
          stroke={corBorda(elemento.corBorda, elemento.espessuraBorda)}
          strokeWidth={elemento.espessuraBorda}
        />
      )
    case 'triangulo':
      return (
        <Line
          points={[elemento.largura / 2, 0, elemento.largura, elemento.altura, 0, elemento.altura]}
          closed
          fill={elemento.preenchimento}
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
          fill={elemento.preenchimento}
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
          // Esconde o texto do canvas enquanto o overlay de edição está ativo
          visible={!emEdicao}
          onDblClick={() => aoEditarTexto(elemento.id)}
          onDblTap={() => aoEditarTexto(elemento.id)}
        />
      )
    case 'imagem':
      return <ImagemKonva elemento={elemento} />
  }
}

function ImagemKonva({
  elemento,
}: {
  elemento: Extract<Elemento, { tipo: 'imagem' }>
}) {
  const imagem = useImagem(elemento.url)
  if (!imagem) {
    // Placeholder enquanto a imagem carrega
    return (
      <Rect
        width={elemento.largura}
        height={elemento.altura}
        fill="#e5e7eb"
        cornerRadius={elemento.raioCanto}
      />
    )
  }
  return (
    <KonvaImage
      image={imagem}
      width={elemento.largura}
      height={elemento.altura}
      cornerRadius={elemento.raioCanto}
    />
  )
}

/** Konva pinta borda mesmo com espessura 0; retorna undefined nesse caso */
function corBorda(cor: string, espessura: number): string | undefined {
  return espessura > 0 ? cor : undefined
}

function estiloFonte(negrito: boolean, italico: boolean): string {
  const partes = [negrito ? 'bold' : '', italico ? 'italic' : ''].filter(Boolean)
  return partes.length > 0 ? partes.join(' ') : 'normal'
}
