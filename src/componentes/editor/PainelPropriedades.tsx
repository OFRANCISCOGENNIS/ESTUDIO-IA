// =============================================================
// PainelPropriedades — painel contextual da coluna direita (topo).
// Lê `projeto` e `selecionados` do store e edita SEMPRE via
// `atualizarElementos(selecionados, { campo: valor })`. Possui três
// modos: (A) nada selecionado → propriedades do canvas; (B) um único
// elemento → controles por tipo; (C) vários → alinhamento em lote.
// Não depende do Konva — só lê/escreve no store.
// =============================================================

import { type ReactNode, useEffect, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { FONTES } from '../../dados/fontes'
import { recursoLiberado } from '../../dados/planos'
import { FILTROS } from '../../nucleo/filtros'
import { obterAdaptadorIA } from '../../nucleo/ia/registro'
import {
  AJUSTES_NEUTROS,
  AjustesImagem,
  FormatoMascara,
  Gradiente,
  ModoMistura,
} from '../../tipos/projeto'

/** Carrega um HTMLImageElement (data URL ou remota com CORS) e chama de volta */
function comImagem(url: string, cb: (img: HTMLImageElement) => void): void {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => cb(img)
  img.onerror = () => console.error('Falha ao carregar imagem para IA')
  img.src = url
}

/** Cores rápidas para o fundo do canvas (paleta de acesso ágil) */
const PALETA_RAPIDA = [
  '#ffffff',
  '#111827',
  '#f43f5e',
  '#f59e0b',
  '#22c55e',
  '#3b82f6',
  '#7c4dff',
  '#ec4899',
]

/** Modos de mesclagem com rótulos em português */
const MODOS_MISTURA: { valor: ModoMistura; nome: string }[] = [
  { valor: 'normal', nome: 'Normal' },
  { valor: 'multiply', nome: 'Multiplicar' },
  { valor: 'screen', nome: 'Divisão' },
  { valor: 'overlay', nome: 'Sobrepor' },
  { valor: 'darken', nome: 'Escurecer' },
  { valor: 'lighten', nome: 'Clarear' },
  { valor: 'color-dodge', nome: 'Subexposição' },
  { valor: 'color-burn', nome: 'Superexposição' },
  { valor: 'hard-light', nome: 'Luz intensa' },
  { valor: 'soft-light', nome: 'Luz suave' },
  { valor: 'difference', nome: 'Diferença' },
  { valor: 'exclusion', nome: 'Exclusão' },
]

/** Máscaras de recorte disponíveis para imagens */
const MASCARAS: { valor: FormatoMascara; nome: string; icone: string }[] = [
  { valor: 'nenhuma', nome: 'Nenhuma', icone: '▢' },
  { valor: 'circulo', nome: 'Círculo', icone: '⬤' },
  { valor: 'arredondado', nome: 'Arredondado', icone: '▢' },
  { valor: 'triangulo', nome: 'Triângulo', icone: '▲' },
  { valor: 'estrela', nome: 'Estrela', icone: '★' },
  { valor: 'coracao', nome: 'Coração', icone: '♥' },
]

/** Ajustes de imagem exibidos como sliders (rótulo + faixa) */
const AJUSTES_UI: { chave: keyof AjustesImagem; rotulo: string; min: number; max: number }[] = [
  { chave: 'brilho', rotulo: 'Brilho', min: -100, max: 100 },
  { chave: 'contraste', rotulo: 'Contraste', min: -100, max: 100 },
  { chave: 'saturacao', rotulo: 'Saturação', min: -100, max: 100 },
  { chave: 'temperatura', rotulo: 'Temperatura', min: -100, max: 100 },
  { chave: 'nitidez', rotulo: 'Nitidez', min: 0, max: 100 },
  { chave: 'desfoque', rotulo: 'Desfoque', min: 0, max: 100 },
  { chave: 'vinheta', rotulo: 'Vinheta', min: 0, max: 100 },
]

/** Botões de alinhamento em lote (rótulo acessível + ícone) */
const ALINHAMENTOS = [
  { eixo: 'esquerda', icone: '⇤', rotulo: 'Alinhar à esquerda' },
  { eixo: 'centroH', icone: '⇔', rotulo: 'Centralizar na horizontal' },
  { eixo: 'direita', icone: '⇥', rotulo: 'Alinhar à direita' },
  { eixo: 'topo', icone: '⤒', rotulo: 'Alinhar ao topo' },
  { eixo: 'centroV', icone: '⇕', rotulo: 'Centralizar na vertical' },
  { eixo: 'base', icone: '⤓', rotulo: 'Alinhar à base' },
] as const

// ---- Utilitários -------------------------------------------------

/** Normaliza uma cor para o formato #rrggbb aceito por <input type=color> */
function corParaInput(cor: string): string {
  const casamento = /^#([0-9a-fA-F]{6})/.exec(cor)
  return casamento ? `#${casamento[1]}` : '#000000'
}

/** Detecta cores sem opacidade (usadas para "sem preenchimento") */
function ehTransparente(cor: string): boolean {
  const c = cor.toLowerCase()
  return c === 'transparent' || c === 'none' || (/^#[0-9a-f]{8}$/.test(c) && c.endsWith('00'))
}

/** Classe de um botão de alternância conforme ativo/inativo */
function classeToggle(ativo: boolean): string {
  return `flex h-9 min-w-9 flex-1 items-center justify-center rounded-lg px-2 text-sm font-semibold transition active:scale-[0.97] ${
    ativo
      ? 'bg-primaria-500 text-white shadow-suave'
      : 'bg-superficie-100 text-superficie-700 hover:bg-superficie-200 dark:bg-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-700'
  }`
}

// ---- Componentes auxiliares -------------------------------------

/** Seção com título discreto e espaçamento vertical uniforme */
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-wide text-superficie-500 dark:text-superficie-400">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

/** Campo numérico rotulado */
function CampoNumero({
  rotulo,
  valor,
  aoMudar,
  passo = 1,
  minimo,
}: {
  rotulo: string
  valor: number
  aoMudar: (valor: number) => void
  passo?: number
  minimo?: number
}) {
  return (
    <label className="block">
      <span className="rotulo-campo">{rotulo}</span>
      <input
        type="number"
        value={Number.isFinite(valor) ? Math.round(valor * 100) / 100 : 0}
        step={passo}
        min={minimo}
        onChange={(evento) => {
          const numero = parseFloat(evento.target.value)
          aoMudar(Number.isNaN(numero) ? 0 : numero)
        }}
        className="campo-texto tabular-nums"
      />
    </label>
  )
}

/** Seletor de cor rotulado, com amostra hex ao lado */
function CampoCor({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-superficie-700 dark:text-superficie-200">
        {rotulo}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-superficie-500 dark:text-superficie-400">
          {corParaInput(valor).toUpperCase()}
        </span>
        <input
          type="color"
          value={corParaInput(valor)}
          onChange={(evento) => aoMudar(evento.target.value)}
          aria-label={rotulo}
          className="h-8 w-10 cursor-pointer rounded-lg border border-superficie-200 bg-transparent dark:border-superficie-700"
        />
      </span>
    </label>
  )
}

/** Controle de opacidade (0..1) exibindo a porcentagem */
function ControleOpacidade({
  valor,
  aoMudar,
}: {
  valor: number
  aoMudar: (valor: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="rotulo-campo mb-0">Opacidade</span>
        <span className="text-xs tabular-nums text-superficie-500 dark:text-superficie-400">
          {Math.round(valor * 100)}%
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={valor}
        onChange={(evento) => aoMudar(parseFloat(evento.target.value))}
        className="w-full cursor-pointer accent-primaria-500"
        aria-label="Opacidade"
      />
    </label>
  )
}

/** Ações comuns de Duplicar e Excluir */
function AcoesElemento({
  aoDuplicar,
  aoExcluir,
}: {
  aoDuplicar: () => void
  aoExcluir: () => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={aoDuplicar} className="botao-secundario">
        ⧉ Duplicar
      </button>
      <button
        type="button"
        onClick={aoExcluir}
        className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 active:scale-[0.98] dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70"
      >
        🗑 Excluir
      </button>
    </div>
  )
}

/** Slider genérico com rótulo e leitura numérica */
function CampoSlider({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  aoMudar,
}: {
  rotulo: string
  valor: number
  min: number
  max: number
  passo?: number
  aoMudar: (valor: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between">
        <span className="rotulo-campo mb-0">{rotulo}</span>
        <span className="text-xs tabular-nums text-superficie-500 dark:text-superficie-400">
          {Math.round(valor)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(evento) => aoMudar(parseFloat(evento.target.value))}
        className="w-full cursor-pointer accent-primaria-500"
        aria-label={rotulo}
      />
    </label>
  )
}

/** Editor simples de gradiente (2 paradas + tipo + ângulo) */
function EditorGradiente({
  gradiente,
  aoMudar,
}: {
  gradiente: Gradiente
  aoMudar: (g: Gradiente) => void
}) {
  const inicio = gradiente.paradas[0] ?? { deslocamento: 0, cor: '#7c4dff' }
  const fim = gradiente.paradas[gradiente.paradas.length - 1] ?? { deslocamento: 1, cor: '#ec4899' }
  const definirParada = (indice: 0 | 1, cor: string) => {
    const paradas = [
      { deslocamento: 0, cor: indice === 0 ? cor : inicio.cor },
      { deslocamento: 1, cor: indice === 1 ? cor : fim.cor },
    ]
    aoMudar({ ...gradiente, paradas })
  }
  return (
    <div className="space-y-3 rounded-lg bg-superficie-50 p-3 dark:bg-superficie-850">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => aoMudar({ ...gradiente, tipo: 'linear' })}
          className={classeToggle(gradiente.tipo === 'linear')}
        >
          Linear
        </button>
        <button
          type="button"
          onClick={() => aoMudar({ ...gradiente, tipo: 'radial' })}
          className={classeToggle(gradiente.tipo === 'radial')}
        >
          Radial
        </button>
      </div>
      <CampoCor rotulo="Cor inicial" valor={inicio.cor} aoMudar={(c) => definirParada(0, c)} />
      <CampoCor rotulo="Cor final" valor={fim.cor} aoMudar={(c) => definirParada(1, c)} />
      {gradiente.tipo === 'linear' && (
        <CampoSlider
          rotulo="Ângulo"
          valor={gradiente.angulo}
          min={0}
          max={360}
          aoMudar={(v) => aoMudar({ ...gradiente, angulo: v })}
        />
      )}
    </div>
  )
}

// ---- Painel principal -------------------------------------------

export function PainelPropriedades() {
  const projeto = useEditorStore((s) => s.projeto)
  const pagina = usePaginaAtiva()
  const selecionados = useEditorStore((s) => s.selecionados)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)
  const definirCorFundo = useEditorStore((s) => s.definirCorFundo)
  const duplicarSelecionados = useEditorStore((s) => s.duplicarSelecionados)
  const removerSelecionados = useEditorStore((s) => s.removerSelecionados)
  const alinharSelecionados = useEditorStore((s) => s.alinharSelecionados)
  const plano = usePlanoStore((s) => s.plano)

  // Estado dos recursos de IA por imagem/texto selecionado
  const [paletaExtraida, setPaletaExtraida] = useState<string[]>([])
  const [processandoIA, setProcessandoIA] = useState(false)
  const [rewriteOpcoes, setRewriteOpcoes] = useState<string[]>([])
  const idSelecionado = selecionados.length === 1 ? selecionados[0] : null
  // Limpa resultados de IA ao trocar de elemento
  useEffect(() => {
    setPaletaExtraida([])
    setRewriteOpcoes([])
  }, [idSelecionado])

  if (!projeto || !pagina) return null

  // Elemento único (quando houver exatamente um selecionado existente)
  const elementoUnico =
    selecionados.length === 1
      ? pagina.elementos.find((e) => e.id === selecionados[0])
      : undefined

  // ---- Ações de IA (imagem/texto) ----
  const removerFundoIA = () => {
    if (!elementoUnico || elementoUnico.tipo !== 'imagem') return
    const el = elementoUnico
    setProcessandoIA(true)
    comImagem(el.url, async (img) => {
      try {
        const url = await obterAdaptadorIA().removerFundo(img)
        atualizarElementos([el.id], { url, mascara: 'nenhuma' })
      } finally {
        setProcessandoIA(false)
      }
    })
  }
  const extrairPaletaIA = () => {
    if (!elementoUnico || elementoUnico.tipo !== 'imagem') return
    const el = elementoUnico
    setProcessandoIA(true)
    comImagem(el.url, async (img) => {
      try {
        setPaletaExtraida(await obterAdaptadorIA().extrairPaleta(img, 6))
      } finally {
        setProcessandoIA(false)
      }
    })
  }
  const reescreverTextoIA = async () => {
    if (!elementoUnico || elementoUnico.tipo !== 'texto') return
    setProcessandoIA(true)
    try {
      setRewriteOpcoes(
        await obterAdaptadorIA().gerarTextos('titulo', elementoUnico.texto, 'descontraido'),
      )
    } finally {
      setProcessandoIA(false)
    }
  }

  // Cabeçalho contextual conforme o modo
  let titulo = 'Propriedades do canvas'
  let subtitulo = 'Nenhum elemento selecionado'
  if (elementoUnico) {
    titulo = elementoUnico.nome
    subtitulo = `Elemento · ${elementoUnico.tipo}`
  } else if (selecionados.length >= 2) {
    titulo = 'Vários elementos'
    subtitulo = `${selecionados.length} elementos selecionados`
  }

  return (
    <aside className="flex h-full w-full flex-col bg-white dark:bg-superficie-900">
      {/* Cabeçalho */}
      <div className="shrink-0 border-b border-superficie-200 px-4 py-3 dark:border-superficie-800">
        <h2 className="truncate text-sm font-bold text-superficie-900 dark:text-white">
          {titulo}
        </h2>
        <p className="truncate text-xs text-superficie-500 dark:text-superficie-400">
          {subtitulo}
        </p>
      </div>

      {/* Corpo rolável */}
      <div className="rolagem-fina flex-1 space-y-6 overflow-y-auto p-4">
        {/* ===== Modo A: propriedades do canvas ===== */}
        {!elementoUnico && selecionados.length === 0 && (
          <>
            <Secao titulo="Tamanho">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="rotulo-campo">Largura</span>
                  <input
                    type="text"
                    value={`${projeto.larguraCanvas} px`}
                    readOnly
                    className="campo-texto cursor-default tabular-nums text-superficie-500 dark:text-superficie-400"
                    aria-label="Largura do canvas"
                  />
                </label>
                <label className="block">
                  <span className="rotulo-campo">Altura</span>
                  <input
                    type="text"
                    value={`${projeto.alturaCanvas} px`}
                    readOnly
                    className="campo-texto cursor-default tabular-nums text-superficie-500 dark:text-superficie-400"
                    aria-label="Altura do canvas"
                  />
                </label>
              </div>
            </Secao>

            <Secao titulo="Cor de fundo">
              <CampoCor
                rotulo="Fundo"
                valor={pagina.corFundo}
                aoMudar={(valor) => definirCorFundo(valor)}
              />
              <div className="grid grid-cols-8 gap-2">
                {PALETA_RAPIDA.map((cor) => {
                  const ativo = pagina.corFundo.toLowerCase() === cor.toLowerCase()
                  return (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => definirCorFundo(cor)}
                      title={cor}
                      aria-label={`Fundo ${cor}`}
                      aria-pressed={ativo}
                      className={`h-7 w-full rounded-lg border transition hover:scale-110 ${
                        ativo
                          ? 'border-primaria-500 ring-2 ring-primaria-200 dark:ring-primaria-900'
                          : 'border-superficie-200 dark:border-superficie-700'
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  )
                })}
              </div>
            </Secao>
          </>
        )}

        {/* ===== Modo B: um único elemento ===== */}
        {elementoUnico && (
          <>
            {/* Comuns a todos os tipos */}
            <Secao titulo="Geral">
              <ControleOpacidade
                valor={elementoUnico.opacidade}
                aoMudar={(valor) => atualizarElementos([elementoUnico.id], { opacidade: valor })}
              />
              <div className="grid grid-cols-2 gap-3">
                <CampoNumero
                  rotulo="Posição X"
                  valor={elementoUnico.x}
                  aoMudar={(valor) => atualizarElementos([elementoUnico.id], { x: valor })}
                />
                <CampoNumero
                  rotulo="Posição Y"
                  valor={elementoUnico.y}
                  aoMudar={(valor) => atualizarElementos([elementoUnico.id], { y: valor })}
                />
              </div>
              <CampoNumero
                rotulo="Rotação (graus)"
                valor={elementoUnico.rotacao}
                aoMudar={(valor) => atualizarElementos([elementoUnico.id], { rotacao: valor })}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    atualizarElementos([elementoUnico.id], { visivel: !elementoUnico.visivel })
                  }
                  className={classeToggle(elementoUnico.visivel)}
                  aria-pressed={elementoUnico.visivel}
                  title={elementoUnico.visivel ? 'Ocultar' : 'Mostrar'}
                >
                  {elementoUnico.visivel ? '👁 Visível' : '🚫 Oculto'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    atualizarElementos([elementoUnico.id], { bloqueado: !elementoUnico.bloqueado })
                  }
                  className={classeToggle(elementoUnico.bloqueado)}
                  aria-pressed={elementoUnico.bloqueado}
                  title={elementoUnico.bloqueado ? 'Desbloquear' : 'Bloquear'}
                >
                  {elementoUnico.bloqueado ? '🔒 Travado' : '🔓 Livre'}
                </button>
              </div>
              <label className="block">
                <span className="rotulo-campo">Modo de mesclagem</span>
                <select
                  value={elementoUnico.mistura}
                  onChange={(evento) =>
                    atualizarElementos([elementoUnico.id], {
                      mistura: evento.target.value as ModoMistura,
                    })
                  }
                  className="campo-texto"
                >
                  {MODOS_MISTURA.map((modo) => (
                    <option key={modo.valor} value={modo.valor}>
                      {modo.nome}
                    </option>
                  ))}
                </select>
              </label>
            </Secao>

            {/* Texto */}
            {elementoUnico.tipo === 'texto' && (
              <Secao titulo="Texto">
                <label className="block">
                  <span className="rotulo-campo">Conteúdo</span>
                  <textarea
                    value={elementoUnico.texto}
                    onChange={(evento) =>
                      atualizarElementos([elementoUnico.id], { texto: evento.target.value })
                    }
                    rows={3}
                    className="campo-texto resize-y rolagem-fina"
                  />
                </label>
                <label className="block">
                  <span className="rotulo-campo">Fonte</span>
                  <select
                    value={elementoUnico.fonte}
                    onChange={(evento) =>
                      atualizarElementos([elementoUnico.id], { fonte: evento.target.value })
                    }
                    className="campo-texto"
                  >
                    {FONTES.map((fonte) => (
                      <option key={fonte.familia} value={fonte.familia}>
                        {fonte.nome} · {fonte.categoria}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <CampoNumero
                    rotulo="Tamanho"
                    valor={elementoUnico.tamanhoFonte}
                    minimo={1}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], {
                        tamanhoFonte: Math.max(1, valor),
                      })
                    }
                  />
                  <CampoNumero
                    rotulo="Largura da caixa"
                    valor={elementoUnico.largura}
                    minimo={1}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], { largura: Math.max(1, valor) })
                    }
                  />
                </div>
                {/* Estilos negrito / itálico / sublinhado */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      atualizarElementos([elementoUnico.id], { negrito: !elementoUnico.negrito })
                    }
                    className={classeToggle(elementoUnico.negrito)}
                    aria-pressed={elementoUnico.negrito}
                    title="Negrito"
                  >
                    <span className="font-bold">N</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      atualizarElementos([elementoUnico.id], { italico: !elementoUnico.italico })
                    }
                    className={classeToggle(elementoUnico.italico)}
                    aria-pressed={elementoUnico.italico}
                    title="Itálico"
                  >
                    <span className="italic">I</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      atualizarElementos([elementoUnico.id], {
                        sublinhado: !elementoUnico.sublinhado,
                      })
                    }
                    className={classeToggle(elementoUnico.sublinhado)}
                    aria-pressed={elementoUnico.sublinhado}
                    title="Sublinhado"
                  >
                    <span className="underline">S</span>
                  </button>
                </div>
                {/* Alinhamento do texto */}
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { valor: 'left', icone: '⯇', rotulo: 'Alinhar à esquerda' },
                      { valor: 'center', icone: '≡', rotulo: 'Centralizar' },
                      { valor: 'right', icone: '⯈', rotulo: 'Alinhar à direita' },
                    ] as const
                  ).map((opcao) => (
                    <button
                      key={opcao.valor}
                      type="button"
                      onClick={() =>
                        atualizarElementos([elementoUnico.id], { alinhamento: opcao.valor })
                      }
                      className={classeToggle(elementoUnico.alinhamento === opcao.valor)}
                      aria-pressed={elementoUnico.alinhamento === opcao.valor}
                      title={opcao.rotulo}
                    >
                      {opcao.icone}
                    </button>
                  ))}
                </div>
                <CampoCor
                  rotulo="Cor do texto"
                  valor={elementoUnico.cor}
                  aoMudar={(valor) => atualizarElementos([elementoUnico.id], { cor: valor })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <CampoNumero
                    rotulo="Altura da linha"
                    valor={elementoUnico.alturaLinha}
                    passo={0.1}
                    minimo={0.5}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], { alturaLinha: valor })
                    }
                  />
                  <CampoNumero
                    rotulo="Espaço entre letras"
                    valor={elementoUnico.espacamentoLetras}
                    passo={0.5}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], { espacamentoLetras: valor })
                    }
                  />
                </div>

                {/* Magic Write: reescrever o texto com IA */}
                <button
                  type="button"
                  onClick={reescreverTextoIA}
                  disabled={processandoIA}
                  className="botao-secundario w-full disabled:opacity-50"
                >
                  {processandoIA ? 'Gerando…' : '🪄 Reescrever com IA'}
                </button>
                {rewriteOpcoes.length > 0 && (
                  <ul className="space-y-1.5">
                    {rewriteOpcoes.map((op, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => atualizarElementos([elementoUnico.id], { texto: op })}
                          className="w-full rounded-lg border border-superficie-200 px-3 py-2 text-left text-sm text-superficie-800 transition hover:border-primaria-300 hover:bg-primaria-50 dark:border-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-800"
                          title="Aplicar este texto"
                        >
                          {op}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Secao>
            )}

            {/* Formas: retângulo / elipse / triângulo / estrela */}
            {(elementoUnico.tipo === 'retangulo' ||
              elementoUnico.tipo === 'elipse' ||
              elementoUnico.tipo === 'triangulo' ||
              elementoUnico.tipo === 'estrela') && (
              <Secao titulo="Forma">
                <div className="grid grid-cols-2 gap-3">
                  <CampoNumero
                    rotulo="Largura"
                    valor={elementoUnico.largura}
                    minimo={1}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], { largura: Math.max(1, valor) })
                    }
                  />
                  <CampoNumero
                    rotulo="Altura"
                    valor={elementoUnico.altura}
                    minimo={1}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], { altura: Math.max(1, valor) })
                    }
                  />
                </div>

                {/* Preenchimento: sólido ou gradiente */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => atualizarElementos([elementoUnico.id], { gradiente: undefined })}
                    className={classeToggle(!elementoUnico.gradiente)}
                  >
                    Sólido
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      atualizarElementos([elementoUnico.id], {
                        gradiente: elementoUnico.gradiente ?? {
                          tipo: 'linear',
                          angulo: 90,
                          paradas: [
                            { deslocamento: 0, cor: '#7c4dff' },
                            { deslocamento: 1, cor: '#ec4899' },
                          ],
                        },
                      })
                    }
                    className={classeToggle(!!elementoUnico.gradiente)}
                  >
                    Gradiente
                  </button>
                </div>
                {elementoUnico.gradiente ? (
                  <EditorGradiente
                    gradiente={elementoUnico.gradiente}
                    aoMudar={(g) => atualizarElementos([elementoUnico.id], { gradiente: g })}
                  />
                ) : (
                  <>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-superficie-700 dark:text-superficie-200">
                      <input
                        type="checkbox"
                        checked={ehTransparente(elementoUnico.preenchimento)}
                        onChange={(evento) =>
                          atualizarElementos([elementoUnico.id], {
                            preenchimento: evento.target.checked ? 'transparent' : '#7c4dff',
                          })
                        }
                        className="h-4 w-4 rounded accent-primaria-500"
                      />
                      Sem preenchimento
                    </label>
                    {!ehTransparente(elementoUnico.preenchimento) && (
                      <CampoCor
                        rotulo="Preenchimento"
                        valor={elementoUnico.preenchimento}
                        aoMudar={(valor) =>
                          atualizarElementos([elementoUnico.id], { preenchimento: valor })
                        }
                      />
                    )}
                  </>
                )}

                {/* Borda */}
                <CampoCor
                  rotulo="Cor da borda"
                  valor={elementoUnico.corBorda}
                  aoMudar={(valor) => atualizarElementos([elementoUnico.id], { corBorda: valor })}
                />
                <CampoNumero
                  rotulo="Espessura da borda"
                  valor={elementoUnico.espessuraBorda}
                  minimo={0}
                  aoMudar={(valor) =>
                    atualizarElementos([elementoUnico.id], {
                      espessuraBorda: Math.max(0, valor),
                    })
                  }
                />

                {/* Raio dos cantos (faz sentido no retângulo) */}
                <CampoNumero
                  rotulo="Raio dos cantos"
                  valor={elementoUnico.raioCanto}
                  minimo={0}
                  aoMudar={(valor) =>
                    atualizarElementos([elementoUnico.id], { raioCanto: Math.max(0, valor) })
                  }
                />

                {/* Pontas (apenas estrela) */}
                {elementoUnico.tipo === 'estrela' && (
                  <CampoNumero
                    rotulo="Número de pontas"
                    valor={elementoUnico.pontas}
                    minimo={3}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], {
                        pontas: Math.max(3, Math.round(valor)),
                      })
                    }
                  />
                )}
              </Secao>
            )}

            {/* Imagem */}
            {elementoUnico.tipo === 'imagem' && (
              <>
                <Secao titulo="Imagem">
                  <div className="grid grid-cols-2 gap-3">
                    <CampoNumero
                      rotulo="Largura"
                      valor={elementoUnico.largura}
                      minimo={1}
                      aoMudar={(valor) =>
                        atualizarElementos([elementoUnico.id], { largura: Math.max(1, valor) })
                      }
                    />
                    <CampoNumero
                      rotulo="Altura"
                      valor={elementoUnico.altura}
                      minimo={1}
                      aoMudar={(valor) =>
                        atualizarElementos([elementoUnico.id], { altura: Math.max(1, valor) })
                      }
                    />
                  </div>
                  <CampoNumero
                    rotulo="Raio dos cantos"
                    valor={elementoUnico.raioCanto}
                    minimo={0}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], { raioCanto: Math.max(0, valor) })
                    }
                  />
                </Secao>

                {/* Máscara de recorte */}
                <Secao titulo="Máscara">
                  <div className="grid grid-cols-3 gap-2">
                    {MASCARAS.map((m) => (
                      <button
                        key={m.valor}
                        type="button"
                        onClick={() => atualizarElementos([elementoUnico.id], { mascara: m.valor })}
                        className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-lg transition ${
                          elementoUnico.mascara === m.valor
                            ? 'border-primaria-500 bg-primaria-50 text-primaria-600 dark:bg-primaria-900 dark:text-primaria-200'
                            : 'border-superficie-200 hover:bg-superficie-100 dark:border-superficie-700 dark:hover:bg-superficie-800'
                        }`}
                        title={m.nome}
                      >
                        <span>{m.icone}</span>
                        <span className="text-[0.6rem] font-medium">{m.nome}</span>
                      </button>
                    ))}
                  </div>
                </Secao>

                {/* Filtros predefinidos com intensidade */}
                <Secao titulo="Filtros">
                  <div className="grid grid-cols-3 gap-1.5">
                    {FILTROS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => atualizarElementos([elementoUnico.id], { filtro: f.id })}
                        className={`truncate rounded-md px-1.5 py-1.5 text-[0.65rem] font-medium transition ${
                          elementoUnico.filtro === f.id
                            ? 'bg-primaria-500 text-white'
                            : 'bg-superficie-100 text-superficie-700 hover:bg-superficie-200 dark:bg-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-700'
                        }`}
                        title={f.nome}
                      >
                        {f.nome}
                      </button>
                    ))}
                  </div>
                  {elementoUnico.filtro !== 'nenhum' && (
                    <label className="block">
                      <span className="mb-1 flex items-center justify-between">
                        <span className="rotulo-campo mb-0">Intensidade</span>
                        <span className="text-xs tabular-nums text-superficie-500 dark:text-superficie-400">
                          {Math.round(elementoUnico.intensidadeFiltro * 100)}%
                        </span>
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={elementoUnico.intensidadeFiltro}
                        onChange={(evento) =>
                          atualizarElementos([elementoUnico.id], {
                            intensidadeFiltro: parseFloat(evento.target.value),
                          })
                        }
                        className="w-full cursor-pointer accent-primaria-500"
                        aria-label="Intensidade do filtro"
                      />
                    </label>
                  )}
                </Secao>

                {/* Ajustes finos */}
                <Secao titulo="Ajustes">
                  {AJUSTES_UI.map((aj) => (
                    <CampoSlider
                      key={aj.chave}
                      rotulo={aj.rotulo}
                      valor={elementoUnico.ajustes[aj.chave]}
                      min={aj.min}
                      max={aj.max}
                      aoMudar={(valor) =>
                        atualizarElementos([elementoUnico.id], {
                          ajustes: { ...elementoUnico.ajustes, [aj.chave]: valor },
                        })
                      }
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      atualizarElementos([elementoUnico.id], { ajustes: { ...AJUSTES_NEUTROS } })
                    }
                    className="botao-secundario w-full"
                  >
                    ↺ Restaurar ajustes
                  </button>
                </Secao>

                {/* IA de imagem */}
                <Secao titulo="IA">
                  <button
                    type="button"
                    onClick={removerFundoIA}
                    disabled={processandoIA || !recursoLiberado('remover-fundo', plano)}
                    className="botao-secundario w-full disabled:opacity-50"
                    title={
                      recursoLiberado('remover-fundo', plano)
                        ? 'Remover o fundo automaticamente'
                        : 'Disponível no plano Pro'
                    }
                  >
                    {processandoIA
                      ? 'Processando…'
                      : recursoLiberado('remover-fundo', plano)
                        ? '✂️ Remover fundo'
                        : '🔒 Remover fundo (Pro)'}
                  </button>
                  <button
                    type="button"
                    onClick={extrairPaletaIA}
                    disabled={processandoIA}
                    className="botao-secundario w-full disabled:opacity-50"
                  >
                    🎨 Extrair paleta
                  </button>
                  {paletaExtraida.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {paletaExtraida.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => definirCorFundo(cor)}
                          className="h-8 w-8 rounded-lg border border-superficie-200 transition hover:scale-110 dark:border-superficie-700"
                          style={{ backgroundColor: cor }}
                          title={`Usar ${cor} no fundo`}
                        />
                      ))}
                    </div>
                  )}
                </Secao>
              </>
            )}

            {/* Linha */}
            {elementoUnico.tipo === 'linha' && (
              <Secao titulo="Linha">
                <CampoCor
                  rotulo="Cor"
                  valor={elementoUnico.cor}
                  aoMudar={(valor) => atualizarElementos([elementoUnico.id], { cor: valor })}
                />
                <CampoNumero
                  rotulo="Espessura"
                  valor={elementoUnico.espessura}
                  minimo={1}
                  aoMudar={(valor) =>
                    atualizarElementos([elementoUnico.id], { espessura: Math.max(1, valor) })
                  }
                />
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-superficie-700 dark:text-superficie-200">
                  <input
                    type="checkbox"
                    checked={elementoUnico.tracejada}
                    onChange={(evento) =>
                      atualizarElementos([elementoUnico.id], { tracejada: evento.target.checked })
                    }
                    className="h-4 w-4 rounded accent-primaria-500"
                  />
                  Linha tracejada
                </label>
              </Secao>
            )}

            {/* Ações */}
            <AcoesElemento aoDuplicar={duplicarSelecionados} aoExcluir={removerSelecionados} />
          </>
        )}

        {/* ===== Modo C: vários elementos ===== */}
        {!elementoUnico && selecionados.length >= 2 && (
          <>
            <Secao titulo="Alinhar">
              <div className="grid grid-cols-3 gap-2">
                {ALINHAMENTOS.map((item) => (
                  <button
                    key={item.eixo}
                    type="button"
                    onClick={() => alinharSelecionados(item.eixo)}
                    className="flex h-10 items-center justify-center rounded-lg bg-superficie-100 text-lg text-superficie-700 transition hover:bg-superficie-200 active:scale-[0.97] dark:bg-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-700"
                    title={item.rotulo}
                    aria-label={item.rotulo}
                  >
                    {item.icone}
                  </button>
                ))}
              </div>
            </Secao>

            <Secao titulo="Geral">
              <ControleOpacidade
                valor={
                  pagina.elementos.find((e) => selecionados.includes(e.id))?.opacidade ?? 1
                }
                aoMudar={(valor) => atualizarElementos(selecionados, { opacidade: valor })}
              />
            </Secao>

            <AcoesElemento aoDuplicar={duplicarSelecionados} aoExcluir={removerSelecionados} />
          </>
        )}
      </div>
    </aside>
  )
}
