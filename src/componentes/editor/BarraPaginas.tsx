// =============================================================
// BarraPaginas — navegador de páginas/pranchetas (rodapé do canvas).
// Permite trocar de página, adicionar, duplicar, remover e renomear
// (duplo clique). Todas as páginas compartilham o tamanho do artboard.
// =============================================================

import { useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'

export function BarraPaginas() {
  const projeto = useEditorStore((s) => s.projeto)
  const paginaAtivaId = useEditorStore((s) => s.paginaAtivaId)
  const selecionarPagina = useEditorStore((s) => s.selecionarPagina)
  const adicionarPagina = useEditorStore((s) => s.adicionarPagina)
  const duplicarPagina = useEditorStore((s) => s.duplicarPagina)
  const removerPagina = useEditorStore((s) => s.removerPagina)
  const renomearPagina = useEditorStore((s) => s.renomearPagina)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeLocal, setNomeLocal] = useState('')

  if (!projeto) return null
  const podeRemover = projeto.paginas.length > 1

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 overflow-x-auto rolagem-fina border-t border-superficie-200 bg-white px-3 dark:border-superficie-800 dark:bg-superficie-900">
      <span className="shrink-0 text-xs font-medium text-superficie-500 dark:text-superficie-400">
        Páginas
      </span>

      {projeto.paginas.map((pagina, indice) => {
        const ativa = pagina.id === paginaAtivaId
        const editando = editandoId === pagina.id
        return (
          <div
            key={pagina.id}
            className={`flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 transition ${
              ativa
                ? 'border-primaria-400 bg-primaria-50 dark:border-primaria-600 dark:bg-primaria-900'
                : 'border-superficie-200 hover:bg-superficie-100 dark:border-superficie-700 dark:hover:bg-superficie-800'
            }`}
          >
            {editando ? (
              <input
                autoFocus
                value={nomeLocal}
                onChange={(e) => setNomeLocal(e.target.value)}
                onBlur={() => {
                  renomearPagina(pagina.id, nomeLocal)
                  setEditandoId(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  else if (e.key === 'Escape') setEditandoId(null)
                }}
                className="w-24 rounded border border-primaria-400 bg-white px-1 py-0.5 text-xs outline-none dark:bg-superficie-800 dark:text-superficie-100"
                aria-label="Renomear página"
              />
            ) : (
              <button
                type="button"
                onClick={() => selecionarPagina(pagina.id)}
                onDoubleClick={() => {
                  setEditandoId(pagina.id)
                  setNomeLocal(pagina.nome)
                }}
                className={`text-xs font-medium ${
                  ativa
                    ? 'text-primaria-700 dark:text-primaria-200'
                    : 'text-superficie-700 dark:text-superficie-200'
                }`}
                title="Clique para abrir · duplo clique para renomear"
              >
                {indice + 1}. {pagina.nome}
              </button>
            )}
            {ativa && (
              <>
                <button
                  type="button"
                  onClick={() => duplicarPagina(pagina.id)}
                  className="flex h-5 w-5 items-center justify-center rounded text-xs text-superficie-500 hover:bg-superficie-200 dark:hover:bg-superficie-700"
                  title="Duplicar página"
                  aria-label="Duplicar página"
                >
                  ⧉
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (podeRemover && confirm(`Remover "${pagina.nome}"?`)) removerPagina(pagina.id)
                  }}
                  disabled={!podeRemover}
                  className="flex h-5 w-5 items-center justify-center rounded text-xs text-superficie-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-900/40"
                  title={podeRemover ? 'Remover página' : 'O projeto precisa de ao menos uma página'}
                  aria-label="Remover página"
                >
                  🗑
                </button>
              </>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={adicionarPagina}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-superficie-100 px-3 py-1.5 text-xs font-semibold text-superficie-700 transition hover:bg-superficie-200 dark:bg-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-700"
        title="Adicionar página"
      >
        ✚ Página
      </button>
    </div>
  )
}
