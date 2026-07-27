// =============================================================
// BarraFlutuante — toolbar contextual que paira sobre a seleção
// (docs/PROMPT-UI.md §6.1). Aparece acima do bounding box dos
// elementos selecionados com ações rápidas; some durante o arraste,
// na edição de texto e no modo somente-leitura.
// =============================================================

import { useLayoutEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useColabStore } from '../../estado/useColabStore'
import { useUiStore } from '../../estado/useUiStore'
import { Elemento } from '../../tipos/projeto'

/** Dimensões aproximadas (sem rotação) para o bounding box da seleção */
function dimensoes(el: Elemento): { largura: number; altura: number } {
  if (el.tipo === 'linha' || el.tipo === 'caminho') {
    const xs = el.pontos.filter((_, i) => i % 2 === 0)
    const ys = el.pontos.filter((_, i) => i % 2 === 1)
    return { largura: Math.max(...xs) - Math.min(...xs), altura: Math.max(...ys) - Math.min(...ys) }
  }
  if (el.tipo === 'texto') {
    return { largura: el.largura, altura: el.tamanhoFonte * el.alturaLinha }
  }
  return { largura: el.largura, altura: el.altura }
}

interface AcaoProps {
  titulo: string
  onClick: () => void
  children: React.ReactNode
}

function Acao({ titulo, onClick, children }: AcaoProps) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-superficie-700 transition-[background-color,transform] duration-micro ease-facil-padrao hover:bg-primaria-500/10 hover:text-primaria-600 active:scale-90 dark:text-superficie-200 dark:hover:bg-primaria-500/20"
    >
      {children}
    </button>
  )
}

const Separador = () => <span className="mx-0.5 h-5 w-px bg-superficie-200 dark:bg-superficie-700" />

export function BarraFlutuante() {
  const pagina = usePaginaAtiva()
  const selecionados = useEditorStore((s) => s.selecionados)
  const zoom = useEditorStore((s) => s.zoom)
  const deslocamento = useEditorStore((s) => s.deslocamento)
  const textoEmEdicao = useEditorStore((s) => s.textoEmEdicao)

  const duplicarSelecionados = useEditorStore((s) => s.duplicarSelecionados)
  const removerSelecionados = useEditorStore((s) => s.removerSelecionados)
  const moverCamada = useEditorStore((s) => s.moverCamada)
  const alinharSelecionados = useEditorStore((s) => s.alinharSelecionados)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)

  const arrastando = useUiStore((s) => s.arrastando)
  const podeEditar = useColabStore((s) => s.papel === 'editor')

  const camadaRef = useRef<HTMLDivElement>(null)
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 })

  useLayoutEffect(() => {
    const el = camadaRef.current
    if (!el) return
    const medir = () => setTamanho({ largura: el.clientWidth, altura: el.clientHeight })
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const oculta = !podeEditar || arrastando || textoEmEdicao !== null || selecionados.length === 0

  // Bounding box da seleção em coordenadas de canvas
  const alvos = (pagina?.elementos ?? []).filter((el) => selecionados.includes(el.id))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of alvos) {
    const { largura, altura } = dimensoes(el)
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + largura)
    maxY = Math.max(maxY, el.y + altura)
  }

  return (
    <div ref={camadaRef} className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {!oculta && alvos.length > 0 && Number.isFinite(minX) && (() => {
        const centroTelaX = ((minX + maxX) / 2) * zoom + deslocamento.x
        const topoTela = minY * zoom + deslocamento.y
        const baseTela = maxY * zoom + deslocamento.y
        const acima = topoTela > 56
        const top = acima ? topoTela - 12 : baseTela + 12
        const left = Math.max(96, Math.min(tamanho.largura - 96, centroTelaX))
        return (
          <div
            className="pointer-events-auto absolute flex items-center gap-0.5 rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] p-1 shadow-flutuante dark:border-superficie-700"
            style={{
              left,
              top,
              transform: acima ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
          >
            <Acao titulo="Duplicar (Ctrl+D)" onClick={duplicarSelecionados}>
              <IconeDuplicar />
            </Acao>
            <Acao titulo="Trazer para frente" onClick={() => selecionados.forEach((id) => moverCamada(id, 'frente'))}>
              <IconeFrente />
            </Acao>
            <Acao titulo="Enviar para trás" onClick={() => selecionados.forEach((id) => moverCamada(id, 'tras'))}>
              <IconeTras />
            </Acao>
            <Separador />
            <Acao titulo="Centralizar na horizontal" onClick={() => alinharSelecionados('centroH')}>
              <IconeCentroH />
            </Acao>
            <Acao titulo="Centralizar na vertical" onClick={() => alinharSelecionados('centroV')}>
              <IconeCentroV />
            </Acao>
            <Separador />
            <Acao
              titulo="Bloquear seleção"
              onClick={() => atualizarElementos(selecionados, { bloqueado: true })}
            >
              <IconeCadeado />
            </Acao>
            <Acao titulo="Excluir (Delete)" onClick={removerSelecionados}>
              <IconeLixeira />
            </Acao>
          </div>
        )
      })()}
    </div>
  )
}

// ---- Ícones (SVG stroke, 18px) ----
const svgProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const IconeDuplicar = () => (
  <svg {...svgProps}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </svg>
)
const IconeFrente = () => (
  <svg {...svgProps}>
    <rect x="4" y="4" width="11" height="11" rx="2" />
    <path d="M9 20h9a2 2 0 0 0 2-2V9" />
  </svg>
)
const IconeTras = () => (
  <svg {...svgProps}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 4H6a2 2 0 0 0-2 2v9" />
  </svg>
)
const IconeCentroH = () => (
  <svg {...svgProps}>
    <path d="M12 3v18" />
    <rect x="6" y="8" width="12" height="8" rx="1.5" />
  </svg>
)
const IconeCentroV = () => (
  <svg {...svgProps}>
    <path d="M3 12h18" />
    <rect x="8" y="6" width="8" height="12" rx="1.5" />
  </svg>
)
const IconeCadeado = () => (
  <svg {...svgProps}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
const IconeLixeira = () => (
  <svg {...svgProps}>
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
  </svg>
)
