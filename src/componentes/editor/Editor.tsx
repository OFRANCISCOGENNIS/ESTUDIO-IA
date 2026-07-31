// =============================================================
// Editor — layout de 3 zonas do estúdio:
//   barra superior + [barra de ferramentas | canvas | painéis]
// Ativa os atalhos de teclado globais enquanto está montado.
// =============================================================

import { useAtalhosTeclado } from '../../hooks/useAtalhosTeclado'
import { usaBloqueioSolturaFora, usaColagem } from '../../hooks/usaColagem'
import { usaTelaCompacta } from '../../hooks/usaTelaCompacta'
import { useSincronizacaoColab } from '../../hooks/useSincronizacaoColab'
import { useEditorStore } from '../../estado/useEditorStore'
import { useColabStore } from '../../estado/useColabStore'
import { useUiStore } from '../../estado/useUiStore'
import { ModoApresentacao } from '../apresentacao/ModoApresentacao'
import { BarraFerramentas } from './BarraFerramentas'
import { BarraFlutuante } from './BarraFlutuante'
import { BarraPaginas } from './BarraPaginas'
import { BarraSuperior } from './BarraSuperior'
import { CamadaFocoTeclado } from './CamadaFocoTeclado'
import { CanvasEditor } from './CanvasEditor'
import { DialogoAtalhos } from './DialogoAtalhos'
import { DialogoBusca } from './DialogoBusca'
import { PainelAcessibilidade } from './PainelAcessibilidade'
import { PaletaComandos } from './PaletaComandos'
import { PainelCamadas } from './PainelCamadas'
import { PainelPropriedades } from './PainelPropriedades'

interface Props {
  temaEscuro: boolean
  aoAlternarTema: () => void
}

export function Editor({ temaEscuro, aoAlternarTema }: Props) {
  useAtalhosTeclado()
  usaColagem()
  usaBloqueioSolturaFora()
  useSincronizacaoColab()
  const apresentando = useEditorStore((s) => s.apresentando)
  const papel = useColabStore((s) => s.papel)
  const larguraPainel = useUiStore((s) => s.larguraPainel)
  const compacta = usaTelaCompacta()
  const selecionados = useEditorStore((s) => s.selecionados)
  const propriedadesAbertas = useUiStore((s) => s.propriedadesAbertas)
  const abrirPropriedades = useUiStore((s) => s.abrirPropriedades)
  const fecharPropriedades = useUiStore((s) => s.fecharPropriedades)
  const definirLarguraPainel = useUiStore((s) => s.definirLarguraPainel)

  // Arraste da alça esquerda do painel direito (largura persistida no store)
  const iniciarRedimensionamento = (e: React.PointerEvent) => {
    e.preventDefault()
    const mover = (ev: PointerEvent) => definirLarguraPainel(window.innerWidth - ev.clientX)
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

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
            <CamadaFocoTeclado />
            <BarraFlutuante />
            {/* Na tela compacta as propriedades não cabem ao lado do
                canvas; este botão é a única porta de entrada delas. */}
            {compacta && !propriedadesAbertas && (
              <button
                type="button"
                onClick={abrirPropriedades}
                className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-primaria-500 px-4 py-3 text-sm font-semibold text-white shadow-flutuante transition-transform duration-micro active:scale-95"
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                  <circle cx="9" cy="6" r="2" fill="currentColor" />
                  <circle cx="15" cy="12" r="2" fill="currentColor" />
                  <circle cx="7" cy="18" r="2" fill="currentColor" />
                </svg>
                {selecionados.length > 0 ? 'Editar seleção' : 'Propriedades'}
              </button>
            )}
          </div>
          <BarraPaginas />
        </div>
        {/* Fundo que fecha a gaveta ao toque — só quando ela flutua */}
        {compacta && propriedadesAbertas && (
          <button
            type="button"
            aria-label="Fechar propriedades"
            onClick={fecharPropriedades}
            className="fixed inset-0 z-30 bg-superficie-950/40"
          />
        )}

        {(!compacta || propriedadesAbertas) && (
        <aside
          // Em tela compacta vira gaveta sobre o canvas, e só existe no DOM
          // enquanto aberta: mantê-la montada e deslocada para fora somaria
          // à largura do documento e criaria rolagem horizontal.
          className={`relative flex flex-col border-l border-superficie-200 bg-white dark:border-superficie-800 dark:bg-superficie-900 ${
            compacta
              ? 'entra-gaveta fixed bottom-0 right-0 top-0 z-40 w-[min(340px,88vw)] shadow-flutuante'
              : 'shrink-0'
          }`}
          style={compacta ? undefined : { width: larguraPainel }}
        >
          {/* Alça de redimensionamento (borda esquerda do painel).
              Sem sentido na gaveta, que tem largura fixa. */}
          {!compacta && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Redimensionar painel"
              onPointerDown={iniciarRedimensionamento}
              className="group absolute -left-1 top-0 z-10 h-full w-2 cursor-col-resize"
            >
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors duration-micro group-hover:bg-primaria-500/60" />
            </div>
          )}
          {compacta && (
            <button
              type="button"
              onClick={fecharPropriedades}
              className="flex items-center gap-1.5 border-b border-superficie-200 px-4 py-3 text-sm font-semibold text-superficie-700 dark:border-superficie-800 dark:text-superficie-200"
            >
              <span aria-hidden="true">✕</span> Fechar
            </button>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto rolagem-fina">
            <PainelPropriedades />
          </div>
          <div className="h-72 shrink-0 overflow-y-auto rolagem-fina border-t border-superficie-200 dark:border-superficie-800">
            <PainelCamadas />
          </div>
        </aside>
        )}
      </div>
      <PaletaComandos />
      <DialogoBusca />
      <DialogoAtalhos />
      <PainelAcessibilidade />
      {apresentando && <ModoApresentacao />}
    </div>
  )
}
