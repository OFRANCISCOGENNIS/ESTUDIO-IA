// =============================================================
// Editor — layout de 3 zonas do estúdio:
//   barra superior + [barra de ferramentas | canvas | painéis]
// Ativa os atalhos de teclado globais enquanto está montado.
// =============================================================

import { useAtalhosTeclado } from '../../hooks/useAtalhosTeclado'
import { useSincronizacaoColab } from '../../hooks/useSincronizacaoColab'
import { useEditorStore } from '../../estado/useEditorStore'
import { useColabStore } from '../../estado/useColabStore'
import { ModoApresentacao } from '../apresentacao/ModoApresentacao'
import { BarraFerramentas } from './BarraFerramentas'
import { BarraPaginas } from './BarraPaginas'
import { BarraSuperior } from './BarraSuperior'
import { CanvasEditor } from './CanvasEditor'
import { PainelCamadas } from './PainelCamadas'
import { PainelPropriedades } from './PainelPropriedades'

interface Props {
  temaEscuro: boolean
  aoAlternarTema: () => void
}

export function Editor({ temaEscuro, aoAlternarTema }: Props) {
  useAtalhosTeclado()
  useSincronizacaoColab()
  const apresentando = useEditorStore((s) => s.apresentando)
  const papel = useColabStore((s) => s.papel)

  return (
    <div className="flex h-screen flex-col bg-superficie-100 dark:bg-superficie-950">
      <BarraSuperior temaEscuro={temaEscuro} aoAlternarTema={aoAlternarTema} />
      {papel !== 'editor' && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {papel === 'viewer'
            ? '👁 Modo somente leitura — você não pode editar este design.'
            : '💬 Modo comentário — você pode comentar, mas não editar.'}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <BarraFerramentas />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden">
            <CanvasEditor />
          </div>
          <BarraPaginas />
        </div>
        <aside className="flex w-72 flex-col border-l border-superficie-200 bg-white dark:border-superficie-800 dark:bg-superficie-900">
          <div className="min-h-0 flex-1 overflow-y-auto rolagem-fina">
            <PainelPropriedades />
          </div>
          <div className="h-72 shrink-0 overflow-y-auto rolagem-fina border-t border-superficie-200 dark:border-superficie-800">
            <PainelCamadas />
          </div>
        </aside>
      </div>
      {apresentando && <ModoApresentacao />}
    </div>
  )
}
