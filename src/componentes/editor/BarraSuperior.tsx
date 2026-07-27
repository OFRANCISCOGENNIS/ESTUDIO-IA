// =============================================================
// BarraSuperior — barra fixa no topo do editor. Reúne navegação
// (voltar ao dashboard), nome editável do projeto, desfazer/
// refazer, indicador de auto-save, controle de zoom, tema e o
// menu de exportação (Baixar). Só lê/escreve no store — não
// depende do Konva.
// =============================================================

import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { useProjetosStore } from '../../estado/useProjetosStore'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { useUiStore } from '../../estado/useUiStore'
import { recursoLiberado } from '../../dados/planos'
import { tempoRelativo } from '../../utilitarios/tempo'
import {
  IconeCompartilhar,
  IconeDesfazer,
  IconeDownload,
  IconeEncaixar,
  IconeLua,
  IconeMais,
  IconeMenos,
  IconePlay,
  IconeRefazer,
  IconeSetaEsquerda,
  IconeSol,
} from '../icones/Icones'
import {
  baixarDataUrl,
  exportarDataUrl,
  nomeArquivoExportacao,
  type FormatoExportacao,
} from '../../nucleo/exportacao'
import { exportarPdf, exportarPptx, exportarSvg } from '../../nucleo/exportadores/documento'

interface Props {
  temaEscuro: boolean
  aoAlternarTema: () => void
}

/** Escalas de exportação disponíveis no menu Baixar */
const ESCALAS = [1, 2, 3]

