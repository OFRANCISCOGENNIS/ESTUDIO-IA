// =============================================================
// PainelCamadas — painel de camadas na coluna direita (inferior)
// do editor. Lista os elementos do projeto em ordem visual (topo
// primeiro), permite selecionar, renomear (duplo clique), alternar
// visibilidade e bloqueio, reordenar por arrastar e mover a camada
// selecionada para frente/trás. Só lê/escreve no store — sem Konva.
//
// Observação sobre índices: no array `elementos`, o índice 0 é o
// fundo e o último é o topo. A lista é exibida INVERTIDA, então a
// posição visual `p` (0 = topo) corresponde ao índice de array
// `elementos.length - 1 - p`.
// =============================================================

import { useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import type { Elemento, TipoElemento } from '../../tipos/projeto'

/** Ícone textual/emoji exibido conforme o tipo do elemento */
const ICONES_TIPO: Record<TipoElemento, string> = {
  texto: 'T',
  retangulo: '▭',
  elipse: '◯',
  triangulo: '△',
  estrela: '★',
  linha: '/',
  imagem: '🖼️',
}

export function PainelCamadas() {
  const pagina = usePaginaAtiva()
  const selecionados = useEditorStore((s) => s.selecionados)
  const selecionar = useEditorStore((s) => s.selecionar)
  const alternarSelecao = useEditorStore((s) => s.alternarSelecao)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)
  const reordenarElemento = useEditorStore((s) => s.reordenarElemento)
  const moverCamada = useEditorStore((s) => s.moverCamada)

  // Renomeação inline (duplo clique)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeLocal, setNomeLocal] = useState('')
  // Arrastar para reordenar
  const [idArrastado, setIdArrastado] = useState<string | null>(null)
  const [posicaoAlvo, setPosicaoAlvo] = useState<number | null>(null)

  // ---- Estado vazio (sem projeto ou sem elementos) ----
  if (!pagina || pagina.elementos.length === 0) {
    return (
      <section className="flex h-full flex-col bg-white dark:bg-superficie-900">
        <header className="flex items-center gap-2 border-b border-superficie-200 px-4 py-3 dark:border-superficie-800">
          <span className="text-sm font-semibold text-superficie-900 dark:text-white">
            Camadas
          </span>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <span className="text-3xl opacity-60">🗂️</span>
          <p className="text-sm font-medium text-superficie-700 dark:text-superficie-200">
            Nenhuma camada ainda
          </p>
          <p className="text-xs text-superficie-500 dark:text-superficie-400">
            Adicione elementos ao canvas para vê-los organizados aqui.
          </p>
        </div>
      </section>
    )
  }

  // Lista exibida do topo visual para o fundo (inverte a ordem do array)
  const elementosExibidos = [...pagina.elementos].reverse()
  const idSelecionadoUnico = selecionados.length === 1 ? selecionados[0] : null

  // ---- Ações ----
  const iniciarRenomear = (elemento: Elemento) => {
    setEditandoId(elemento.id)
    setNomeLocal(elemento.nome)
  }

  const confirmarRenomear = (id: string) => {
    const nome = nomeLocal.trim()
    if (nome) atualizarElementos([id], { nome })
    setEditandoId(null)
  }

  const aoClicarLinha = (evento: React.MouseEvent, id: string) => {
    if (evento.shiftKey || evento.ctrlKey || evento.metaKey) {
      alternarSelecao(id)
    } else {
      selecionar([id])
    }
  }

  const aoSoltarNaPosicao = (posicaoVisual: number) => {
    if (idArrastado !== null) {
      // Converte a posição visual (0 = topo) para o índice no array
      const novoIndice = pagina.elementos.length - 1 - posicaoVisual
      reordenarElemento(idArrastado, novoIndice)
    }
    setIdArrastado(null)
    setPosicaoAlvo(null)
  }

  return (
    <section className="flex h-full flex-col bg-white dark:bg-superficie-900">
      {/* Cabeçalho */}
      <header className="flex items-center gap-2 border-b border-superficie-200 px-4 py-3 dark:border-superficie-800">
        <span className="text-sm font-semibold text-superficie-900 dark:text-white">
          Camadas
        </span>
        <span className="rounded-full bg-superficie-100 px-2 py-0.5 text-xs font-medium tabular-nums text-superficie-600 dark:bg-superficie-800 dark:text-superficie-300">
          {pagina.elementos.length}
        </span>
      </header>

      {/* Lista de camadas (ordem visual: topo primeiro) */}
      <ul className="rolagem-fina flex-1 overflow-y-auto p-2">
        {elementosExibidos.map((elemento, posicao) => {
          const selecionado = selecionados.includes(elemento.id)
          const editando = editandoId === elemento.id
          const alvoSolto = idArrastado !== null && posicaoAlvo === posicao

          return (
            <li
              key={elemento.id}
              draggable={!editando}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                setIdArrastado(elemento.id)
              }}
              onDragOver={(e) => {
                if (idArrastado === null) return
                e.preventDefault()
                setPosicaoAlvo(posicao)
              }}
              onDrop={(e) => {
                e.preventDefault()
                aoSoltarNaPosicao(posicao)
              }}
              onDragEnd={() => {
                setIdArrastado(null)
                setPosicaoAlvo(null)
              }}
              onClick={(e) => aoClicarLinha(e, elemento.id)}
              className={`group mb-1 flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 transition ${
                selecionado
                  ? 'border-primaria-200 bg-primaria-50 dark:border-primaria-700 dark:bg-primaria-900'
                  : 'border-transparent hover:bg-superficie-100 dark:hover:bg-superficie-800'
              } ${alvoSolto ? 'ring-2 ring-primaria-400' : ''} ${
                idArrastado === elemento.id ? 'opacity-40' : ''
              }`}
            >
              {/* Ícone do tipo */}
              <span
                aria-hidden="true"
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-superficie-100 text-xs font-bold text-superficie-700 dark:bg-superficie-800 dark:text-superficie-200"
              >
                {ICONES_TIPO[elemento.tipo]}
              </span>

              {/* Nome (duplo clique renomeia) */}
              {editando ? (
                <input
                  autoFocus
                  value={nomeLocal}
                  onChange={(e) => setNomeLocal(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => confirmarRenomear(elemento.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    } else if (e.key === 'Escape') {
                      setEditandoId(null)
                    }
                  }}
                  aria-label="Renomear camada"
                  className="min-w-0 flex-1 rounded-md border border-primaria-400 bg-white px-1.5 py-0.5 text-sm text-superficie-900 outline-none ring-2 ring-primaria-100 dark:bg-superficie-800 dark:text-superficie-100 dark:ring-primaria-900"
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    iniciarRenomear(elemento)
                  }}
                  title="Duplo clique para renomear"
                  className={`min-w-0 flex-1 truncate text-sm ${
                    elemento.visivel
                      ? 'text-superficie-900 dark:text-superficie-100'
                      : 'text-superficie-400 line-through dark:text-superficie-500'
                  }`}
                >
                  {elemento.nome}
                </span>
              )}

              {/* Visibilidade */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  atualizarElementos([elemento.id], { visivel: !elemento.visivel })
                }}
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-xs opacity-60 transition hover:bg-superficie-200 hover:opacity-100 dark:hover:bg-superficie-700"
                title={elemento.visivel ? 'Ocultar camada' : 'Mostrar camada'}
                aria-label={elemento.visivel ? 'Ocultar camada' : 'Mostrar camada'}
              >
                {elemento.visivel ? '👁' : '🚫'}
              </button>

              {/* Bloqueio */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  atualizarElementos([elemento.id], { bloqueado: !elemento.bloqueado })
                }}
                className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-xs opacity-60 transition hover:bg-superficie-200 hover:opacity-100 dark:hover:bg-superficie-700"
                title={elemento.bloqueado ? 'Desbloquear camada' : 'Bloquear camada'}
                aria-label={elemento.bloqueado ? 'Desbloquear camada' : 'Bloquear camada'}
              >
                {elemento.bloqueado ? '🔒' : '🔓'}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Rodapé: mover a camada selecionada */}
      <footer className="grid grid-cols-2 gap-2 border-t border-superficie-200 p-2 dark:border-superficie-800">
        <button
          onClick={() => idSelecionadoUnico && moverCamada(idSelecionadoUnico, 'frente')}
          disabled={!idSelecionadoUnico}
          className="botao-secundario disabled:cursor-not-allowed disabled:opacity-40"
          title="Trazer a camada selecionada uma posição para frente"
        >
          ⬆ Trazer p/ frente
        </button>
        <button
          onClick={() => idSelecionadoUnico && moverCamada(idSelecionadoUnico, 'tras')}
          disabled={!idSelecionadoUnico}
          className="botao-secundario disabled:cursor-not-allowed disabled:opacity-40"
          title="Enviar a camada selecionada uma posição para trás"
        >
          ⬇ Enviar p/ trás
        </button>
      </footer>
    </section>
  )
}
