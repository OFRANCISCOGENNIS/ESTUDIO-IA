// =============================================================
// PaletaComandos — paleta de comandos estilo Cmd+K (docs/PROMPT-UI.md §6.3).
// Abre com Ctrl/Cmd+K, busca difusa por subsequência, navegação por
// teclado (↑ ↓ Enter) e execução de ações do editor. Mount único no
// Editor; controla-se via useUiStore.
// =============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { useUiStore } from '../../estado/useUiStore'
import { criarForma, criarGrafico, criarLinha, criarTabela, criarTexto } from '../../nucleo/elementos'

interface Comando {
  id: string
  titulo: string
  secao: string
  atalho?: string
  /** Desativa o comando (ex.: sem seleção) sem tirá-lo da lista */
  inativo?: boolean
  executar: () => void
}

/** Minúsculas sem acentos, para busca insensível a diacríticos (pt-BR) */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Busca difusa: todos os caracteres da consulta aparecem na ordem no texto */
function combina(consulta: string, texto: string): boolean {
  const q = normalizar(consulta.trim())
  if (!q) return true
  const t = normalizar(texto)
  let i = 0
  for (const c of t) {
    if (c === q[i]) i++
    if (i === q.length) return true
  }
  return false
}

export function PaletaComandos() {
  const aberta = useUiStore((s) => s.paletaAberta)
  const fechar = useUiStore((s) => s.fecharPaleta)
  const alternar = useUiStore((s) => s.alternarPaleta)
  const definirAba = useUiStore((s) => s.definirAba)

  const projeto = useEditorStore((s) => s.projeto)
  const selecionados = useEditorStore((s) => s.selecionados)
  const adicionarElemento = useEditorStore((s) => s.adicionarElemento)
  const definirTextoEmEdicao = useEditorStore((s) => s.definirTextoEmEdicao)
  const duplicarSelecionados = useEditorStore((s) => s.duplicarSelecionados)
  const removerSelecionados = useEditorStore((s) => s.removerSelecionados)
  const moverCamada = useEditorStore((s) => s.moverCamada)
  const alinharSelecionados = useEditorStore((s) => s.alinharSelecionados)
  const adicionarPagina = useEditorStore((s) => s.adicionarPagina)
  const duplicarPagina = useEditorStore((s) => s.duplicarPagina)
  const paginaAtivaId = useEditorStore((s) => s.paginaAtivaId)
  const iniciarApresentacao = useEditorStore((s) => s.iniciarApresentacao)
  const definirZoom = useEditorStore((s) => s.definirZoom)
  const desfazer = useEditorStore((s) => s.desfazer)
  const refazer = useEditorStore((s) => s.refazer)

  const [consulta, setConsulta] = useState('')
  const [ativo, setAtivo] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  // Atalho global Ctrl/Cmd+K
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        alternar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [alternar])

  // Ao abrir: limpa a consulta e foca o campo
  useEffect(() => {
    if (aberta) {
      setConsulta('')
      setAtivo(0)
      // Aguarda o próximo frame para o input existir no DOM
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [aberta])

  const temSelecao = selecionados.length > 0

  const comandos = useMemo<Comando[]>(() => {
    const cx = (largura: number) => (projeto ? projeto.larguraCanvas / 2 - largura / 2 : 0)
    const cy = (altura: number) => (projeto ? projeto.alturaCanvas / 2 - altura / 2 : 0)
    const irParaAba = (aba: string) => () => {
      definirAba(aba)
      fechar()
    }

    return [
      // ---- Inserir ----
      { id: 'ins-retangulo', secao: 'Inserir', titulo: 'Retângulo', executar: () => adicionarElemento(criarForma('retangulo', cx(200), cy(150))) },
      { id: 'ins-elipse', secao: 'Inserir', titulo: 'Elipse', executar: () => adicionarElemento(criarForma('elipse', cx(200), cy(150))) },
      { id: 'ins-triangulo', secao: 'Inserir', titulo: 'Triângulo', executar: () => adicionarElemento(criarForma('triangulo', cx(200), cy(150))) },
      { id: 'ins-estrela', secao: 'Inserir', titulo: 'Estrela', executar: () => adicionarElemento(criarForma('estrela', cx(200), cy(200))) },
      { id: 'ins-linha', secao: 'Inserir', titulo: 'Linha', executar: () => adicionarElemento(criarLinha(cx(240), projeto ? projeto.alturaCanvas / 2 : 0)) },
      {
        id: 'ins-texto', secao: 'Inserir', titulo: 'Caixa de texto',
        executar: () => {
          const t = criarTexto(cx(480), cy(60), { texto: 'Seu texto' })
          adicionarElemento(t)
          definirTextoEmEdicao(t.id)
        },
      },
      { id: 'ins-grafico', secao: 'Inserir', titulo: 'Gráfico', executar: () => adicionarElemento(criarGrafico(cx(480), cy(320))) },
      { id: 'ins-tabela', secao: 'Inserir', titulo: 'Tabela', executar: () => adicionarElemento(criarTabela(cx(520), cy(180))) },

      // ---- Navegar (abre a aba da barra de ferramentas) ----
      { id: 'nav-templates', secao: 'Ir para', titulo: 'Templates', executar: irParaAba('Templates') },
      { id: 'nav-elementos', secao: 'Ir para', titulo: 'Elementos', executar: irParaAba('Elementos') },
      { id: 'nav-texto', secao: 'Ir para', titulo: 'Texto', executar: irParaAba('Texto') },
      { id: 'nav-uploads', secao: 'Ir para', titulo: 'Uploads', executar: irParaAba('Uploads') },
      { id: 'nav-fotos', secao: 'Ir para', titulo: 'Fotos', executar: irParaAba('Fotos') },
      { id: 'nav-ia', secao: 'Ir para', titulo: 'Assistente de IA', executar: irParaAba('IA') },
      { id: 'nav-marca', secao: 'Ir para', titulo: 'Kit de marca', executar: irParaAba('Marca') },
      { id: 'nav-colaborar', secao: 'Ir para', titulo: 'Colaborar', executar: irParaAba('Colaborar') },

      // ---- Organizar (dependem de seleção) ----
      { id: 'org-duplicar', secao: 'Organizar', titulo: 'Duplicar seleção', atalho: 'Ctrl+D', inativo: !temSelecao, executar: duplicarSelecionados },
      { id: 'org-excluir', secao: 'Organizar', titulo: 'Excluir seleção', atalho: 'Del', inativo: !temSelecao, executar: removerSelecionados },
      { id: 'org-frente', secao: 'Organizar', titulo: 'Trazer para frente', inativo: !temSelecao, executar: () => selecionados.forEach((id) => moverCamada(id, 'frente')) },
      { id: 'org-tras', secao: 'Organizar', titulo: 'Enviar para trás', inativo: !temSelecao, executar: () => selecionados.forEach((id) => moverCamada(id, 'tras')) },
      { id: 'org-centroH', secao: 'Organizar', titulo: 'Centralizar na horizontal', inativo: !temSelecao, executar: () => alinharSelecionados('centroH') },
      { id: 'org-centroV', secao: 'Organizar', titulo: 'Centralizar na vertical', inativo: !temSelecao, executar: () => alinharSelecionados('centroV') },

      // ---- Página ----
      { id: 'pag-nova', secao: 'Página', titulo: 'Nova página', executar: adicionarPagina },
      { id: 'pag-duplicar', secao: 'Página', titulo: 'Duplicar página atual', executar: () => duplicarPagina(paginaAtivaId) },

      // ---- Visualizar / Histórico ----
      { id: 'vis-apresentar', secao: 'Visualizar', titulo: 'Iniciar apresentação', executar: iniciarApresentacao },
      { id: 'vis-zoom100', secao: 'Visualizar', titulo: 'Zoom 100%', executar: () => definirZoom(1) },
      { id: 'hist-desfazer', secao: 'Histórico', titulo: 'Desfazer', atalho: 'Ctrl+Z', executar: desfazer },
      { id: 'hist-refazer', secao: 'Histórico', titulo: 'Refazer', atalho: 'Ctrl+Y', executar: refazer },
    ]
  }, [
    projeto, temSelecao, selecionados, paginaAtivaId,
    definirAba, fechar, adicionarElemento, definirTextoEmEdicao,
    duplicarSelecionados, removerSelecionados, moverCamada, alinharSelecionados,
    adicionarPagina, duplicarPagina, iniciarApresentacao, definirZoom, desfazer, refazer,
  ])

  const filtrados = useMemo(
    () => comandos.filter((c) => combina(consulta, `${c.titulo} ${c.secao}`)),
    [comandos, consulta],
  )

  // Mantém o índice ativo dentro dos limites quando a lista muda
  useEffect(() => {
    setAtivo((i) => Math.max(0, Math.min(i, filtrados.length - 1)))
  }, [filtrados.length])

  if (!aberta) return null

  const executar = (c: Comando | undefined) => {
    if (!c || c.inativo) return
    c.executar()
    fechar()
  }

  const aoTeclarCampo = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAtivo((i) => Math.min(filtrados.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setAtivo((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executar(filtrados[ativo])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      fechar()
    }
  }

  // Rótulo de seção só antes do primeiro item daquela seção
  let secaoAnterior = ''

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={fechar}
    >
      <div
        role="dialog"
        aria-label="Paleta de comandos"
        className="animate-[surgir_180ms_var(--facil-saida)] w-full max-w-[560px] overflow-hidden rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] shadow-flutuante dark:border-superficie-700"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-superficie-200 px-4 dark:border-superficie-800">
          <span className="text-superficie-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            ref={inputRef}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value)
              setAtivo(0)
            }}
            onKeyDown={aoTeclarCampo}
            placeholder="Buscar comandos…"
            className="flex-1 bg-transparent py-3.5 text-sm text-superficie-900 outline-none placeholder:text-superficie-500 dark:text-superficie-100"
          />
          <kbd className="rounded border border-superficie-200 px-1.5 py-0.5 text-[10px] font-medium text-superficie-500 dark:border-superficie-700">
            ESC
          </kbd>
        </div>

        <div ref={listaRef} className="rolagem-fina max-h-[340px] overflow-y-auto p-1.5">
          {filtrados.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-superficie-500">
              Nenhum comando encontrado.
            </p>
          ) : (
            filtrados.map((c, i) => {
              const mostrarSecao = c.secao !== secaoAnterior
              secaoAnterior = c.secao
              const selecionado = i === ativo
              return (
                <div key={c.id}>
                  {mostrarSecao && (
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-superficie-500">
                      {c.secao}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={c.inativo}
                    onMouseEnter={() => setAtivo(i)}
                    onClick={() => executar(c)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-micro ${
                      c.inativo
                        ? 'cursor-not-allowed text-superficie-400 dark:text-superficie-600'
                        : selecionado
                          ? 'bg-primaria-500 text-white'
                          : 'text-superficie-800 dark:text-superficie-100'
                    }`}
                  >
                    <span>{c.titulo}</span>
                    {c.atalho && (
                      <kbd
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          selecionado ? 'bg-white/20 text-white' : 'bg-superficie-100 text-superficie-500 dark:bg-superficie-800'
                        }`}
                      >
                        {c.atalho}
                      </kbd>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
