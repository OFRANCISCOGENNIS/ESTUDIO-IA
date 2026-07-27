// =============================================================
// DialogoBusca — Localizar e substituir texto em todas as páginas.
// Abre pela paleta de comandos ou Ctrl+F; a substituição é registrada
// no histórico (desfazível com Ctrl+Z).
// =============================================================

import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { useUiStore } from '../../estado/useUiStore'
import { IconeBusca, IconeX } from '../icones/Icones'

export function DialogoBusca() {
  const aberta = useUiStore((s) => s.buscaAberta)
  const fechar = useUiStore((s) => s.fecharBusca)
  const substituirTexto = useEditorStore((s) => s.substituirTexto)
  const projeto = useEditorStore((s) => s.projeto)

  const [busca, setBusca] = useState('')
  const [troca, setTroca] = useState('')
  const [resultado, setResultado] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (aberta) {
      setResultado('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [aberta])

  if (!aberta || !projeto) return null

  // Quantas ocorrências existem hoje (prévia ao digitar)
  const padrao = busca
    ? new RegExp(busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    : null
  const ocorrencias = padrao
    ? projeto.paginas.reduce(
        (soma, p) =>
          soma +
          p.elementos.reduce(
            (s, el) => s + (el.tipo === 'texto' ? (el.texto.match(padrao) ?? []).length : 0),
            0,
          ),
        0,
      )
    : 0

  const executar = () => {
    const trocas = substituirTexto(busca, troca)
    setResultado(
      trocas > 0
        ? `✅ ${trocas} ${trocas === 1 ? 'ocorrência substituída' : 'ocorrências substituídas'}.`
        : 'Nenhuma ocorrência encontrada.',
    )
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-[18vh] backdrop-blur-sm"
      onMouseDown={fechar}
    >
      <div
        role="dialog"
        aria-label="Localizar e substituir"
        className="w-full max-w-md rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] p-5 shadow-flutuante dark:border-superficie-700"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') fechar()
          else if (e.key === 'Enter' && busca) executar()
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-superficie-900 dark:text-white">
            <IconeBusca tamanho={16} /> Localizar e substituir
          </h3>
          <button onClick={fechar} className="botao-icone h-7 w-7" aria-label="Fechar">
            <IconeX tamanho={14} />
          </button>
        </div>

        <label className="rotulo-campo">Localizar</label>
        <input
          ref={inputRef}
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setResultado('')
          }}
          placeholder="Texto a procurar…"
          className="campo-texto mb-1"
        />
        <p className="mb-3 text-xs text-superficie-500">
          {busca
            ? `${ocorrencias} ${ocorrencias === 1 ? 'ocorrência' : 'ocorrências'} em ${projeto.paginas.length} página(s)`
            : 'Busca em todas as páginas, sem diferenciar maiúsculas.'}
        </p>

        <label className="rotulo-campo">Substituir por</label>
        <input
          value={troca}
          onChange={(e) => setTroca(e.target.value)}
          placeholder="Novo texto…"
          className="campo-texto mb-4"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-superficie-600 dark:text-superficie-300">{resultado}</span>
          <button
            onClick={executar}
            disabled={!busca || ocorrencias === 0}
            className="botao-primario shrink-0 disabled:pointer-events-none disabled:opacity-40"
          >
            Substituir tudo
          </button>
        </div>
      </div>
    </div>
  )
}
