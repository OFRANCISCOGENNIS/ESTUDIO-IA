// =============================================================
// BarraSuperior — barra fixa no topo do editor. Reúne navegação
// (voltar ao dashboard), nome editável do projeto, desfazer/
// refazer, indicador de auto-save, controle de zoom, tema e o
// menu de exportação (Baixar). Só lê/escreve no store — não
// depende do Konva.
// =============================================================

import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { recursoLiberado } from '../../dados/planos'
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

  // Nome em edição inline (espelha o nome do projeto)
  const [nomeLocal, setNomeLocal] = useState(projeto?.nome ?? '')
  // Estado do menu de exportação
  const [menuAberto, setMenuAberto] = useState(false)
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

  if (!projeto) return null

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
        ←
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

      {/* Desfazer / Refazer */}
      <div className="flex items-center">
        <button
          onClick={desfazer}
          disabled={!podeDesfazer}
          className="botao-icone"
          title="Desfazer (Ctrl+Z)"
          aria-label="Desfazer"
        >
          ↶
        </button>
        <button
          onClick={refazer}
          disabled={!podeRefazer}
          className="botao-icone"
          title="Refazer (Ctrl+Y)"
          aria-label="Refazer"
        >
          ↷
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
          −
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
          +
        </button>
      </div>

      {/* Toggle de tema */}
      <button
        onClick={aoAlternarTema}
        className="botao-icone"
        title={temaEscuro ? 'Tema claro' : 'Tema escuro'}
        aria-label="Alternar tema"
      >
        {temaEscuro ? '☀️' : '🌙'}
      </button>

      {/* Apresentar (modo apresentação) */}
      <button
        onClick={iniciarApresentacao}
        className="botao-secundario hidden lg:inline-flex"
        title="Iniciar apresentação"
      >
        ▶ Apresentar
      </button>
      <button
        className="botao-secundario hidden lg:inline-flex"
        disabled
        title="Colaboração — em breve (Fase 5)"
      >
        Compartilhar
      </button>

      {/* Baixar (menu de exportação) */}
      <div className="relative" ref={refMenu}>
        <button
          onClick={() => setMenuAberto((aberto) => !aberto)}
          className="botao-primario"
          aria-haspopup="menu"
          aria-expanded={menuAberto}
        >
          ⬇ Baixar
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
