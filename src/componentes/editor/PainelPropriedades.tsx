// =============================================================
// PainelPropriedades — painel contextual da coluna direita (topo).
// Lê `projeto` e `selecionados` do store e edita SEMPRE via
// `atualizarElementos(selecionados, { campo: valor })`. Possui três
// modos: (A) nada selecionado → propriedades do canvas; (B) um único
// elemento → controles por tipo; (C) vários → alinhamento em lote.
// Não depende do Konva — só lê/escreve no store.
// =============================================================

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { useColabStore } from '../../estado/useColabStore'
import { FONTES } from '../../dados/fontes'
import { recursoLiberado } from '../../dados/planos'
import { FILTROS } from '../../nucleo/filtros'
import { obterAdaptadorIA } from '../../nucleo/ia/registro'
import {
  AJUSTES_NEUTROS,
  AjustesImagem,
  DadoGrafico,
  EfeitoTexto,
  Elemento,
  FormatoMascara,
  Gradiente,
  ModoMistura,
  TexturaTexto,
  TipoAnimacao,
  TipoGrafico,
  TransicaoSlide,
} from '../../tipos/projeto'

const EFEITOS: { valor: EfeitoTexto; nome: string }[] = [
  { valor: 'nenhum', nome: 'Nenhum' },
  { valor: 'sombra', nome: 'Sombra' },
  { valor: 'contorno', nome: 'Contorno' },
  { valor: 'neon', nome: 'Neon' },
  { valor: 'eco', nome: 'Eco' },
]

const TEXTURAS: { valor: TexturaTexto; nome: string }[] = [
  { valor: 'nenhuma', nome: 'Nenhuma' },
  { valor: 'dourado', nome: 'Dourado' },
  { valor: 'prata', nome: 'Prata' },
  { valor: 'metal', nome: 'Metal' },
  { valor: 'fogo', nome: 'Fogo' },
  { valor: 'gelo', nome: 'Gelo' },
]

const TIPOS_GRAFICO: { valor: TipoGrafico; nome: string }[] = [
  { valor: 'barras', nome: 'Barras' },
  { valor: 'pizza', nome: 'Pizza' },
  { valor: 'linhas', nome: 'Linhas' },
  { valor: 'funil', nome: 'Funil' },
]

/** Interpreta CSV simples "rotulo,valor" por linha */
function csvParaDados(texto: string): DadoGrafico[] {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.split(/[,;\t]/))
    .filter((c) => c.length >= 2 && c[0].trim())
    .map((c) => ({ rotulo: c[0].trim(), valor: Number(c[1]) || 0 }))
}

/** Animações de entrada disponíveis */
const ANIMACOES: { valor: TipoAnimacao; nome: string }[] = [
  { valor: 'nenhuma', nome: 'Nenhuma' },
  { valor: 'fade', nome: 'Surgir (fade)' },
  { valor: 'rise', nome: 'Subir (rise)' },
  { valor: 'pan', nome: 'Deslizar (pan)' },
  { valor: 'tumble', nome: 'Cambalhota (tumble)' },
]

/** Transições de slide disponíveis */
const TRANSICOES: { valor: TransicaoSlide; nome: string }[] = [
  { valor: 'nenhuma', nome: 'Nenhuma' },
  { valor: 'fade', nome: 'Fade' },
  { valor: 'slide', nome: 'Deslizar' },
  { valor: 'zoom', nome: 'Zoom' },
]

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

/** Seção colapsável com título discreto e espaçamento vertical uniforme */
function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const [aberta, setAberta] = useState(true)
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between text-[0.7rem] font-semibold uppercase tracking-wide text-superficie-500 transition-colors duration-micro hover:text-superficie-700 dark:text-superficie-400 dark:hover:text-superficie-200"
      >
        {titulo}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform duration-curta ease-facil-padrao ${aberta ? '' : '-rotate-90'}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {aberta && children}
    </section>
  )
}

