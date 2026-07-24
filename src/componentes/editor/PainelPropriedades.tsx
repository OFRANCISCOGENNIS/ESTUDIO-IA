// =============================================================
// PainelPropriedades — painel contextual da coluna direita (topo).
// Lê `projeto` e `selecionados` do store e edita SEMPRE via
// `atualizarElementos(selecionados, { campo: valor })`. Possui três
// modos: (A) nada selecionado → propriedades do canvas; (B) um único
// elemento → controles por tipo; (C) vários → alinhamento em lote.
// Não depende do Konva — só lê/escreve no store.
// =============================================================

import { type ReactNode } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { FONTES } from '../../dados/fontes'

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

// ---- Painel principal -------------------------------------------

export function PainelPropriedades() {
  const projeto = useEditorStore((s) => s.projeto)
  const selecionados = useEditorStore((s) => s.selecionados)
  const atualizarElementos = useEditorStore((s) => s.atualizarElementos)
  const definirCorFundo = useEditorStore((s) => s.definirCorFundo)
  const duplicarSelecionados = useEditorStore((s) => s.duplicarSelecionados)
  const removerSelecionados = useEditorStore((s) => s.removerSelecionados)
  const alinharSelecionados = useEditorStore((s) => s.alinharSelecionados)

  if (!projeto) return null

  // Elemento único (quando houver exatamente um selecionado existente)
  const elementoUnico =
    selecionados.length === 1
      ? projeto.elementos.find((e) => e.id === selecionados[0])
      : undefined

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
                valor={projeto.corFundo}
                aoMudar={(valor) => definirCorFundo(valor)}
              />
              <div className="grid grid-cols-8 gap-2">
                {PALETA_RAPIDA.map((cor) => {
                  const ativo = projeto.corFundo.toLowerCase() === cor.toLowerCase()
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

                {/* Preenchimento (com opção "sem preenchimento") */}
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
                  projeto.elementos.find((e) => selecionados.includes(e.id))?.opacidade ?? 1
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
