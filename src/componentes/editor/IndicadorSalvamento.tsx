// =============================================================
// IndicadorSalvamento — máquina de estados visual do auto-save
// (docs/PROMPT-UI.md §7.2 e §11.2):
//   editado → "Alterações não salvas" (cinza, discreto)
//   salvando → micro-spinner 12px
//   salvo → check DESENHADO por stroke-dashoffset (roxo da marca)
// O rótulo "Salvo" some após 2s, deixando só o estado quieto.
// aria-live="polite" para leitores de tela (§10.4).
// =============================================================

import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'

export function IndicadorSalvamento() {
  const estado = useEditorStore((s) => s.estadoSalvamento)
  // Some com o "Salvo ✓" depois de 2s, mas só se nada mudar nesse meio-tempo
  const [recemSalvo, setRecemSalvo] = useState(false)
  const jaSalvouAlgo = useRef(false)

  useEffect(() => {
    if (estado === 'salvando') jaSalvouAlgo.current = true
    if (estado !== 'salvo' || !jaSalvouAlgo.current) return
    setRecemSalvo(true)
    const t = setTimeout(() => setRecemSalvo(false), 2000)
    return () => clearTimeout(t)
  }, [estado])

  const texto =
    estado === 'salvando'
      ? 'Salvando…'
      : estado === 'pendente'
        ? 'Alterações não salvas'
        : recemSalvo
          ? 'Tudo guardado'
          : 'Salvo'

  return (
    <span
      className="hidden items-center gap-1.5 whitespace-nowrap text-xs text-superficie-600 dark:text-superficie-300 md:inline-flex"
      aria-live="polite"
    >
      {estado === 'salvando' ? (
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-superficie-300 border-t-primaria-500 dark:border-superficie-600 dark:border-t-primaria-400"
        />
      ) : estado === 'salvo' ? (
        <svg
          aria-hidden="true"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primaria-500 dark:text-primaria-400"
        >
          {/* pathLength normaliza o traço: 1 unidade = caminho inteiro */}
          <path d="m5 12.5 4.5 4.5L19 7" pathLength={1} className="traco-check" />
        </svg>
      ) : (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-superficie-400 dark:bg-superficie-500"
        />
      )}
      {texto}
    </span>
  )
}
