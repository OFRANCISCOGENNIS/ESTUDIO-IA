// =============================================================
// App raiz — alterna entre Dashboard e Editor e controla o tema
// claro/escuro (persistido em localStorage).
// =============================================================

import { useCallback, useEffect, useState } from 'react'
import { Dashboard } from './componentes/dashboard/Dashboard'
import { Editor } from './componentes/editor/Editor'
import { useEditorStore } from './estado/useEditorStore'
import { useProjetosStore } from './estado/useProjetosStore'
import { useColabStore } from './estado/useColabStore'
import { Papel } from './nucleo/colab/tipos'

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

  // Link de compartilhamento: #p=<projetoId>&papel=<papel> — abre o
  // projeto com o papel indicado e entra na sessão de colaboração.
  useEffect(() => {
    const hash = window.location.hash
    const idMatch = /p=([^&]+)/.exec(hash)
    if (!idMatch) return
    const projetoId = decodeURIComponent(idMatch[1])
    const papelMatch = /papel=(editor|commenter|viewer)/.exec(hash)
    const papel = (papelMatch?.[1] as Papel) ?? 'editor'
    const projeto = useProjetosStore.getState().carregarProjeto(projetoId)
    if (projeto) {
      useEditorStore.getState().abrirProjeto(projeto)
      useColabStore.getState().definirPapel(papel)
      useColabStore.getState().conectar(projetoId)
    }
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const alternarTema = useCallback(() => setTemaEscuro((v) => !v), [])

  return projetoAberto ? (
    <Editor temaEscuro={temaEscuro} aoAlternarTema={alternarTema} />
  ) : (
    <Dashboard temaEscuro={temaEscuro} aoAlternarTema={alternarTema} />
  )
}
