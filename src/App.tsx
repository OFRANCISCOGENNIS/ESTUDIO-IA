// =============================================================
// App raiz — alterna entre Dashboard e Editor e controla o tema
// claro/escuro (persistido em localStorage).
// =============================================================

import { useCallback, useEffect, useState } from 'react'
import { Dashboard } from './componentes/dashboard/Dashboard'
import { Editor } from './componentes/editor/Editor'
import { useEditorStore } from './estado/useEditorStore'

const CHAVE_TEMA = 'dsp:tema'

export default function App() {
  const projetoAberto = useEditorStore((s) => s.projeto !== null)
  const [temaEscuro, setTemaEscuro] = useState(
    () => localStorage.getItem(CHAVE_TEMA) === 'escuro',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', temaEscuro)
    localStorage.setItem(CHAVE_TEMA, temaEscuro ? 'escuro' : 'claro')
  }, [temaEscuro])

  const alternarTema = useCallback(() => setTemaEscuro((v) => !v), [])

  return projetoAberto ? (
    <Editor temaEscuro={temaEscuro} aoAlternarTema={alternarTema} />
  ) : (
    <Dashboard temaEscuro={temaEscuro} aoAlternarTema={alternarTema} />
  )
}
