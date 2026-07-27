// =============================================================
// DialogoAtalhos — modal de atalhos aberto com "?" (§10.3).
// Documenta o teclado do editor em pt-BR. Fecha com Esc ou clique
// fora; devolve o foco a quem estava antes de abrir.
// =============================================================

import { useEffect, useRef } from 'react'
import { useUiStore } from '../../estado/useUiStore'
import { IconeX } from '../icones/Icones'

const GRUPOS: { titulo: string; itens: [string, string][] }[] = [
  {
    titulo: 'Essenciais',
    itens: [
      ['Ctrl/⌘ K', 'Paleta de comandos'],
      ['Ctrl/⌘ F', 'Localizar e substituir'],
      ['?', 'Esta lista de atalhos'],
      ['Ctrl/⌘ S', 'Salvar agora'],
    ],
  },
  {
    titulo: 'Edição',
    itens: [
      ['Ctrl/⌘ Z', 'Desfazer'],
      ['Ctrl/⌘ Y', 'Refazer'],
      ['Ctrl/⌘ C · V · D', 'Copiar · Colar · Duplicar'],
      ['Ctrl/⌘ A', 'Selecionar tudo'],
      ['Ctrl/⌘ G', 'Agrupar'],
      ['Ctrl/⌘ ⇧ G', 'Desagrupar'],
      ['Delete', 'Excluir seleção'],
    ],
  },
  {
    titulo: 'Navegação e canvas',
    itens: [
      ['Tab', 'Percorrer os objetos do canvas'],
      ['Enter', 'Editar o texto focado'],
      ['Esc', 'Sair da edição / limpar seleção'],
      ['Setas', 'Mover 1 px'],
      ['⇧ + Setas', 'Mover 10 px'],
      ['Espaço + arrastar', 'Mover a tela (pan)'],
      ['Roda do mouse', 'Zoom no cursor'],
    ],
  },
  {
    titulo: 'Ferramentas',
    itens: [
      ['V · H', 'Seleção · Mão'],
      ['T', 'Texto'],
      ['R · O · L', 'Retângulo · Elipse · Linha'],
      ['P · B', 'Caneta · Lápis'],
    ],
  },
]

export function DialogoAtalhos() {
  const aberta = useUiStore((s) => s.atalhosAbertos)
  const fechar = useUiStore((s) => s.fecharAtalhos)
  const foco = useRef<HTMLElement | null>(null)
  const refFechar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberta) return
    foco.current = document.activeElement as HTMLElement
    refFechar.current?.focus()
    return () => foco.current?.focus?.()
  }, [aberta])

  if (!aberta) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 py-[8vh] backdrop-blur-sm"
      onMouseDown={fechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atalhos de teclado"
        className="rolagem-fina max-h-full w-full max-w-2xl overflow-y-auto rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] p-6 shadow-flutuante dark:border-superficie-700"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && fechar()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-superficie-900 dark:text-white">
            Atalhos de teclado
          </h2>
          <button
            ref={refFechar}
            onClick={fechar}
            className="botao-icone"
            aria-label="Fechar atalhos"
          >
            <IconeX tamanho={16} />
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {GRUPOS.map((grupo) => (
            <section key={grupo.titulo}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-superficie-500">
                {grupo.titulo}
              </h3>
              <dl className="space-y-1.5">
                {grupo.itens.map(([tecla, acao]) => (
                  <div key={tecla} className="flex items-center justify-between gap-3">
                    <dt className="min-w-0 text-[13px] text-superficie-700 dark:text-superficie-200">
                      {acao}
                    </dt>
                    <dd className="shrink-0">
                      <kbd className="rounded border border-superficie-200 bg-superficie-50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-superficie-600 dark:border-superficie-700 dark:bg-superficie-800 dark:text-superficie-300">
                        {tecla}
                      </kbd>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