export function BarraSuperior({ temaEscuro, aoAlternarTema }: Props) {
  const projeto = useEditorStore((s) => s.projeto)
  const paginaAtivaId = useEditorStore((s) => s.paginaAtivaId)
  const selecionarPagina = useEditorStore((s) => s.selecionarPagina)
  const abrirProjeto = useEditorStore((s) => s.abrirProjeto)
  const resumos = useProjetosStore((s) => s.resumos)
  const carregarProjeto = useProjetosStore((s) => s.carregarProjeto)
  const zoom = useEditorStore((s) => s.zoom)
  const estadoSalvamento = useEditorStore((s) => s.estadoSalvamento)
  const podeDesfazer = useEditorStore((s) => s.podeDesfazer)
  const podeRefazer = useEditorStore((s) => s.podeRefazer)
  const fecharProjeto = useEditorStore((s) => s.fecharProjeto)
  const renomearProjeto = useEditorStore((s) => s.renomearProjeto)
  const desfazer = useEditorStore((s) => s.desfazer)
  const refazer = useEditorStore((s) => s.refazer)
  const definirZoom = useEditorStore((s) => s.definirZoom)
  const iniciarApresentacao = useEditorStore((s) => s.iniciarApresentacao)
  const plano = usePlanoStore((s) => s.plano)
  const solicitarEncaixe = useUiStore((s) => s.solicitarEncaixe)
  const definirAba = useUiStore((s) => s.definirAba)

  // Nome em edição inline (espelha o nome do projeto)
  const [nomeLocal, setNomeLocal] = useState(projeto?.nome ?? '')
  // Estado do menu de exportação
  const [menuAberto, setMenuAberto] = useState(false)
  // Breadcrumb: seletor de página/projeto
  const [navAberta, setNavAberta] = useState(false)
  const refNav = useRef<HTMLDivElement>(null)
  const [formato, setFormato] = useState<FormatoExportacao>('png')
  const [escala, setEscala] = useState(1)
  const [exportando, setExportando] = useState(false)

  const refMenu = useRef<HTMLDivElement>(null)

  // Sincroniza o campo quando o nome do projeto muda por fora
  // (ex.: normalização ao renomear, desfazer/refazer, novo projeto)
  useEffect(() => {
    setNomeLocal(projeto?.nome ?? '')
  }, [projeto?.nome])

  // Fecha o menu Baixar ao clicar fora dele
  useEffect(() => {
    if (!menuAberto) return
    const aoClicarFora = (evento: MouseEvent) => {
      if (refMenu.current && !refMenu.current.contains(evento.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [menuAberto])

  // Fecha o seletor de navegação ao clicar fora
  useEffect(() => {
    if (!navAberta) return
    const aoClicarFora = (evento: MouseEvent) => {
      if (refNav.current && !refNav.current.contains(evento.target as Node)) {
        setNavAberta(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [navAberta])

  if (!projeto) return null

  const indicePagina = Math.max(
    0,
    projeto.paginas.findIndex((p) => p.id === paginaAtivaId),
  )

  const trocarProjeto = (id: string) => {
    const p = carregarProjeto(id)
    if (p) abrirProjeto(p)
    setNavAberta(false)
  }

  const confirmarNome = () => {
    renomearProjeto(nomeLocal)
  }

  const executarDownload = () => {
    const dataUrl = exportarDataUrl({ formato, escala })
    if (dataUrl) {
      baixarDataUrl(dataUrl, nomeArquivoExportacao(projeto.nome, formato))
    }
    setMenuAberto(false)
  }

  // Exportações de documento (PDF/PPTX percorrem todas as páginas)
  const exportarDocumento = async (tipo: 'pdf' | 'pptx' | 'svg') => {
    setExportando(true)
    try {
      if (tipo === 'pdf') await exportarPdf(projeto.nome)
      else if (tipo === 'pptx') await exportarPptx(projeto.nome)
      else exportarSvg(projeto.nome)
    } finally {
      setExportando(false)
      setMenuAberto(false)
    }
  }

  // Texto discreto do indicador de auto-save
  const textoSalvamento =
    estadoSalvamento === 'salvo'
      ? 'Salvo ✓'
      : estadoSalvamento === 'salvando'
        ? 'Salvando…'
        : 'Alterações não salvas'

  // Classe de um botão de opção (formato/escala) conforme ativo
  const classeOpcao = (ativo: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      ativo
        ? 'bg-primaria-500 text-white shadow-suave'
        : 'bg-superficie-100 text-superficie-700 hover:bg-superficie-200 dark:bg-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-700'
    }`

  return (
    <header className="flex h-14 items-center gap-2 border-b border-superficie-200 bg-white px-3 dark:border-superficie-800 dark:bg-superficie-900">
      {/* Voltar ao dashboard */}
      <button
        onClick={fecharProjeto}
        className="botao-icone"
        title="Voltar aos projetos"
        aria-label="Voltar aos projetos"
      >
        <IconeSetaEsquerda tamanho={18} />
      </button>

      {/* Logo */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primaria-500 text-sm font-bold text-white">
          D
        </span>
        <span className="whitespace-nowrap text-sm font-bold text-superficie-900 dark:text-white">
          DesignStudio <span className="text-primaria-500">Pro</span>
        </span>
      </div>

      {/* Divisor */}
      <span className="hidden h-6 w-px bg-superficie-200 dark:bg-superficie-700 sm:block" />

      {/* Nome editável do projeto */}
      <input
        value={nomeLocal}
        onChange={(e) => setNomeLocal(e.target.value)}
        onBlur={confirmarNome}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            setNomeLocal(projeto.nome)
            e.currentTarget.blur()
          }
        }}
        size={Math.min(Math.max(nomeLocal.length, 8), 32)}
        aria-label="Nome do projeto"
        title="Renomear projeto"
        className="min-w-0 max-w-[16rem] rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-superficie-900 outline-none transition hover:border-superficie-200 focus:border-primaria-400 focus:ring-2 focus:ring-primaria-100 dark:text-superficie-100 dark:hover:border-superficie-700 dark:focus:ring-primaria-900"
      />

      {/* Breadcrumb: seletor de página e de projeto */}
      <div className="relative hidden md:block" ref={refNav}>
        <button
          onClick={() => setNavAberta((a) => !a)}
          aria-haspopup="menu"
          aria-expanded={navAberta}
          title="Trocar de página ou de projeto"
          className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-superficie-600 transition-colors duration-micro hover:bg-superficie-100 hover:text-superficie-900 dark:text-superficie-300 dark:hover:bg-superficie-800 dark:hover:text-superficie-100"
        >
          <span aria-hidden="true" className="text-superficie-400">▸</span>
          Página {indicePagina + 1} de {projeto.paginas.length}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {navAberta && (
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl2 border border-superficie-200 bg-[--sup-flutuante] p-1.5 shadow-flutuante dark:border-superficie-700">
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-superficie-500">
              Páginas
            </p>
            <div className="rolagem-fina max-h-40 overflow-y-auto">
              {projeto.paginas.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => {
                    selecionarPagina(p.id)
                    setNavAberta(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors duration-micro ${
                    p.id === paginaAtivaId
                      ? 'bg-primaria-500/10 text-primaria-600 dark:bg-primaria-500/20 dark:text-primaria-300'
                      : 'text-superficie-800 hover:bg-superficie-100 dark:text-superficie-100 dark:hover:bg-superficie-800'
                  }`}
                >
                  <span className="w-4 text-center text-[10px] tabular-nums text-superficie-500">{i + 1}</span>
                  <span className="truncate">{p.nome}</span>
                </button>
              ))}
            </div>

            {resumos.filter((r) => r.id !== projeto.id).length > 0 && (
              <>
                <div className="mx-2 my-1 h-px bg-superficie-200 dark:bg-superficie-700" />
                <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-superficie-500">
                  Trocar de projeto
                </p>
                <div className="rolagem-fina max-h-44 overflow-y-auto">
                  {resumos
                    .filter((r) => r.id !== projeto.id)
                    .slice(0, 6)
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => trocarProjeto(r.id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors duration-micro hover:bg-superficie-100 dark:hover:bg-superficie-800"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-superficie-100 dark:bg-superficie-850">
                          {r.miniatura ? (
                            <img src={r.miniatura} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-xs opacity-40">🎨</span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-superficie-800 dark:text-superficie-100">
                            {r.nome}
                          </span>
                          <span className="block text-[10px] text-superficie-500">
                            {tempoRelativo(r.atualizadoEm)}
                          </span>
                        </span>
                      </button>
                    ))}
                </div>
              </>
            )}

            <div className="mx-2 my-1 h-px bg-superficie-200 dark:bg-superficie-700" />
            <button
              onClick={fecharProjeto}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium text-superficie-800 transition-colors duration-micro hover:bg-superficie-100 dark:text-superficie-100 dark:hover:bg-superficie-800"
            >
              <IconeSetaEsquerda tamanho={14} /> Todos os projetos
            </button>
          </div>
        )}
      </div>

      {/* Desfazer / Refazer */}
      <div className="flex items-center">
        <button
          onClick={desfazer}
          disabled={!podeDesfazer}
          className="botao-icone"
          title="Desfazer (Ctrl+Z)"
          aria-label="Desfazer"
        >
          <IconeDesfazer tamanho={18} />
        </button>
        <button
          onClick={refazer}
          disabled={!podeRefazer}
          className="botao-icone"
          title="Refazer (Ctrl+Y)"
          aria-label="Refazer"
        >
          <IconeRefazer tamanho={18} />
        </button>
      </div>

      {/* Indicador de auto-save */}
      <span
        className="hidden whitespace-nowrap text-xs text-superficie-700 dark:text-superficie-300 md:inline"
        aria-live="polite"
      >
        {textoSalvamento}
      </span>

      {/* Empurra o restante para a direita */}
      <div className="flex-1" />

      {/* Controle de zoom */}
      <div className="flex items-center rounded-lg bg-superficie-100 p-0.5 dark:bg-superficie-800">
        <button
          onClick={() => definirZoom(zoom * 0.9)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-superficie-700 transition hover:bg-white dark:text-superficie-200 dark:hover:bg-superficie-700"
          title="Diminuir zoom"
          aria-label="Diminuir zoom"
        >
          <IconeMenos tamanho={16} />
        </button>
        <button
          onClick={() => definirZoom(1)}
          className="w-14 text-center text-xs font-semibold tabular-nums text-superficie-900 transition hover:text-primaria-500 dark:text-superficie-100"
          title="Redefinir zoom para 100%"
          aria-label="Redefinir zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => definirZoom(zoom * 1.1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-superficie-700 transition hover:bg-white dark:text-superficie-200 dark:hover:bg-superficie-700"
          title="Aumentar zoom"
          aria-label="Aumentar zoom"
        >
          <IconeMais tamanho={16} />
        </button>
        <button
          onClick={solicitarEncaixe}
          className="flex h-8 w-8 items-center justify-center rounded-md text-superficie-700 transition hover:bg-white dark:text-superficie-200 dark:hover:bg-superficie-700"
          title="Encaixar na tela"
          aria-label="Encaixar na tela"
        >
          <IconeEncaixar tamanho={16} />
        </button>
      </div>

      {/* Toggle de tema */}
      <button
        onClick={aoAlternarTema}
        className="botao-icone"
        title={temaEscuro ? 'Tema claro' : 'Tema escuro'}
        aria-label="Alternar tema"
      >
        {temaEscuro ? <IconeSol tamanho={18} /> : <IconeLua tamanho={18} />}
      </button>

      {/* Apresentar (modo apresentação) */}
      <button
        onClick={iniciarApresentacao}
        className="botao-secundario hidden items-center gap-1.5 lg:inline-flex"
        title="Iniciar apresentação"
      >
        <IconePlay tamanho={15} /> Apresentar
      </button>
      <button
        onClick={() => definirAba('Colaborar')}
        className="botao-secundario hidden items-center gap-1.5 lg:inline-flex"
        title="Abrir colaboração e compartilhamento"
      >
        <IconeCompartilhar tamanho={15} /> Compartilhar
      </button>

      {/* Baixar (menu de exportação) */}
      <div className="relative" ref={refMenu}>
        <button
          onClick={() => setMenuAberto((aberto) => !aberto)}
          className="botao-primario inline-flex items-center gap-1.5"
          aria-haspopup="menu"
          aria-expanded={menuAberto}
        >
          <IconeDownload tamanho={15} /> Baixar
        </button>

        {menuAberto && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl2 border border-superficie-200 bg-white p-4 shadow-painel dark:border-superficie-800 dark:bg-superficie-900">
            {/* Formato */}
            <p className="rotulo-campo">Formato</p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['png', 'jpg'] as FormatoExportacao[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormato(f)}
                  className={classeOpcao(formato === f)}
                  aria-pressed={formato === f}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Escala */}
            <p className="rotulo-campo">Escala</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {ESCALAS.map((s) => (
                <button
                  key={s}
                  onClick={() => setEscala(s)}
                  className={classeOpcao(escala === s)}
                  aria-pressed={escala === s}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button onClick={executarDownload} className="botao-primario w-full">
              Baixar {formato.toUpperCase()} (página atual)
            </button>

            {/* Exportações de documento */}
            <div className="my-3 border-t border-superficie-200 dark:border-superficie-800" />
            <p className="rotulo-campo">Documento</p>
            <div className="space-y-2">
              <button
                onClick={() => exportarDocumento('pdf')}
                disabled={exportando}
                className="botao-secundario w-full disabled:opacity-60"
              >
                📄 PDF (todas as páginas)
              </button>
              <button
                onClick={() => exportarDocumento('pptx')}
                disabled={exportando}
                className="botao-secundario w-full disabled:opacity-60"
              >
                📊 PPTX (apresentação)
              </button>
              <button
                onClick={() => recursoLiberado('export-svg', plano) && exportarDocumento('svg')}
                disabled={exportando || !recursoLiberado('export-svg', plano)}
                className="botao-secundario w-full disabled:opacity-60"
                title={recursoLiberado('export-svg', plano) ? 'Vetor da página atual' : 'Disponível no plano Pro'}
              >
                {recursoLiberado('export-svg', plano) ? '◆ SVG (página atual)' : '🔒 SVG (Pro)'}
              </button>
              {exportando && (
                <p className="text-center text-xs text-superficie-500 dark:text-superficie-400">
                  Exportando…
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
