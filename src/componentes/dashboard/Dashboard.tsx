// =============================================================
// Dashboard / Home — tela inicial de nível mundial, fundindo o melhor
// de Canva (trilha + categorias coloridas + recentes), Adobe Firefly
// (prompt generativo em destaque) e Microsoft Designer (hero com abas
// "Criar com IA / Começar do zero"). Usa os tokens do redesign
// (docs/PROMPT-UI.md): gradiente de marca, sombras empilhadas, foco
// premium, coerência claro/escuro.
// =============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { CONTEXTOS, Contexto, PREDEFINICOES } from '../../dados/predefinicoes'
import { miniaturaTemplate, TEMPLATES } from '../../dados/templates'
import { BoasVindas } from './BoasVindas'
import { IconeLua, IconeSol } from '../icones/Icones'
import { useEditorStore } from '../../estado/useEditorStore'
import { ResumoProjeto, useProjetosStore } from '../../estado/useProjetosStore'
import { usePlanoStore } from '../../estado/usePlanoStore'
import { obterAdaptadorIA } from '../../nucleo/ia/registro'
import { tempoRelativo } from '../../utilitarios/tempo'
import { importarProjeto, lerArquivoTexto } from '../../nucleo/importacao'

interface Props {
  temaEscuro: boolean
  aoAlternarTema: () => void
}

type Secao = 'inicio' | 'projetos' | 'modelos'

/** Gradiente vibrante por categoria (estilo Canva/Designer) */
const CORES_CATEGORIA: Record<string, string> = {
  'post-instagram': 'from-pink-500 to-rose-500',
  story: 'from-fuchsia-500 to-purple-600',
  'thumbnail-youtube': 'from-red-500 to-orange-500',
  apresentacao: 'from-sky-500 to-blue-600',
  logo: 'from-teal-500 to-emerald-500',
  'cartao-visita': 'from-amber-500 to-orange-500',
  a4: 'from-slate-500 to-slate-700',
  'capa-ebook': 'from-green-500 to-lime-600',
}

