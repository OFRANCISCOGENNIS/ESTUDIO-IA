// =============================================================
// App raiz — alterna entre Dashboard e Editor e controla o tema
// claro/escuro (persistido em localStorage).
// =============================================================

import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Dashboard } from './componentes/dashboard/Dashboard'
import { useEditorStore } from './estado/useEditorStore'
import { useProjetosStore } from './estado/useProjetosStore'
import { useColabStore } from './estado/useColabStore'
import { Papel } from './nucleo/colab/tipos'

const CHAVE_TEMA = 'dsp:tema'

/**
 * Tema da primeira visita. A escolha salva sempre manda; sem ela, seguimos
 * o ambiente — o `data-theme` de quem incorpora a página (quando o estúdio
 * roda embutido) e, na falta dele, a preferência do sistema.
 */
function preferenciaInicialEscura(): boolean {
  const salvo = localStorage.getItem(CHAVE_TEMA)
  if (salvo) return salvo === 'escuro'

  const incorporado = document.documentElement.dataset.theme
  if (incorporado) return incorporado === 'dark'

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

// Code splitting: o editor (com o motor de canvas) só carrega quando um
// projeto é aberto — o dashboard fica leve e instantâneo.
const Editor = lazy(() =>
  import('./componentes/editor/Editor').then((m) => ({ default: m.Editor })),
)

/** Tela breve exibida enquanto o chunk do editor carrega */
function CarregandoEditor() {
  return (
    <div className="flex h-screen items-center justify-center bg-superficie-100 dark:bg-superficie-950">
      <div className="flex flex-col items-center gap-3">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-primaria-200 border-t-primaria-500" />
        <p className="text-sm font-medium text-superficie-600 dark:text-superficie-300">
          Abrindo o estúdio…
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const projetoAberto = useEditorStore((s) => s.projeto !== null)
  const [temaEscuro, setTemaEscuro] = useState(preferenciaInicialEscura)

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
    <Suspense fallback={<CarregandoEditor />}>
      <Editor temaEscuro={temaEscuro} aoAlternarTema={alternarTema} />
    </Suspense>
  ) : (
    <Dashboard temaEscuro={temaEscuro} aoAlternarTema={alternarTema} />
  )
}