/**
 * Campo numérico rotulado com "scrub": arrastar o rótulo na horizontal
 * ajusta o valor (±1 por pixel; Shift = ±10), como nos editores pro.
 */
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
  const scrub = useRef<{ base: number; xInicial: number } | null>(null)

  const aoScrub = (e: React.PointerEvent) => {
    if (!scrub.current) return
    const delta = (e.clientX - scrub.current.xInicial) * (e.shiftKey ? 10 : 1)
    let novo = scrub.current.base + delta * passo
    if (minimo !== undefined) novo = Math.max(minimo, novo)
    aoMudar(Math.round(novo * 100) / 100)
  }

  return (
    <label className="block">
      <span
        className="rotulo-campo cursor-ew-resize select-none"
        title="Arraste na horizontal para ajustar (Shift = ×10)"
        onPointerDown={(e) => {
          scrub.current = { base: valor, xInicial: e.clientX }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={aoScrub}
        onPointerUp={(e) => {
          scrub.current = null
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
      >
        {rotulo}
      </span>
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

/** Largura × Altura com cadeado de proporção (estilo Figma) */
function CamposDimensoes({
  largura,
  altura,
  aoMudar,
}: {
  largura: number
  altura: number
  aoMudar: (mudancas: { largura?: number; altura?: number }) => void
}) {
  const [travada, setTravada] = useState(false)
  const proporcao = altura > 0 ? largura / altura : 1
  return (
    <div className="flex items-end gap-1.5">
      <div className="flex-1">
        <CampoNumero
          rotulo="Largura"
          valor={largura}
          minimo={1}
          aoMudar={(v) => {
            const l = Math.max(1, v)
            aoMudar(travada ? { largura: l, altura: Math.max(1, l / proporcao) } : { largura: l })
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => setTravada((t) => !t)}
        aria-pressed={travada}
        title={travada ? 'Proporção travada — clique para liberar' : 'Travar proporção'}
        className={`mb-0.5 flex h-8 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-micro ${
          travada
            ? 'bg-primaria-500/15 text-primaria-600 dark:text-primaria-300'
            : 'text-superficie-400 hover:bg-superficie-100 hover:text-superficie-600 dark:hover:bg-superficie-800'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          {travada ? (
            <>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </>
          ) : (
            <>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
            </>
          )}
        </svg>
      </button>
      <div className="flex-1">
        <CampoNumero
          rotulo="Altura"
          valor={altura}
          minimo={1}
          aoMudar={(v) => {
            const a = Math.max(1, v)
            aoMudar(travada ? { altura: a, largura: Math.max(1, a * proporcao) } : { altura: a })
          }}
        />
      </div>
    </div>
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

/** Editor de propriedades de gráfico (dados manuais + CSV) */
function SecaoGrafico({
  elemento,
  aoMudar,
}: {
  elemento: Extract<Elemento, { tipo: 'grafico' }>
  aoMudar: (m: Partial<Elemento>) => void
}) {
  const [csv, setCsv] = useState('')
  const definirDado = (i: number, campo: 'rotulo' | 'valor', valor: string) => {
    const dados = elemento.dados.map((d, j) =>
      j === i ? { ...d, [campo]: campo === 'valor' ? Number(valor) || 0 : valor } : d,
    )
    aoMudar({ dados })
  }
  return (
    <Secao titulo="Gráfico">
      <label className="block">
        <span className="rotulo-campo">Tipo</span>
        <select
          value={elemento.tipoGrafico}
          onChange={(e) => aoMudar({ tipoGrafico: e.target.value as TipoGrafico })}
          className="campo-texto"
        >
          {TIPOS_GRAFICO.map((t) => (
            <option key={t.valor} value={t.valor}>{t.nome}</option>
          ))}
        </select>
      </label>

      <div className="space-y-1.5">
        <span className="rotulo-campo">Dados</span>
        {elemento.dados.map((d, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={d.rotulo}
              onChange={(e) => definirDado(i, 'rotulo', e.target.value)}
              className="campo-texto"
              placeholder="Rótulo"
            />
            <input
              type="number"
              value={d.valor}
              onChange={(e) => definirDado(i, 'valor', e.target.value)}
              className="campo-texto w-20"
            />
            <button
              onClick={() => aoMudar({ dados: elemento.dados.filter((_, j) => j !== i) })}
              className="shrink-0 px-1 text-red-500 hover:text-red-600"
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => aoMudar({ dados: [...elemento.dados, { rotulo: 'Novo', valor: 0 }] })}
          className="botao-secundario w-full"
        >
          + Adicionar linha
        </button>
      </div>

      <div>
        <span className="rotulo-campo">Importar CSV (rótulo,valor por linha)</span>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={3}
          placeholder={'Jan,40\nFev,65'}
          className="campo-texto resize-none rolagem-fina"
        />
        <button
          onClick={() => {
            const dados = csvParaDados(csv)
            if (dados.length) { aoMudar({ dados }); setCsv('') }
          }}
          className="botao-secundario mt-1 w-full"
        >
          Importar
        </button>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-superficie-700 dark:text-superficie-200">
        <input
          type="checkbox"
          checked={elemento.mostrarValores}
          onChange={(e) => aoMudar({ mostrarValores: e.target.checked })}
          className="h-4 w-4 rounded accent-primaria-500"
        />
        Mostrar valores
      </label>
      <CampoCor rotulo="Cor do texto" valor={elemento.corTexto} aoMudar={(v) => aoMudar({ corTexto: v })} />
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero rotulo="Largura" valor={elemento.largura} minimo={50} aoMudar={(v) => aoMudar({ largura: Math.max(50, v) })} />
        <CampoNumero rotulo="Altura" valor={elemento.altura} minimo={50} aoMudar={(v) => aoMudar({ altura: Math.max(50, v) })} />
      </div>
    </Secao>
  )
}

/** Editor de propriedades de tabela (células + tamanho) */
function SecaoTabela({
  elemento,
  aoMudar,
}: {
  elemento: Extract<Elemento, { tipo: 'tabela' }>
  aoMudar: (m: Partial<Elemento>) => void
}) {
  const colunas = Math.max(1, ...elemento.celulas.map((r) => r.length))
  const definirCelula = (r: number, c: number, valor: string) => {
    const celulas = elemento.celulas.map((linha, i) =>
      i === r ? linha.map((cel, j) => (j === c ? valor : cel)) : linha,
    )
    aoMudar({ celulas })
  }
  const addLinha = () => aoMudar({ celulas: [...elemento.celulas, Array(colunas).fill('')] })
  const addColuna = () => aoMudar({ celulas: elemento.celulas.map((r) => [...r, '']) })
  const remLinha = () => elemento.celulas.length > 1 && aoMudar({ celulas: elemento.celulas.slice(0, -1) })
  const remColuna = () => colunas > 1 && aoMudar({ celulas: elemento.celulas.map((r) => r.slice(0, -1)) })

  return (
    <Secao titulo="Tabela">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={addLinha} className="botao-secundario">+ Linha</button>
        <button onClick={remLinha} className="botao-secundario">− Linha</button>
        <button onClick={addColuna} className="botao-secundario">+ Coluna</button>
        <button onClick={remColuna} className="botao-secundario">− Coluna</button>
      </div>
      <div className="space-y-1">
        {elemento.celulas.map((linha, r) => (
          <div key={r} className="flex gap-1">
            {Array.from({ length: colunas }).map((_, c) => (
              <input
                key={c}
                value={linha[c] ?? ''}
                onChange={(e) => definirCelula(r, c, e.target.value)}
                className={`campo-texto px-1.5 py-1 text-xs ${r === 0 ? 'font-semibold' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <CampoCor rotulo="Cabeçalho" valor={elemento.corCabecalho} aoMudar={(v) => aoMudar({ corCabecalho: v })} />
      <CampoCor rotulo="Texto" valor={elemento.corTexto} aoMudar={(v) => aoMudar({ corTexto: v })} />
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero rotulo="Largura" valor={elemento.largura} minimo={50} aoMudar={(v) => aoMudar({ largura: Math.max(50, v) })} />
        <CampoNumero rotulo="Altura" valor={elemento.altura} minimo={40} aoMudar={(v) => aoMudar({ altura: Math.max(40, v) })} />
      </div>
    </Secao>
  )
}

// ---- Painel principal -------------------------------------------

export function PainelPropriedades() {
  const projeto = useEditorStore((s) => s.projeto)
  const pagina = usePaginaAtiva()
  const selecionados = useEditorStore((s) => s.selecionados)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)
  const definirCorFundo = useEditorStore((s) => s.definirCorFundo)
  const atualizarPagina = useEditorStore((s) => s.atualizarPagina)
  const duplicarSelecionados = useEditorStore((s) => s.duplicarSelecionados)
  const removerSelecionados = useEditorStore((s) => s.removerSelecionados)
  const alinharSelecionados = useEditorStore((s) => s.alinharSelecionados)
  const plano = usePlanoStore((s) => s.plano)
  const podeEditar = useColabStore((s) => s.papel === 'editor')

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

      {/* Corpo rolável (desabilitado em modo somente-leitura) */}
      <div
        className={`rolagem-fina flex-1 space-y-6 overflow-y-auto p-4 ${
          podeEditar ? '' : 'pointer-events-none select-none opacity-60'
        }`}
      >
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

            <Secao titulo="Apresentação (esta página)">
              <label className="block">
                <span className="rotulo-campo">Transição ao entrar</span>
                <select
                  value={pagina.transicao}
                  onChange={(evento) =>
                    atualizarPagina(pagina.id, {
                      transicao: evento.target.value as TransicaoSlide,
                    })
                  }
                  className="campo-texto"
                >
                  {TRANSICOES.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.nome}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="rotulo-campo">Notas do apresentador</span>
                <textarea
                  value={pagina.notas}
                  onChange={(evento) => atualizarPagina(pagina.id, { notas: evento.target.value })}
                  rows={3}
                  placeholder="Anotações visíveis só no modo apresentador…"
                  className="campo-texto resize-y rolagem-fina"
                />
              </label>
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
              <label className="block">
                <span className="rotulo-campo">Animação de entrada (apresentação)</span>
                <select
                  value={elementoUnico.animacao.tipo}
                  onChange={(evento) =>
                    atualizarElementos([elementoUnico.id], {
                      animacao: {
                        ...elementoUnico.animacao,
                        tipo: evento.target.value as TipoAnimacao,
                      },
                    })
                  }
                  className="campo-texto"
                >
                  {ANIMACOES.map((a) => (
                    <option key={a.valor} value={a.valor}>{a.nome}</option>
                  ))}
                </select>
              </label>
              {elementoUnico.animacao.tipo !== 'nenhuma' && (
                <div className="grid grid-cols-2 gap-3">
                  <CampoNumero
                    rotulo="Atraso (ms)"
                    valor={elementoUnico.animacao.atraso}
                    passo={50}
                    minimo={0}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], {
                        animacao: { ...elementoUnico.animacao, atraso: Math.max(0, valor) },
                      })
                    }
                  />
                  <CampoNumero
                    rotulo="Duração (ms)"
                    valor={elementoUnico.animacao.duracao}
                    passo={50}
                    minimo={100}
                    aoMudar={(valor) =>
                      atualizarElementos([elementoUnico.id], {
                        animacao: { ...elementoUnico.animacao, duracao: Math.max(100, valor) },
                      })
                    }
                  />
                </div>
              )}
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

                {/* Tipografia criativa: efeito + textura */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="rotulo-campo">Efeito</span>
                    <select
                      value={elementoUnico.efeito}
                      onChange={(e) =>
                        atualizarElementos([elementoUnico.id], { efeito: e.target.value as EfeitoTexto })
                      }
                      className="campo-texto"
                    >
                      {EFEITOS.map((o) => (
                        <option key={o.valor} value={o.valor}>{o.nome}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="rotulo-campo">Textura</span>
                    <select
                      value={elementoUnico.textura}
                      onChange={(e) =>
                        atualizarElementos([elementoUnico.id], { textura: e.target.value as TexturaTexto })
                      }
                      className="campo-texto"
                    >
                      {TEXTURAS.map((o) => (
                        <option key={o.valor} value={o.valor}>{o.nome}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </Secao>
            )}

            {/* Caminho (caneta vetorial) */}
            {elementoUnico.tipo === 'caminho' && (
              <Secao titulo="Caminho">
                <CampoSlider
                  rotulo="Curvatura"
                  valor={elementoUnico.tensao * 100}
                  min={0}
                  max={100}
                  aoMudar={(v) => atualizarElementos([elementoUnico.id], { tensao: v / 100 })}
                />
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-superficie-700 dark:text-superficie-200">
                  <input
                    type="checkbox"
                    checked={elementoUnico.fechado}
                    onChange={(e) => atualizarElementos([elementoUnico.id], { fechado: e.target.checked })}
                    className="h-4 w-4 rounded accent-primaria-500"
                  />
                  Fechar caminho (permite preenchimento)
                </label>
                {elementoUnico.fechado && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-superficie-700 dark:text-superficie-200">
                    <input
                      type="checkbox"
                      checked={elementoUnico.preenchimento !== 'transparent'}
                      onChange={(e) =>
                        atualizarElementos([elementoUnico.id], {
                          preenchimento: e.target.checked ? '#7c4dff' : 'transparent',
                        })
                      }
                      className="h-4 w-4 rounded accent-primaria-500"
                    />
                    Com preenchimento
                  </label>
                )}
                {elementoUnico.fechado && elementoUnico.preenchimento !== 'transparent' && (
                  <CampoCor
                    rotulo="Preenchimento"
                    valor={elementoUnico.preenchimento}
                    aoMudar={(v) => atualizarElementos([elementoUnico.id], { preenchimento: v })}
                  />
                )}
                <CampoCor
                  rotulo="Traço"
                  valor={elementoUnico.corBorda}
                  aoMudar={(v) => atualizarElementos([elementoUnico.id], { corBorda: v })}
                />
                <CampoNumero
                  rotulo="Espessura"
                  valor={elementoUnico.espessuraBorda}
                  minimo={0}
                  aoMudar={(v) => atualizarElementos([elementoUnico.id], { espessuraBorda: Math.max(0, v) })}
                />
              </Secao>
            )}

            {/* Gráfico */}
            {elementoUnico.tipo === 'grafico' && (
              <SecaoGrafico
                elemento={elementoUnico}
                aoMudar={(m) => atualizarElementos([elementoUnico.id], m)}
              />
            )}

            {/* Tabela */}
            {elementoUnico.tipo === 'tabela' && (
              <SecaoTabela
                elemento={elementoUnico}
                aoMudar={(m) => atualizarElementos([elementoUnico.id], m)}
              />
            )}

            {/* Formas: retângulo / elipse / triângulo / estrela */}
            {(elementoUnico.tipo === 'retangulo' ||
              elementoUnico.tipo === 'elipse' ||
              elementoUnico.tipo === 'triangulo' ||
              elementoUnico.tipo === 'estrela') && (
              <Secao titulo="Forma">
                <CamposDimensoes
                  largura={elementoUnico.largura}
                  altura={elementoUnico.altura}
                  aoMudar={(mudancas) => atualizarElementos([elementoUnico.id], mudancas)}
                />

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

                {/* Enquadramento: qual pedaço da foto aparece no quadro */}
                <Secao titulo="Enquadramento">
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    {(
                      [
                        { valor: 'preencher', nome: 'Preencher', ajuda: 'Recorta para não deformar' },
                        { valor: 'esticar', nome: 'Esticar', ajuda: 'Deforma para caber' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.valor}
                        type="button"
                        title={m.ajuda}
                        aria-pressed={elementoUnico.enquadramento === m.valor}
                        onClick={() =>
                          atualizarElementos([elementoUnico.id], { enquadramento: m.valor })
                        }
                        className={`rounded-lg border py-2 text-xs font-semibold transition ${
                          elementoUnico.enquadramento === m.valor
                            ? 'border-primaria-500 bg-primaria-50 text-primaria-600 dark:bg-primaria-900 dark:text-primaria-200'
                            : 'border-superficie-200 hover:bg-superficie-100 dark:border-superficie-700 dark:hover:bg-superficie-800'
                        }`}
                      >
                        {m.nome}
                      </button>
                    ))}
                  </div>

                  {elementoUnico.enquadramento === 'preencher' ? (
                    <>
                      <CampoSlider
                        rotulo="Aproximação"
                        valor={Math.round(elementoUnico.zoom * 100)}
                        min={100}
                        max={400}
                        aoMudar={(v) =>
                          atualizarElementos([elementoUnico.id], { zoom: v / 100 })
                        }
                      />
                      <CampoSlider
                        rotulo="Foco horizontal"
                        valor={Math.round(elementoUnico.foco.x * 100)}
                        min={0}
                        max={100}
                        aoMudar={(v) =>
                          atualizarElementos([elementoUnico.id], {
                            foco: { ...elementoUnico.foco, x: v / 100 },
                          })
                        }
                      />
                      <CampoSlider
                        rotulo="Foco vertical"
                        valor={Math.round(elementoUnico.foco.y * 100)}
                        min={0}
                        max={100}
                        aoMudar={(v) =>
                          atualizarElementos([elementoUnico.id], {
                            foco: { ...elementoUnico.foco, y: v / 100 },
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          atualizarElementos([elementoUnico.id], {
                            foco: { x: 0.5, y: 0.5 },
                            zoom: 1,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-superficie-200 py-1.5 text-xs font-medium text-superficie-700 transition hover:bg-superficie-100 dark:border-superficie-700 dark:text-superficie-200 dark:hover:bg-superficie-800"
                      >
                        Centralizar a foto
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-superficie-600 dark:text-superficie-400">
                      A foto acompanha o quadro e pode achatar. Use “Preencher” para
                      recortar em vez de deformar.
                    </p>
                  )}
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
