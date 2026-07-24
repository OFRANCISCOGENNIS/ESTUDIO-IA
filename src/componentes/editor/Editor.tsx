// =============================================================
// Editor — layout de 3 zonas do estúdio:
//   barra superior + [barra de ferramentas | canvas | painéis]
// Ativa os atalhos de teclado globais enquanto está montado.
// =============================================================

import { useAtalhosTeclado } from '../../hooks/useAtalhosTeclado'
import { BarraFerramentas } from './BarraFerramentas'
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

  return (
    <div className="flex h-screen flex-col bg-superficie-100 dark:bg-superficie-950">
      <BarraSuperior temaEscuro={temaEscuro} aoAlternarTema={aoAlternarTema} />
      <div className="flex flex-1 overflow-hidden">
        <BarraFerramentas />
        <div className="relative flex-1 overflow-hidden">
          <CanvasEditor />
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
    </div>
  )
}
