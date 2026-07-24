// =============================================================
// ModoApresentacao — sobreposição em tela cheia que exibe as páginas
// como slides, com transições, navegação por teclado, tela cheia e
// modo apresentador (notas, cronômetro e prévia do próximo slide).
// =============================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { TransicaoSlide } from '../../tipos/projeto'
import { PalcoApresentacao } from './PalcoApresentacao'

const CLASSE_TRANSICAO: Record<TransicaoSlide, string> = {
  nenhuma: '',
  fade: 'transicao-fade',
  slide: 'transicao-slide',
  zoom: 'transicao-zoom',
}

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0')
  const s = Math.floor(segundos % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function ModoApresentacao() {
  const projeto = useEditorStore((s) => s.projeto)
  const sair = useEditorStore((s) => s.sairApresentacao)

  const [indice, setIndice] = useState(0)
  const [apresentador, setApresentador] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [viewport, setViewport] = useState({ largura: 1280, altura: 720 })

  const total = projeto?.paginas.length ?? 0

  const proximo = useCallback(() => setIndice((i) => Math.min(total - 1, i + 1)), [total])
  const anterior = useCallback(() => setIndice((i) => Math.max(0, i - 1)), [])

  const alternarTelaCheia = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  // Medição da viewport
  useEffect(() => {
    const medir = () => setViewport({ largura: window.innerWidth, altura: window.innerHeight })
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  // Cronômetro do apresentador
  useEffect(() => {
    const id = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Teclado
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault()
          proximo()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          anterior()
          break
        case 'Escape':
          sair()
          break
        case 'f':
        case 'F':
          alternarTelaCheia()
          break
        case 'p':
        case 'P':
          setApresentador((v) => !v)
          break
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [proximo, anterior, sair, alternarTelaCheia])

  // Escala para caber o slide na área disponível
  const escala = useMemo(() => {
    if (!projeto) return 1
    const larguraDisponivel = viewport.largura - (apresentador ? 340 : 0) - 32
    const alturaDisponivel = viewport.altura - 80
    return Math.max(
      0.05,
      Math.min(
        larguraDisponivel / projeto.larguraCanvas,
        alturaDisponivel / projeto.alturaCanvas,
      ),
    )
  }, [projeto, viewport, apresentador])

  if (!projeto) return null
  const pagina = projeto.paginas[Math.min(indice, total - 1)]
  const proximaPagina = projeto.paginas[indice + 1]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Área do slide */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
          <div
            key={indice}
            className={`overflow-hidden rounded-lg shadow-2xl ${CLASSE_TRANSICAO[pagina.transicao]}`}
          >
            <PalcoApresentacao
              pagina={pagina}
              larguraCanvas={projeto.larguraCanvas}
              alturaCanvas={projeto.alturaCanvas}
              escala={escala}
            />
          </div>
        </div>

        {/* Painel do apresentador */}
        {apresentador && (
          <aside className="flex w-[340px] shrink-0 flex-col gap-4 border-l border-neutral-700 bg-neutral-950 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-neutral-400">Cronômetro</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl tabular-nums">{formatarTempo(segundos)}</span>
                <button
                  onClick={() => setSegundos(0)}
                  className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700"
                >
                  Zerar
                </button>
              </div>
            </div>

            <div>
              <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-400">
                Próximo slide
              </span>
              <div className="flex items-center justify-center rounded-lg bg-neutral-800 p-2">
                {proximaPagina ? (
                  <PalcoApresentacao
                    pagina={proximaPagina}
                    larguraCanvas={projeto.larguraCanvas}
                    alturaCanvas={projeto.alturaCanvas}
                    escala={Math.min(
                      280 / projeto.larguraCanvas,
                      160 / projeto.alturaCanvas,
                    )}
                  />
                ) : (
                  <span className="py-8 text-sm text-neutral-500">Fim da apresentação</span>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <span className="mb-1 block text-xs uppercase tracking-wide text-neutral-400">
                Notas
              </span>
              <div className="rolagem-fina flex-1 overflow-y-auto rounded-lg bg-neutral-800 p-3 text-sm leading-relaxed text-neutral-200">
                {pagina.notas.trim() || (
                  <span className="text-neutral-500">Sem notas para este slide.</span>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Barra de controles */}
      <div className="flex h-16 items-center justify-between border-t border-neutral-700 bg-neutral-950 px-4">
        <button
          onClick={sair}
          className="rounded-lg bg-neutral-800 px-3 py-2 text-sm font-medium hover:bg-neutral-700"
          title="Sair (Esc)"
        >
          ✕ Sair
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={anterior}
            disabled={indice === 0}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 disabled:opacity-30"
            title="Anterior (←)"
          >
            ‹
          </button>
          <span className="min-w-16 text-center font-mono text-sm tabular-nums">
            {indice + 1} / {total}
          </span>
          <button
            onClick={proximo}
            disabled={indice >= total - 1}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 disabled:opacity-30"
            title="Próximo (→ ou espaço)"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setApresentador((v) => !v)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              apresentador ? 'bg-primaria-500' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
            title="Modo apresentador (P)"
          >
            🎤 Apresentador
          </button>
          <button
            onClick={alternarTelaCheia}
            className="rounded-lg bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
            title="Tela cheia (F)"
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  )
}
