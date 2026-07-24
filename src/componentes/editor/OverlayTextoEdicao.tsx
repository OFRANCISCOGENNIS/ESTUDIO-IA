// =============================================================
// OverlayTextoEdicao — edição inline de texto (duplo clique).
// Renderiza um <textarea> transparente exatamente sobre o texto do
// canvas, espelhando fonte, tamanho, cor, alinhamento e rotação,
// para dar a sensação de editar "dentro" do canvas.
// =============================================================

import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'

interface Props {
  zoom: number
  deslocamento: { x: number; y: number }
  aoFechar: () => void
}

export function OverlayTextoEdicao({ zoom, deslocamento, aoFechar }: Props) {
  const projeto = useEditorStore((s) => s.projeto)
  const textoEmEdicao = useEditorStore((s) => s.textoEmEdicao)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)

  const elemento = projeto?.elementos.find((e) => e.id === textoEmEdicao)
  const ehTexto = elemento?.tipo === 'texto' ? elemento : null

  const [valor, setValor] = useState(ehTexto?.texto ?? '')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  // Foca e seleciona todo o conteúdo ao abrir
  useEffect(() => {
    const area = areaRef.current
    if (!area) return
    area.focus()
    area.select()
  }, [])

  if (!ehTexto) return null

  const confirmar = () => {
    atualizarElementos([ehTexto.id], { texto: valor })
    aoFechar()
  }

  const estilo: React.CSSProperties = {
    position: 'absolute',
    left: deslocamento.x + ehTexto.x * zoom,
    top: deslocamento.y + ehTexto.y * zoom,
    width: ehTexto.largura * zoom,
    transform: `rotate(${ehTexto.rotacao}deg)`,
    transformOrigin: '0 0',
    fontFamily: ehTexto.fonte,
    fontSize: ehTexto.tamanhoFonte * zoom,
    fontWeight: ehTexto.negrito ? 700 : 400,
    fontStyle: ehTexto.italico ? 'italic' : 'normal',
    textDecoration: ehTexto.sublinhado ? 'underline' : 'none',
    color: ehTexto.cor,
    textAlign: ehTexto.alinhamento,
    lineHeight: ehTexto.alturaLinha,
    letterSpacing: ehTexto.espacamentoLetras * zoom,
    padding: 0,
    margin: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    resize: 'none',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
  }

  return (
    <textarea
      ref={areaRef}
      value={valor}
      style={estilo}
      onChange={(e) => setValor(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          confirmar()
        }
        // Impede que atalhos globais disparem enquanto se digita
        e.stopPropagation()
      }}
    />
  )
}
