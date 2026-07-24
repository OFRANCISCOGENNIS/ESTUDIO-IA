// =============================================================
// PalcoApresentacao — renderiza um slide (página) em um Stage Konva
// somente-leitura, escalado para caber na tela. Reutiliza o mesmo
// ElementoKonva do editor (fidelidade total) e toca as animações de
// entrada por elemento ao montar (o pai troca a `key` a cada slide).
// =============================================================

import Konva from 'konva'
import { useEffect, useRef, type ReactNode } from 'react'
import { Group, Layer, Rect, Stage } from 'react-konva'
import { ElementoKonva } from '../editor/ElementoKonva'
import { AnimacaoEntrada, Pagina, TipoAnimacao } from '../../tipos/projeto'

const semAcao = () => {}

interface EstadoInicial {
  opacity: number
  x: number
  y: number
  rotation: number
  scale: number
}

/** Estado inicial (antes da animação) conforme o tipo */
function estadoInicial(tipo: TipoAnimacao, largura: number, altura: number): EstadoInicial {
  switch (tipo) {
    case 'fade':
      return { opacity: 0, x: 0, y: 0, rotation: 0, scale: 1 }
    case 'rise':
      return { opacity: 0, x: 0, y: altura * 0.06, rotation: 0, scale: 1 }
    case 'pan':
      return { opacity: 0, x: -largura * 0.08, y: 0, rotation: 0, scale: 1 }
    case 'tumble':
      return { opacity: 0, x: 0, y: 0, rotation: -14, scale: 0.85 }
    default:
      return { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1 }
  }
}

/** Envolve um elemento e anima sua entrada ao montar */
function GrupoAnimado({
  animacao,
  largura,
  altura,
  children,
}: {
  animacao: AnimacaoEntrada
  largura: number
  altura: number
  children: ReactNode
}) {
  const ref = useRef<Konva.Group>(null)

  useEffect(() => {
    const no = ref.current
    if (!no) return
    if (animacao.tipo === 'nenhuma') return
    const ini = estadoInicial(animacao.tipo, largura, altura)
    no.opacity(ini.opacity)
    no.position({ x: ini.x, y: ini.y })
    no.rotation(ini.rotation)
    no.scale({ x: ini.scale, y: ini.scale })
    const tween = new Konva.Tween({
      node: no,
      duration: Math.max(0.1, animacao.duracao / 1000),
      opacity: 1,
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      easing: Konva.Easings.EaseOut,
    })
    const t = setTimeout(() => tween.play(), animacao.atraso)
    return () => {
      clearTimeout(t)
      tween.destroy()
    }
  }, [animacao.tipo, animacao.atraso, animacao.duracao, largura, altura])

  return <Group ref={ref}>{children}</Group>
}

interface Props {
  pagina: Pagina
  larguraCanvas: number
  alturaCanvas: number
  escala: number
}

export function PalcoApresentacao({ pagina, larguraCanvas, alturaCanvas, escala }: Props) {
  return (
    <Stage
      width={larguraCanvas * escala}
      height={alturaCanvas * escala}
      scaleX={escala}
      scaleY={escala}
      listening={false}
    >
      <Layer listening={false}>
        <Rect x={0} y={0} width={larguraCanvas} height={alturaCanvas} fill={pagina.corFundo} />
        {pagina.elementos.map((elemento) => (
          <GrupoAnimado
            key={elemento.id}
            animacao={elemento.animacao}
            largura={larguraCanvas}
            altura={alturaCanvas}
          >
            <ElementoKonva
              elemento={elemento}
              emEdicao={false}
              registrarNo={semAcao}
              aoSelecionar={semAcao}
              aoAlterar={semAcao}
              aoEditarTexto={semAcao}
            />
          </GrupoAnimado>
        ))}
      </Layer>
    </Stage>
  )
}
