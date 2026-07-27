// =============================================================
// PainelAcessibilidade — verificador de contraste WCAG da página
// ativa (estilo Canva Pro). Lista textos com contraste insuficiente
// contra o fundo real atrás deles e permite selecioná-los no canvas.
// =============================================================

import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useUiStore } from '../../estado/useUiStore'
import { verificarContraste } from '../../nucleo/acessibilidade'
import { IconeAcessivel, IconeX } from '../icones/Icones'

export function PainelAcessibilidade() {
  const aberta = useUiStore((s) => s.acessibilidadeAberta)
  const fechar = useUiStore((s) => s.fecharAcessibilidade)
  const pagina = usePaginaAtiva()
  const selecionar = useEditorStore((s) => s.selecionar)

  if (!aberta || !pagina) return null

  const avisos = verificarContraste(pagina)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={fechar}
    >
      <div
        role="dialog"
        aria-label="Verificação de acessibilidade"
        className="w-full max-w-lg rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] p-5 shadow-flutuante dark:border-superficie-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-superficie-900 dark:text-white">
            <IconeAcessivel tamanho={16} /> Acessibilidade — contraste (WCAG)
          </h3>
          <button onClick={fechar} className="botao-icone h-7 w-7" aria-label="Fechar">
            <IconeX tamanho={14} />
          </button>
        </div>

        {avisos.length === 0 ? (
          <div className="rounded-xl2 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">
            ✅ Todos os textos desta página têm contraste suficiente
            (mínimo 4.5:1 — ou 3:1 para textos grandes).
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-superficie-600 dark:text-superficie-300">
              {avisos.length} {avisos.length === 1 ? 'texto precisa' : 'textos precisam'} de mais
              contraste. Clique para selecionar no canvas e ajustar a cor.
            </p>
            <ul className="rolagem-fina max-h-72 space-y-2 overflow-y-auto">
              {avisos.map((aviso) => (
                <li key={aviso.elementoId}>
                  <button
                    onClick={() => {
                      selecionar([aviso.elementoId])
                      fechar()
                    }}
                    className="flex w-full items-center gap-3 rounded-xl2 border border-superficie-200 p-3 text-left transition hover:border-primaria-300 hover:bg-primaria-50 dark:border-superficie-700 dark:hover:bg-superficie-800"
                  >
                    <span
                      className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-superficie-200 text-sm font-bold dark:border-superficie-700"
                      style={{ backgroundColor: aviso.corFundo, color: aviso.corTexto }}
                    >
                      Aa
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">
                        {aviso.texto || aviso.nome}
                      </span>
                      <span className="block text-xs text-superficie-600 dark:text-superficie-300">
                        contraste {aviso.razao.toFixed(2)}:1 · mínimo {aviso.minimo}:1
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      Baixo
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