// ---- Ícones (stroke 1.5, grid 24) ----
type IconeProps = { className?: string }
const Casa = ({ className }: IconeProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
)
const Pasta = ({ className }: IconeProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)
const Grade = ({ className }: IconeProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
const Lupa = ({ className }: IconeProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
  </svg>
)
const Faisca = ({ className }: IconeProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8z" /><path d="M18 14l.8 2.4L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.6z" />
  </svg>
)

export function Dashboard({ temaEscuro, aoAlternarTema }: Props) {
  const resumos = useProjetosStore((s) => s.resumos)
  const criarProjeto = useProjetosStore((s) => s.criarProjeto)
  const salvarProjeto = useProjetosStore((s) => s.salvarProjeto)
  const carregarProjeto = useProjetosStore((s) => s.carregarProjeto)
  const excluirProjeto = useProjetosStore((s) => s.excluirProjeto)
  const abrirProjeto = useEditorStore((s) => s.abrirProjeto)
  const plano = usePlanoStore((s) => s.plano)
  const definirPlano = usePlanoStore((s) => s.definirPlano)

  const [secao, setSecao] = useState<Secao>('inicio')
  const [abaHero, setAbaHero] = useState<'ia' | 'zero'>('ia')
  const [busca, setBusca] = useState('')
  const [promptIA, setPromptIA] = useState('')
  const [gerando, setGerando] = useState(false)
  const [dialogoPersonalizado, setDialogoPersonalizado] = useState(false)
  const [larguraCustom, setLarguraCustom] = useState('1080')
  const [alturaCustom, setAlturaCustom] = useState('1080')
  const [contexto, setContexto] = useState<Contexto | 'Todos'>('Todos')
  const [erroImportacao, setErroImportacao] = useState<string | null>(null)

  /**
   * Abre um .json baixado do editor. Contrapartida do "Baixar cópia":
   * sem isto, o arquivo de resgate não teria como voltar.
   */
  const aoAbrirArquivo = async (evento: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0]
    // Permite reabrir o mesmo arquivo depois de um erro
    evento.target.value = ''
    if (!arquivo) return

    setErroImportacao(null)
    try {
      const resultado = importarProjeto(await lerArquivoTexto(arquivo))
      if (!resultado.ok) {
        setErroImportacao(resultado.erro)
        return
      }
      salvarProjeto(resultado.projeto)
      abrirProjeto(resultado.projeto)
    } catch (erro) {
      setErroImportacao(erro instanceof Error ? erro.message : 'Não foi possível abrir o arquivo.')
    }
  }
  const refBusca = useRef<HTMLInputElement>(null)

  // Atalho "/" foca a busca central (§9.1) — fora de campos de texto
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey) return
      const alvo = e.target
      if (
        alvo instanceof HTMLElement &&
        (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
      ) {
        return
      }
      e.preventDefault()
      refBusca.current?.focus()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  const predefinicoesFiltradas = useMemo(
    () =>
      contexto === 'Todos'
        ? PREDEFINICOES
        : PREDEFINICOES.filter((p) => p.contexto === contexto),
    [contexto],
  )

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return resumos
    return resumos.filter((r) => r.nome.toLowerCase().includes(termo))
  }, [resumos, busca])

  const criarComTamanho = (nome: string, largura: number, altura: number) => {
    abrirProjeto(criarProjeto(nome, largura, altura))
  }

  const abrirExistente = (resumo: ResumoProjeto) => {
    const projeto = carregarProjeto(resumo.id)
    if (projeto) abrirProjeto(projeto)
  }

  const confirmarPersonalizado = () => {
    const largura = Math.min(8000, Math.max(50, Number(larguraCustom) || 1080))
    const altura = Math.min(8000, Math.max(50, Number(alturaCustom) || 1080))
    setDialogoPersonalizado(false)
    criarComTamanho('Design personalizado', largura, altura)
  }

  // Estado vazio: abre um canvas JÁ com template sugerido — nunca em branco (§9.2)
  const comecarPrimeiroDesign = () => {
    const sugerido = TEMPLATES[0]
    abrirProjeto(
      criarProjeto(
        'Meu primeiro design',
        1080,
        1080,
        sugerido.corFundo,
        sugerido.gerarElementos(1080, 1080),
      ),
    )
  }

  const criarDeTemplate = (id: string) => {
    const tpl = TEMPLATES.find((t) => t.id === id)
    if (!tpl) return
    abrirProjeto(criarProjeto(tpl.nome, 1080, 1080, tpl.corFundo, tpl.gerarElementos(1080, 1080)))
  }

  const gerarComIA = async () => {
    const desc = promptIA.trim()
    if (!desc || gerando) return
    setGerando(true)
    try {
      const opcoes = await obterAdaptadorIA().gerarDesign(desc)
      const op = opcoes[0]
      const nome = desc.length > 40 ? desc.slice(0, 40) + '…' : desc
      abrirProjeto(criarProjeto(nome, 1080, 1080, op.corFundo, op.gerarElementos(1080, 1080)))
    } finally {
      setGerando(false)
    }
  }

  const itensRail: { id: Secao; rotulo: string; Icone: (p: IconeProps) => JSX.Element }[] = [
    { id: 'inicio', rotulo: 'Início', Icone: Casa },
    { id: 'projetos', rotulo: 'Projetos', Icone: Pasta },
    { id: 'modelos', rotulo: 'Modelos', Icone: Grade },
  ]

  return (
    <div className="flex h-full bg-[--sup-elevada-2] dark:bg-superficie-950">
      {/* Boas-vindas do primeiro acesso */}
      <BoasVindas />

      {/* Trilha de navegação */}
      <nav className="flex w-[76px] shrink-0 flex-col items-center gap-1 border-r border-superficie-200/80 bg-[--sup-elevada-1] py-4 dark:border-superficie-800 dark:bg-superficie-900">
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl2 bg-marca text-lg font-black text-white shadow-[0_4px_16px_-4px_rgb(124_77_255/0.5)]">
          D
        </span>
        {itensRail.map(({ id, rotulo, Icone }) => {
          const ativo = secao === id
          return (
            <button
              key={id}
              onClick={() => setSecao(id)}
              aria-label={rotulo}
              aria-current={ativo}
              className={`group relative flex w-16 flex-col items-center gap-1 rounded-xl2 py-2.5 transition-[background-color,color] duration-micro ease-facil-padrao ${
                ativo
                  ? 'bg-primaria-500/12 text-primaria-600 dark:text-primaria-300'
                  : 'text-superficie-600 hover:bg-primaria-500/8 hover:text-superficie-900 dark:text-superficie-300 dark:hover:text-white'
              }`}
            >
              {ativo && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primaria-500" />
              )}
              <Icone className="h-6 w-6" />
              <span className="text-[0.65rem] font-semibold">{rotulo}</span>
            </button>
          )
        })}
        <div className="mt-auto">
          <button
            onClick={aoAlternarTema}
            className="botao-icone relative overflow-hidden"
            aria-label={temaEscuro ? 'Tema claro' : 'Tema escuro'}
            title={temaEscuro ? 'Tema claro' : 'Tema escuro'}
          >
            <span
              className={`absolute transition-[opacity,transform] duration-media ease-facil-padrao ${
                temaEscuro ? 'rotate-0 opacity-100' : '-rotate-180 opacity-0'
              }`}
            >
              <IconeSol tamanho={18} />
            </span>
            <span
              className={`absolute transition-[opacity,transform] duration-media ease-facil-padrao ${
                temaEscuro ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'
              }`}
            >
              <IconeLua tamanho={18} />
            </span>
          </button>
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="rolagem-fina flex-1 overflow-y-auto">
        {/* Topo fixo com busca central (§9.1) */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-superficie-200/70 bg-superficie-50/80 px-6 backdrop-blur-xl dark:border-superficie-800 dark:bg-superficie-900/80 estudio:px-10">
          <p className="hidden shrink-0 text-sm font-semibold text-superficie-700 dark:text-superficie-200 lg:block">
            DesignStudio <span className="text-primaria-600 dark:text-primaria-300">Pro</span>
          </p>
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-xl border border-superficie-200 bg-white px-3 transition-[border-color] duration-micro focus-within:border-primaria-400 dark:border-superficie-700 dark:bg-superficie-800">
            <Lupa className="h-4 w-4 shrink-0 text-superficie-500" />
            <input
              ref={refBusca}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setBusca('')}
              placeholder="Buscar seus projetos…"
              aria-label="Buscar projetos"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-superficie-500 dark:text-superficie-100"
            />
            <kbd className="hidden shrink-0 rounded border border-superficie-200 px-1.5 py-0.5 text-[10px] font-medium text-superficie-500 dark:border-superficie-700 sm:block">
              /
            </kbd>
          </div>
          {plano === 'gratuito' ? (
            <button
              onClick={() => definirPlano('pro')}
              className="shrink-0 whitespace-nowrap rounded-full bg-marca px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgb(124_77_255/0.5)] transition-transform duration-micro ease-facil-padrao hover:-translate-y-px active:scale-[0.97]"
            >
              👑 Fazer upgrade
            </button>
          ) : (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-primaria-500/12 px-4 py-2 text-sm font-semibold text-primaria-600 dark:text-primaria-300">
              Plano {plano === 'pro' ? 'Pro' : 'Time'} ✓
            </span>
          )}
        </header>

        <div className="mx-auto max-w-6xl px-6 py-6 estudio:px-10">

          {/* ===== BUSCA ATIVA (sobrepõe a seção atual) ===== */}
          {busca.trim() !== '' && (
            <SecaoProjetos
              titulo={`Resultados para "${busca.trim()}"`}
              projetos={projetosFiltrados}
              vazioTexto="Nada corresponde à busca."
              aoAbrir={abrirExistente}
              aoExcluir={excluirProjeto}
            />
          )}

          {/* ===== INÍCIO ===== */}
          {secao === 'inicio' && busca.trim() === '' && (
            <>
              {/* Hero */}
              <section className="relative mb-8 overflow-hidden rounded-2xl border border-superficie-200/70 bg-gradient-to-br from-primaria-50 via-white to-[#eef1ff] p-8 shadow-suave estudio:p-12 dark:border-superficie-800 dark:from-superficie-900 dark:via-superficie-900 dark:to-primaria-900/30">
                {/* Blobs decorativos */}
                <span className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-primaria-400/30 blur-3xl dark:bg-primaria-500/20" />
                <span className="pointer-events-none absolute -bottom-20 left-24 h-52 w-52 rounded-full bg-pink-400/25 blur-3xl dark:bg-pink-500/15" />

                <div className="relative mx-auto max-w-2xl text-center">
                  <h1 className="mb-1 text-3xl font-extrabold tracking-tight estudio:text-4xl">
                    <span className="bg-marca bg-clip-text text-transparent">Bora criar algo incrível?</span>
                  </h1>
                  <p className="mb-6 text-sm text-superficie-600 dark:text-superficie-300">
                    Descreva sua ideia e a IA monta — ou comece do zero.
                  </p>

                  {/* Abas do hero */}
                  <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-superficie-200 bg-white/70 p-1 backdrop-blur dark:border-superficie-700 dark:bg-superficie-800/70">
                    {([
                      { id: 'ia', rotulo: '✨ Criar com IA' },
                      { id: 'zero', rotulo: 'Começar do zero' },
                    ] as const).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setAbaHero(t.id)}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-[background-color,color] duration-micro ease-facil-padrao ${
                          abaHero === t.id
                            ? 'bg-primaria-500 text-white shadow-[0_2px_8px_-2px_rgb(124_77_255/0.6)]'
                            : 'text-superficie-600 hover:text-superficie-900 dark:text-superficie-300 dark:hover:text-white'
                        }`}
                      >
                        {t.rotulo}
                      </button>
                    ))}
                  </div>

                  {abaHero === 'ia' ? (
                    <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-superficie-200 bg-white p-2 shadow-painel dark:border-superficie-700 dark:bg-superficie-800">
                      <Faisca className="ml-2 h-5 w-5 shrink-0 text-primaria-500" />
                      <input
                        value={promptIA}
                        onChange={(e) => setPromptIA(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && gerarComIA()}
                        placeholder="Ex.: post de hamburgueria, fundo escuro, estilo moderno"
                        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-superficie-500 dark:text-superficie-100"
                        aria-label="Descreva o que quer criar"
                      />
                      <button
                        onClick={gerarComIA}
                        disabled={gerando || !promptIA.trim()}
                        className="botao-primario shrink-0 disabled:opacity-50"
                      >
                        {gerando ? 'Gerando…' : 'Gerar design'}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-superficie-600 dark:text-superficie-300">
                      Escolha um formato abaixo — ou{' '}
                      <button
                        onClick={() => setDialogoPersonalizado(true)}
                        className="font-semibold text-primaria-600 underline-offset-2 hover:underline dark:text-primaria-300"
                      >
                        defina um tamanho personalizado
                      </button>
                      .
                    </p>
                  )}
                </div>
              </section>

              {/* Continuar de onde parou (§9.1) — ~80% das sessões são retomadas */}
              {resumos.length > 0 && (
                <section className="mb-10">
                  <h2 className="mb-4 text-lg font-bold text-superficie-900 dark:text-white">
                    Continuar de onde parou
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {resumos.slice(0, 3).map((r, i) => (
                      <button
                        key={r.id}
                        onClick={() => abrirExistente(r)}
                        style={{ animationDelay: `${i * 40}ms` }}
                        className="entra-item group overflow-hidden rounded-xl2 border border-superficie-200 bg-white text-left shadow-suave transition-[transform,box-shadow] duration-micro ease-facil-saida hover:-translate-y-1 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
                      >
                        <div className="flex aspect-video items-center justify-center overflow-hidden bg-[--sup-elevada-2] dark:bg-superficie-850">
                          {r.miniatura ? (
                            <img
                              src={r.miniatura}
                              alt={`Miniatura de ${r.nome}`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-3xl opacity-40">🎨</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">
                              {r.nome}
                            </span>
                            <span className="block text-xs text-superficie-500">
                              {tempoRelativo(r.atualizadoEm)}
                            </span>
                          </span>
                          <span className="shrink-0 rounded-full bg-primaria-500/12 px-2.5 py-1 text-[11px] font-semibold text-primaria-600 opacity-0 transition-opacity duration-micro group-hover:opacity-100 dark:text-primaria-300">
                            Retomar
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Criar um design — chips por contexto (§9.1) */}
              <section className="relative mb-10">
                {/* Único brand moment decorativo permitido */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-primaria-500/20 blur-3xl"
                />
                <div className="relative mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-superficie-900 dark:text-white">Criar um design</h2>
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-superficie-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-superficie-700 transition-colors duration-micro hover:border-primaria-300 hover:text-primaria-600 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primaria-500 dark:border-superficie-800 dark:bg-superficie-900 dark:text-superficie-200 dark:hover:text-primaria-300">
                    <span aria-hidden="true">📂</span>
                    Abrir arquivo
                    <input
                      type="file"
                      accept="application/json,.json"
                      hidden
                      onChange={aoAbrirArquivo}
                    />
                  </label>
                </div>

                {erroImportacao && (
                  <p
                    role="alert"
                    className="relative mb-4 rounded-xl2 border border-perigo-400/40 bg-perigo-50 px-3 py-2 text-sm text-perigo-600 dark:bg-perigo-950/50 dark:text-perigo-400"
                  >
                    {erroImportacao}
                  </p>
                )}

                {/* Chips roláveis que filtram a grade */}
                <div className="rolagem-fina relative mb-5 flex snap-x gap-2 overflow-x-auto pb-1">
                  {(['Todos', ...CONTEXTOS] as const).map((ctx) => {
                    const ativo = ctx === contexto
                    return (
                      <button
                        key={ctx}
                        onClick={() => setContexto(ctx)}
                        aria-pressed={ativo}
                        className={`shrink-0 snap-start rounded-full px-3.5 py-1.5 text-sm font-semibold transition-[background-color,color] duration-micro ease-facil-padrao ${
                          ativo
                            ? 'bg-primaria-500 text-white shadow-[0_2px_8px_-2px_rgb(124_77_255/0.6)]'
                            : 'bg-white text-superficie-600 hover:text-superficie-900 dark:bg-superficie-800 dark:text-superficie-300 dark:hover:text-white'
                        }`}
                      >
                        {ctx}
                      </button>
                    )
                  })}
                </div>

                <div className="relative flex flex-wrap gap-x-6 gap-y-5">
                  {predefinicoesFiltradas.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => criarComTamanho(p.nome, p.largura, p.altura)}
                      style={i < 8 ? { animationDelay: `${i * 40}ms` } : undefined}
                      className={`group flex w-20 flex-col items-center gap-2 text-center ${i < 8 ? 'entra-item' : ''}`}
                      title={`${p.largura} × ${p.altura} px`}
                    >
                      <span
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${CORES_CATEGORIA[p.id] ?? 'from-primaria-500 to-primaria-700'} text-2xl text-white shadow-painel transition-transform duration-micro ease-facil-saida group-hover:-translate-y-1 group-hover:scale-105`}
                      >
                        {p.icone}
                      </span>
                      <span className="text-xs font-semibold leading-tight text-superficie-800 dark:text-superficie-200">
                        {p.nome}
                      </span>
                    </button>
                  ))}

                  {/* Cartão fantasma pontilhado no fim da linha */}
                  <button
                    onClick={() => setDialogoPersonalizado(true)}
                    className="group flex w-20 flex-col items-center gap-2 text-center"
                    title="Definir largura e altura"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-superficie-200 text-2xl text-superficie-500 transition-[border-color,color,transform] duration-micro ease-facil-saida group-hover:-translate-y-1 group-hover:border-primaria-400 group-hover:text-primaria-500 dark:border-superficie-700">
                      +
                    </span>
                    <span className="text-xs font-semibold leading-tight text-superficie-800 dark:text-superficie-200">
                      Personalizado
                    </span>
                  </button>
                </div>
              </section>

              {/* Recentes (além dos 3 em destaque) */}
              {resumos.length > 3 && (
                <SecaoProjetos
                  titulo="Recentes"
                  projetos={resumos.slice(3, 13)}
                  vazioTexto=""
                  aoAbrir={abrirExistente}
                  aoExcluir={excluirProjeto}
                  acaoVerTodos={resumos.length > 13 ? () => setSecao('projetos') : undefined}
                />
              )}

              {/* Estado vazio memorável (§9.2) */}
              {resumos.length === 0 && <PrimeiraObra aoComecar={comecarPrimeiroDesign} />}
            </>
          )}

          {/* ===== PROJETOS ===== */}
          {secao === 'projetos' && (
            <>
              <div className="mb-5 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-superficie-900 dark:text-white">Seus projetos</h1>
                <div className="ml-auto flex items-center gap-2 rounded-xl border border-superficie-200 bg-white px-3 dark:border-superficie-700 dark:bg-superficie-800">
                  <Lupa className="h-4 w-4 text-superficie-500" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar…"
                    className="w-56 bg-transparent py-2 text-sm outline-none placeholder:text-superficie-500 dark:text-superficie-100"
                    aria-label="Buscar projetos"
                  />
                </div>
              </div>
              <SecaoProjetos
                projetos={projetosFiltrados}
                vazioTexto={resumos.length === 0 ? 'Nenhum projeto ainda.' : 'Nada corresponde à busca.'}
                aoAbrir={abrirExistente}
                aoExcluir={excluirProjeto}
              />
            </>
          )}

          {/* ===== MODELOS ===== */}
          {secao === 'modelos' && (
            <>
              <h1 className="mb-1 text-2xl font-bold text-superficie-900 dark:text-white">Modelos prontos</h1>
              <p className="mb-5 text-sm text-superficie-600 dark:text-superficie-300">
                Comece a partir de um modelo e personalize à vontade.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 estudio:grid-cols-4">
                {TEMPLATES.map((tpl, i) => (
                  <button
                    key={tpl.id}
                    onClick={() => criarDeTemplate(tpl.id)}
                    style={i < 8 ? { animationDelay: `${i * 40}ms` } : undefined}
                    className={`group overflow-hidden rounded-xl2 border border-superficie-200 bg-white text-left shadow-suave transition-[transform,box-shadow] duration-micro ease-facil-saida hover:-translate-y-1 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 ${
                      i < 8 ? 'entra-item' : ''
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-superficie-100 dark:bg-superficie-950">
                      <img
                        src={miniaturaTemplate(tpl)}
                        alt={`Prévia de ${tpl.nome}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-media ease-facil-saida group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">{tpl.nome}</p>
                      <p className="text-xs text-superficie-500">{tpl.categoria}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Diálogo de tamanho personalizado */}
      {dialogoPersonalizado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setDialogoPersonalizado(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[--sup-flutuante] p-6 shadow-flutuante dark:text-superficie-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-superficie-900 dark:text-white">Tamanho personalizado</h3>
            <div className="mb-4 flex items-end gap-3">
              <label className="flex-1">
                <span className="rotulo-campo">Largura (px)</span>
                <input type="number" min={50} max={8000} value={larguraCustom} onChange={(e) => setLarguraCustom(e.target.value)} className="campo-texto" />
              </label>
              <span className="pb-2 text-superficie-500">×</span>
              <label className="flex-1">
                <span className="rotulo-campo">Altura (px)</span>
                <input type="number" min={50} max={8000} value={alturaCustom} onChange={(e) => setAlturaCustom(e.target.value)} className="campo-texto" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDialogoPersonalizado(false)} className="botao-secundario">Cancelar</button>
              <button onClick={confirmarPersonalizado} className="botao-primario">Criar design</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Grade de projetos reutilizável ----
/**
 * Estado vazio memorável (§9.2): ilustração de linha de prancheta com
 * faísca, uma frase e um CTA único que abre um canvas já com template.
 */
function PrimeiraObra({ aoComecar }: { aoComecar: () => void }) {
  return (
    <section className="flex flex-col items-center px-6 py-14 text-center">
      <svg
        width="132"
        height="112"
        viewBox="0 0 132 112"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mb-6 text-primaria-400"
      >
        {/* Prancheta */}
        <rect x="22" y="14" width="72" height="86" rx="6" />
        <path d="M46 14v-4a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v4" />
        <path d="M36 44h30M36 58h44M36 72h24" opacity="0.55" />
        {/* Faísca da marca */}
        <path d="M104 26l3.4 9.1 9.1 3.4-9.1 3.4L104 51l-3.4-9.1-9.1-3.4 9.1-3.4L104 26Z" />
        <path d="M118 60l1.7 4.6 4.6 1.7-4.6 1.7L118 73l-1.7-5-4.6-1.7 4.6-1.7L118 60Z" opacity="0.7" />
      </svg>

      <h2 className="mb-2 text-xl font-bold text-superficie-900 dark:text-white">
        Sua primeira obra começa aqui.
      </h2>
      <p className="mb-6 max-w-sm text-sm text-superficie-600 dark:text-superficie-300">
        Abrimos um canvas já com um modelo pronto — é só trocar o texto e as cores.
      </p>
      <button
        onClick={aoComecar}
        className="rounded-xl2 bg-primaria-500 px-6 py-3 text-sm font-semibold text-white shadow-suave transition-[transform,box-shadow,background-color] duration-micro ease-facil-saida hover:scale-[1.02] hover:bg-primaria-600 hover:shadow-painel active:scale-[0.99]"
      >
        Criar meu primeiro design
      </button>
    </section>
  )
}

function SecaoProjetos({
  titulo,
  projetos,
  vazioTexto,
  aoAbrir,
  aoExcluir,
  acaoVerTodos,
}: {
  titulo?: string
  projetos: ResumoProjeto[]
  vazioTexto: string
  aoAbrir: (r: ResumoProjeto) => void
  aoExcluir: (id: string) => void
  acaoVerTodos?: () => void
}) {
  return (
    <section>
      {titulo && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-superficie-900 dark:text-white">{titulo}</h2>
          {acaoVerTodos && (
            <button onClick={acaoVerTodos} className="text-sm font-semibold text-primaria-600 hover:underline dark:text-primaria-300">
              Ver todos
            </button>
          )}
        </div>
      )}
      {projetos.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-superficie-300 bg-white/50 p-12 text-center text-sm text-superficie-600 dark:border-superficie-700 dark:bg-superficie-900/50 dark:text-superficie-300">
          {vazioTexto}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 estudio:grid-cols-5">
          {projetos.map((r, i) => (
            <div
              key={r.id}
              // Stagger de 40ms, teto de 8 itens (§7.5)
              style={i < 8 ? { animationDelay: `${i * 40}ms` } : undefined}
              className={`group relative overflow-hidden rounded-xl2 border border-superficie-200 bg-white shadow-suave transition-[transform,box-shadow] duration-micro ease-facil-saida hover:-translate-y-1 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 ${
                i < 8 ? 'entra-item' : ''
              }`}
            >
              <button onClick={() => aoAbrir(r)} className="block w-full text-left">
                <div className="flex aspect-square items-center justify-center overflow-hidden bg-[--sup-elevada-2] dark:bg-superficie-850">
                  {r.miniatura ? (
                    <img src={r.miniatura} alt={`Miniatura de ${r.nome}`} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-3xl opacity-40">🎨</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">{r.nome}</p>
                  <p className="text-xs text-superficie-500">
                    {r.larguraCanvas} × {r.alturaCanvas} · {tempoRelativo(r.atualizadoEm)}
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir "${r.nome}"? Esta ação não pode ser desfeita.`)) aoExcluir(r.id)
                }}
                className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-sm shadow-suave transition hover:bg-red-50 group-hover:flex dark:bg-superficie-800/90 dark:hover:bg-red-900/40"
                title="Excluir projeto"
                aria-label={`Excluir ${r.nome}`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
