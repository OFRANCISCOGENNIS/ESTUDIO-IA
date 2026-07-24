// =============================================================
// CamadaColab — sobreposição (DOM) do canvas para colaboração:
//  - cursores ao vivo dos participantes
//  - pinos de comentário ancorados em pontos do canvas
//  - caixa de digitação de um novo comentário
// Converte coordenadas do canvas para a tela usando zoom e deslocamento
// do editor (mesma fórmula do overlay de texto).
// =============================================================

import { nanoid } from 'nanoid'
import { useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useColabStore } from '../../estado/useColabStore'

export function CamadaColab() {
  const zoom = useEditorStore((s) => s.zoom)
  const deslocamento = useEditorStore((s) => s.deslocamento)
  const adicionarComentario = useEditorStore((s) => s.adicionarComentario)
  const resolverComentario = useEditorStore((s) => s.resolverComentario)
  const removerComentario = useEditorStore((s) => s.removerComentario)

  const pagina = usePaginaAtiva()
  const participantes = useColabStore((s) => s.participantes)
  const usuario = useColabStore((s) => s.usuario)
  const comentarioPendente = useColabStore((s) => s.comentarioPendente)
  const definirComentarioPendente = useColabStore((s) => s.definirComentarioPendente)
  const alternarModoComentario = useColabStore((s) => s.alternarModoComentario)
  const modoComentario = useColabStore((s) => s.modoComentario)

  const [aberto, setAberto] = useState<string | null>(null)
  const [texto, setTexto] = useState('')

  const paraTela = (x: number, y: number) => ({
    left: deslocamento.x + x * zoom,
    top: deslocamento.y + y * zoom,
  })

  const enviarComentario = () => {
    if (!comentarioPendente || !texto.trim()) {
      definirComentarioPendente(null)
      setTexto('')
      return
    }
    adicionarComentario({
      id: nanoid(8),
      elementoId: comentarioPendente.elementoId,
      x: comentarioPendente.x,
      y: comentarioPendente.y,
      autor: usuario.nome,
      cor: usuario.cor,
      texto: texto.trim(),
      criadoEm: new Date().toISOString(),
      resolvido: false,
    })
    setTexto('')
    definirComentarioPendente(null)
    if (modoComentario) alternarModoComentario()
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Cursores dos participantes */}
      {Object.values(participantes).map((p) => (
        <div
          key={p.id}
          className="absolute -translate-y-1 transition-[left,top] duration-75"
          style={{ ...paraTela(p.x, p.y) }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.3))' }}>
            <path d="M2 2l6 14 2.5-5.5L16 8z" fill={p.cor} stroke="#fff" strokeWidth="1" />
          </svg>
          <span
            className="ml-3 whitespace-nowrap rounded px-1.5 py-0.5 text-[0.65rem] font-semibold text-white"
            style={{ backgroundColor: p.cor }}
          >
            {p.nome}
          </span>
        </div>
      ))}

      {/* Pinos de comentário */}
      {pagina?.comentarios.map((c) => (
        <div key={c.id} className="pointer-events-auto absolute" style={{ ...paraTela(c.x, c.y) }}>
          <button
            onClick={() => setAberto((a) => (a === c.id ? null : c.id))}
            className={`flex h-6 w-6 -translate-x-1 -translate-y-6 items-center justify-center rounded-full rounded-bl-none border-2 border-white text-[0.6rem] font-bold text-white shadow-painel transition hover:scale-110 ${
              c.resolvido ? 'opacity-50' : ''
            }`}
            style={{ backgroundColor: c.cor }}
            title={`${c.autor}: ${c.texto}`}
          >
            {c.resolvido ? '✓' : '💬'}
          </button>
          {aberto === c.id && (
            <div className="absolute left-4 top-0 w-56 rounded-lg border border-superficie-200 bg-white p-3 text-left shadow-painel dark:border-superficie-700 dark:bg-superficie-800">
              <p className="mb-1 text-xs font-bold" style={{ color: c.cor }}>{c.autor}</p>
              <p className="mb-2 text-sm text-superficie-800 dark:text-superficie-100">{c.texto}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { resolverComentario(c.id); setAberto(null) }}
                  className="text-xs font-medium text-primaria-600 hover:underline dark:text-primaria-300"
                >
                  {c.resolvido ? 'Reabrir' : 'Resolver'}
                </button>
                <button
                  onClick={() => { removerComentario(c.id); setAberto(null) }}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Caixa de novo comentário */}
      {comentarioPendente && (
        <div
          className="pointer-events-auto absolute w-60 rounded-lg border border-superficie-200 bg-white p-2 shadow-painel dark:border-superficie-700 dark:bg-superficie-800"
          style={{ ...paraTela(comentarioPendente.x, comentarioPendente.y) }}
        >
          <textarea
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario() }
              else if (e.key === 'Escape') { setTexto(''); definirComentarioPendente(null) }
            }}
            rows={2}
            placeholder="Escreva um comentário…"
            className="w-full resize-none rounded border border-superficie-200 bg-transparent p-1.5 text-sm outline-none dark:border-superficie-600"
          />
          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => { setTexto(''); definirComentarioPendente(null) }}
              className="text-xs text-superficie-500 hover:underline"
            >
              Cancelar
            </button>
            <button onClick={enviarComentario} className="botao-primario px-3 py-1 text-xs">
              Comentar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
