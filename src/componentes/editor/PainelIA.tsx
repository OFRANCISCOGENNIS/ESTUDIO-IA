// =============================================================
// PainelIA — recursos de Inteligência Artificial do editor.
// Fala apenas com o adaptador de IA (obterAdaptadorIA) e com o store;
// não conhece o provedor por trás. Cobre: texto para design, Magic
// Write (geração de texto por tom), sugestão de estilo e o
// redimensionamento mágico. Respeita as feature flags por plano.
// =============================================================

import { useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { criarTexto } from '../../nucleo/elementos'
import { obterAdaptadorIA } from '../../nucleo/ia/registro'
import { OpcaoDesignIA, TipoTextoIA, TomTexto } from '../../nucleo/ia/tipos'
import { PLANOS, recursoLiberado } from '../../dados/planos'
import { PREDEFINICOES } from '../../dados/predefinicoes'

const TONS: { id: TomTexto; nome: string }[] = [
  { id: 'profissional', nome: 'Profissional' },
  { id: 'descontraido', nome: 'Descontraído' },
  { id: 'ousado', nome: 'Ousado' },
  { id: 'amigavel', nome: 'Amigável' },
]

const TIPOS_TEXTO: { id: TipoTextoIA; nome: string; tamanho: number }[] = [
  { id: 'titulo', nome: 'Título', tamanho: 64 },
  { id: 'subtitulo', nome: 'Subtítulo', tamanho: 40 },
  { id: 'legenda', nome: 'Legenda', tamanho: 26 },
  { id: 'cta', nome: 'Botão (CTA)', tamanho: 32 },
]

const classeSecao = 'mb-2 text-xs font-bold uppercase tracking-wide text-superficie-700 dark:text-superficie-300'

export function PainelIA() {
  const projeto = useEditorStore((s) => s.projeto)
  const aplicarTemplate = useEditorStore((s) => s.aplicarTemplate)
  const adicionarElemento = useEditorStore((s) => s.adicionarElemento)
  const definirCorFundo = useEditorStore((s) => s.definirCorFundo)
  const redimensionarProjeto = useEditorStore((s) => s.redimensionarProjeto)
  const gerarVariacoesFormato = useEditorStore((s) => s.gerarVariacoesFormato)
  const plano = usePlanoStore((s) => s.plano)
  const definirPlano = usePlanoStore((s) => s.definirPlano)

  const [descricao, setDescricao] = useState('')
  const [opcoes, setOpcoes] = useState<OpcaoDesignIA[]>([])
  const [carregandoDesign, setCarregandoDesign] = useState(false)
  const [paletaSugerida, setPaletaSugerida] = useState<string[]>([])

  const [mwTipo, setMwTipo] = useState<TipoTextoIA>('titulo')
  const [mwAssunto, setMwAssunto] = useState('')
  const [mwTom, setMwTom] = useState<TomTexto>('profissional')
  const [mwOpcoes, setMwOpcoes] = useState<string[]>([])
  const [carregandoMW, setCarregandoMW] = useState(false)

  const [formatosSel, setFormatosSel] = useState<string[]>([])
  const [msgVariacoes, setMsgVariacoes] = useState('')

  if (!projeto) return null
  const podeRedimensionar = recursoLiberado('redimensionar-magico', plano)

  const centrarX = (largura: number) => projeto.larguraCanvas / 2 - largura / 2
  const centrarY = (altura: number) => projeto.alturaCanvas / 2 - altura / 2

  // ---- Texto para design ----
  const gerarDesign = async () => {
    setCarregandoDesign(true)
    try {
      const ia = obterAdaptadorIA()
      const [ops, sug] = await Promise.all([
        ia.gerarDesign(descricao),
        ia.sugerirEstilo(descricao),
      ])
      setOpcoes(ops)
      setPaletaSugerida(sug.paleta)
    } finally {
      setCarregandoDesign(false)
    }
  }

  const aplicarDesign = (op: OpcaoDesignIA) => {
    aplicarTemplate(op.gerarElementos(projeto.larguraCanvas, projeto.alturaCanvas), op.corFundo)
  }

  // ---- Magic Write ----
  const gerarTextos = async () => {
    setCarregandoMW(true)
    try {
      const ia = obterAdaptadorIA()
      setMwOpcoes(await ia.gerarTextos(mwTipo, mwAssunto, mwTom))
    } finally {
      setCarregandoMW(false)
    }
  }

  const inserirTexto = (texto: string) => {
    const tamanho = TIPOS_TEXTO.find((t) => t.id === mwTipo)?.tamanho ?? 40
    const largura = 520
    adicionarElemento(
      criarTexto(centrarX(largura), centrarY(tamanho * 1.2), {
        texto,
        tamanhoFonte: tamanho,
        negrito: mwTipo === 'titulo',
        largura,
      }),
    )
  }

  return (
    <div className="space-y-6">
      {/* Texto para design */}
      <section>
        <h3 className={classeSecao}>✨ Texto para design</h3>
        <p className="mb-2 text-xs text-superficie-600 dark:text-superficie-400">
          Descreva o que você quer e a IA cria 4 layouts editáveis.
        </p>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Ex.: post de hamburgueria, fundo escuro, estilo moderno"
          className="campo-texto resize-none rolagem-fina"
        />
        <button
          onClick={gerarDesign}
          disabled={carregandoDesign}
          className="botao-primario mt-2 w-full disabled:opacity-60"
        >
          {carregandoDesign ? 'Gerando…' : 'Gerar 4 opções'}
        </button>

        {/* Skeletons na dimensão exata enquanto a IA gera (§11.3) —
            nunca spinner de tela cheia; CLS = 0 ao trocar pelo resultado. */}
        {carregandoDesign && (
          <div className="mt-3 grid grid-cols-2 gap-2" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-superficie-200 dark:border-superficie-800">
                <div className="esqueleto h-12 rounded-none" />
                <div className="px-2 py-1">
                  <div className="esqueleto h-3 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!carregandoDesign && opcoes.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {opcoes.map((op, i) => (
              <button
                key={op.id}
                onClick={() => aplicarDesign(op)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="entra-item overflow-hidden rounded-lg border border-superficie-200 text-left shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 dark:border-superficie-800"
                title={`Aplicar: ${op.nome}`}
              >
                <div className="flex h-12">
                  {op.coresPreview.map((c, i) => (
                    <span key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="block truncate px-2 py-1 text-[0.7rem] font-medium text-superficie-800 dark:text-superficie-200">
                  {op.nome}
                </span>
              </button>
            ))}
          </div>
        )}

        {paletaSugerida.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-superficie-600 dark:text-superficie-400">
              Paleta sugerida (clique para usar no fundo)
            </p>
            <div className="flex gap-2">
              {paletaSugerida.map((cor) => (
                <button
                  key={cor}
                  onClick={() => definirCorFundo(cor)}
                  className="h-8 w-8 rounded-lg border border-superficie-200 transition hover:scale-110 dark:border-superficie-700"
                  style={{ backgroundColor: cor }}
                  title={cor}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Magic Write */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>🪄 Magic Write</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={mwTipo}
              onChange={(e) => setMwTipo(e.target.value as TipoTextoIA)}
              className="campo-texto"
              aria-label="Tipo de texto"
            >
              {TIPOS_TEXTO.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            <select
              value={mwTom}
              onChange={(e) => setMwTom(e.target.value as TomTexto)}
              className="campo-texto"
              aria-label="Tom"
            >
              {TONS.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
          <input
            value={mwAssunto}
            onChange={(e) => setMwAssunto(e.target.value)}
            placeholder="Assunto (ex.: cafeteria artesanal)"
            className="campo-texto"
          />
          <button
            onClick={gerarTextos}
            disabled={carregandoMW}
            className="botao-secundario w-full disabled:opacity-60"
          >
            {carregandoMW ? 'Gerando…' : 'Gerar textos'}
          </button>
        </div>
        {mwOpcoes.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {mwOpcoes.map((texto, i) => (
              <li key={i}>
                <button
                  onClick={() => inserirTexto(texto)}
                  className="w-full rounded-lg border border-superficie-200 bg-white px-3 py-2 text-left text-sm text-superficie-800 transition hover:border-primaria-300 hover:bg-primaria-50 dark:border-superficie-800 dark:bg-superficie-900 dark:text-superficie-200 dark:hover:bg-superficie-800"
                  title="Inserir no canvas"
                >
                  {texto}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Redimensionamento mágico */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>
          📐 Redimensionar {!podeRedimensionar && <span className="text-primaria-500">· Pro</span>}
        </h3>
        <p className="mb-2 text-xs text-superficie-600 dark:text-superficie-400">
          Converte o design atual (todas as páginas) para outro formato, reorganizando os elementos.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINICOES.slice(0, 6).map((pred) => {
            const atual = pred.largura === projeto.larguraCanvas && pred.altura === projeto.alturaCanvas
            return (
              <button
                key={pred.id}
                onClick={() => podeRedimensionar && redimensionarProjeto(pred.largura, pred.altura)}
                disabled={!podeRedimensionar || atual}
                className="flex items-center gap-2 rounded-lg border border-superficie-200 px-2 py-2 text-left text-xs transition enabled:hover:border-primaria-300 disabled:opacity-40 dark:border-superficie-800"
                title={atual ? 'Formato atual' : `${pred.largura}×${pred.altura}`}
              >
                <span>{pred.icone}</span>
                <span className="truncate text-superficie-800 dark:text-superficie-200">{pred.nome}</span>
              </button>
            )
          })}
        </div>
        {!podeRedimensionar && (
          <p className="mt-2 text-xs text-superficie-500 dark:text-superficie-400">
            🔒 Disponível no plano Pro.
          </p>
        )}
      </section>

      {/* Magic Resize — várias cópias de uma vez */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>
          ✨ Magic Resize {!podeRedimensionar && <span className="text-primaria-500">· Pro</span>}
        </h3>
        <p className="mb-2 text-xs text-superficie-600 dark:text-superficie-400">
          Selecione formatos e gere <strong>cópias</strong> do design em cada tamanho, de uma vez —
          o design atual continua intacto.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINICOES.map((pred) => {
            const atual = pred.largura === projeto.larguraCanvas && pred.altura === projeto.alturaCanvas
            const marcado = formatosSel.includes(pred.id)
            return (
              <button
                key={pred.id}
                onClick={() =>
                  setFormatosSel((atualSel) =>
                    marcado ? atualSel.filter((id) => id !== pred.id) : [...atualSel, pred.id],
                  )
                }
                disabled={!podeRedimensionar || atual}
                aria-pressed={marcado}
                className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition disabled:opacity-40 ${
                  marcado
                    ? 'border-primaria-400 bg-primaria-50 dark:border-primaria-500 dark:bg-primaria-500/10'
                    : 'border-superficie-200 enabled:hover:border-primaria-300 dark:border-superficie-800'
                }`}
                title={atual ? 'Formato atual' : `${pred.largura}×${pred.altura}`}
              >
                <span>{marcado ? '☑' : pred.icone}</span>
                <span className="truncate text-superficie-800 dark:text-superficie-200">{pred.nome}</span>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => {
            const escolhidos = PREDEFINICOES.filter((p) => formatosSel.includes(p.id))
            const n = gerarVariacoesFormato(
              escolhidos.map((p) => ({ nome: p.nome, largura: p.largura, altura: p.altura })),
            )
            setMsgVariacoes(
              n > 0
                ? `✅ ${n} ${n === 1 ? 'variação criada' : 'variações criadas'} — veja no seletor de projetos (topo).`
                : 'Selecione ao menos um formato diferente do atual.',
            )
            setFormatosSel([])
          }}
          disabled={!podeRedimensionar || formatosSel.length === 0}
          className="botao-primario mt-2 w-full disabled:pointer-events-none disabled:opacity-40"
        >
          Gerar {formatosSel.length > 0 ? `${formatosSel.length} ` : ''}variações
        </button>
        {msgVariacoes && (
          <p className="mt-2 text-xs text-superficie-600 dark:text-superficie-300">{msgVariacoes}</p>
        )}
      </section>

      {/* Seletor de plano (demonstração das feature flags) */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>Plano (demo)</h3>
        <select
          value={plano}
          onChange={(e) => definirPlano(e.target.value as typeof plano)}
          className="campo-texto"
          aria-label="Plano"
        >
          {PLANOS.map((p) => (
            <option key={p.id} value={p.id}>{p.nome} — {p.descricao}</option>
          ))}
        </select>
      </section>
    </div>
  )
}
