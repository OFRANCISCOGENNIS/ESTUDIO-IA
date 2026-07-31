// =============================================================
// BarraFerramentas — barra lateral esquerda do editor.
// Uma trilha vertical de abas (ícones) + um painel expansível
// à direita com o conteúdo da aba ativa. Os painéis apenas
// leem/escrevem no store; não conhecem o Konva.
// =============================================================

import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { usaTelaCompacta } from '../../hooks/usaTelaCompacta'
import { useEditorStore } from '../../estado/useEditorStore'
import { useUiStore } from '../../estado/useUiStore'
import { criarForma, criarGrafico, criarImagem, criarLinha, criarTabela, criarTexto } from '../../nucleo/elementos'
import { CATEGORIAS_TEMPLATE, CategoriaTemplate, miniaturaTemplate, TEMPLATES } from '../../dados/templates'
import { TEMAS_COR } from '../../dados/temas'
import { PARES_FONTES, ParFonte } from '../../dados/fontes'
import { FOTOS, ICONES, ItemGaleria, STICKERS } from '../../dados/galeria'
import { carregarArquivoImagem, ImagemCarregada } from '../../utilitarios/imagem'
import { dimensionarParaCanvas } from '../../nucleo/insercaoImagem'
import { PainelIA } from './PainelIA'
import { PainelMarca } from './PainelMarca'
import { PainelColab } from './PainelColab'
import { PainelTime } from './PainelTime'
import { listarPlugins } from '../../nucleo/plugins/registro'
import { qrParaSvgDataUrl } from '../../nucleo/qr'
import {
  IconeAlvo,
  IconeBlocos,
  IconeFaisca,
  IconeFormas,
  IconeFoto,
  IconeLapis,
  IconePaleta,
  IconeQr,
  IconePessoas,
  IconePredio,
  IconeTipoTexto,
  IconeUpload,
} from '../icones/Icones'

/** Identificadores das abas da trilha lateral */
type Aba =
  | 'Templates' | 'Elementos' | 'Texto' | 'Uploads' | 'Fotos'
  | 'IA' | 'Marca' | 'Colaborar' | 'Time' | 'Apps'

/** Trilha em 4 grupos semânticos (lei de Hick) — "Projetos" mora no
 *  seletor do breadcrumb da barra superior. */
const GRUPOS_ABAS: { id: Aba; Icone: (p: { tamanho?: number }) => JSX.Element }[][] = [
  // Criar
  [
    { id: 'Templates', Icone: IconePaleta },
    { id: 'Elementos', Icone: IconeFormas },
    { id: 'Texto', Icone: IconeTipoTexto },
  ],
  // Mídia
  [
    { id: 'Uploads', Icone: IconeUpload },
    { id: 'Fotos', Icone: IconeFoto },
    { id: 'IA', Icone: IconeFaisca },
  ],
  // Marca
  [
    { id: 'Marca', Icone: IconeAlvo },
    { id: 'Apps', Icone: IconeBlocos },
  ],
  // Pessoas
  [
    { id: 'Colaborar', Icone: IconePessoas },
    { id: 'Time', Icone: IconePredio },
  ],
]

/** Formas básicas oferecidas na aba Elementos */
const FORMAS: { tipo: 'retangulo' | 'elipse' | 'triangulo' | 'estrela'; rotulo: string; icone: string }[] = [
  { tipo: 'retangulo', rotulo: 'Retângulo', icone: '▭' },
  { tipo: 'elipse', rotulo: 'Elipse', icone: '⬭' },
  { tipo: 'triangulo', rotulo: 'Triângulo', icone: '△' },
  { tipo: 'estrela', rotulo: 'Estrela', icone: '★' },
]

const classeRotuloSecao =
  'mb-2 text-xs font-bold uppercase tracking-wide text-superficie-700 dark:text-superficie-300'

const classeItemGaleria =
  'flex aspect-square items-center justify-center rounded-xl2 border border-superficie-200 bg-white p-2 shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900'

const classeBotaoBloco =
  'flex flex-col items-center gap-1 rounded-xl2 border border-superficie-200 bg-white py-3 text-xs font-semibold text-superficie-900 shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 dark:text-superficie-100'

export function BarraFerramentas() {
  const projeto = useEditorStore((s) => s.projeto)
  const adicionarElemento = useEditorStore((s) => s.adicionarElemento)
  const definirFerramenta = useEditorStore((s) => s.definirFerramenta)
  const aplicarTemplate = useEditorStore((s) => s.aplicarTemplate)
  const recolorirDesignAtivo = useEditorStore((s) => s.recolorirDesignAtivo)

  // Aba ativa mora no store de UI para a paleta de comandos poder trocá-la
  const aba = useUiStore((s) => s.abaFerramentas) as Aba
  const definirAba = useUiStore((s) => s.definirAba)
  const compacta = usaTelaCompacta()
  // Em tela compacta o painel começa fechado: quem abre o editor no
  // celular quer ver o design, não a lista de modelos.
  const [recolhido, setRecolhido] = useState(compacta)
  useEffect(() => setRecolhido(compacta), [compacta])
  const [uploads, setUploads] = useState<ImagemCarregada[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaTemplate | 'Todos'>('Todos')
  const [buscaTemplate, setBuscaTemplate] = useState('')
  const [qrTexto, setQrTexto] = useState('')
  const [erroQr, setErroQr] = useState('')

  // Indicador deslizante da aba ativa (posição medida do botão real)
  const refTrilha = useRef<HTMLDivElement>(null)
  const refsAbas = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicador, setIndicador] = useState({ y: 0, altura: 0 })

  // Trocar de aba por fora (paleta de comandos) reabre o painel — mas
  // não na montagem, que reabriria o painel recolhido da tela compacta.
  const primeiraAba = useRef(true)
  useEffect(() => {
    if (primeiraAba.current) {
      primeiraAba.current = false
      return
    }
    setRecolhido(false)
  }, [aba])

  // Recalcula a posição do indicador quando a aba ativa muda
  useLayoutEffect(() => {
    const botao = refsAbas.current[aba]
    const trilha = refTrilha.current
    if (!botao || !trilha || recolhido) {
      setIndicador((i) => ({ ...i, altura: 0 }))
      return
    }
    // offsetTop é relativo à trilha (que é `relative`), imune ao scroll
    const alturaBarra = 24
    setIndicador({
      y: botao.offsetTop + (botao.offsetHeight - alturaBarra) / 2,
      altura: alturaBarra,
    })
  }, [aba, recolhido])

  // Sem projeto aberto não há canvas para editar
  if (!projeto) return null

  // ---- Posicionamento centralizado (canto sup-esq do elemento) ----
  const centrarX = (largura: number) => projeto.larguraCanvas / 2 - largura / 2
  const centrarY = (altura: number) => projeto.alturaCanvas / 2 - altura / 2

  // ---- Ações de inserção ----
  const inserirForma = (tipo: (typeof FORMAS)[number]['tipo']) => {
    const largura = 200
    const altura = tipo === 'estrela' ? 200 : 150
    adicionarElemento(criarForma(tipo, centrarX(largura), centrarY(altura)))
  }

  const inserirLinha = () => {
    const largura = 240
    adicionarElemento(criarLinha(centrarX(largura), projeto.alturaCanvas / 2))
  }

  const inserirImagemGaleria = (item: ItemGaleria, base: number) => {
    const largura = base
    const altura = base / item.proporcao
    adicionarElemento(criarImagem(item.url, centrarX(largura), centrarY(altura), largura, altura))
  }

  const inserirImagemCarregada = (img: ImagemCarregada) => {
    // A compressão devolve até 1600 px; inserir nesse tamanho fazia a
    // foto nascer maior que um artboard de 1080 e sair pelas bordas.
    const { largura, altura } = dimensionarParaCanvas(img, {
      largura: projeto.larguraCanvas,
      altura: projeto.alturaCanvas,
    })
    adicionarElemento(
      criarImagem(img.url, centrarX(largura), centrarY(altura), largura, altura),
    )
  }

  const inserirTexto = (
    texto: string,
    tamanhoFonte: number,
    negrito = false,
  ) => {
    const largura = 480
    const altura = tamanhoFonte * 1.2
    adicionarElemento(
      criarTexto(centrarX(largura), centrarY(altura), { texto, tamanhoFonte, negrito }),
    )
  }

  const inserirParFontes = (par: ParFonte) => {
    const largura = 480
    const tamTitulo = 64
    const tamCorpo = 26
    const alturaTitulo = tamTitulo * 1.2
    const espaco = 16
    const alturaTotal = alturaTitulo + espaco + tamCorpo * 1.4
    const x = centrarX(largura)
    const yTitulo = projeto.alturaCanvas / 2 - alturaTotal / 2
    adicionarElemento(
      criarTexto(x, yTitulo, {
        texto: 'Título',
        fonte: par.titulo,
        tamanhoFonte: tamTitulo,
        negrito: true,
      }),
    )
    adicionarElemento(
      criarTexto(x, yTitulo + alturaTitulo + espaco, {
        texto: 'Corpo de texto para acompanhar o título.',
        fonte: par.corpo,
        tamanhoFonte: tamCorpo,
      }),
    )
  }

  const aoSelecionarArquivos = async (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivos = evento.target.files
    if (!arquivos) return
    for (const arquivo of Array.from(arquivos)) {
      try {
        const img = await carregarArquivoImagem(arquivo)
        setUploads((atual) => [img, ...atual])
        inserirImagemCarregada(img)
      } catch (erro) {
        console.error('Falha ao carregar imagem enviada', erro)
      }
    }
    // Permite reenviar o mesmo arquivo em seguida
    evento.target.value = ''
  }

  // ---- Navegação por setas na trilha (padrão tablist, §10.3) ----
  const aoTeclarNaTrilha = (e: React.KeyboardEvent) => {
    const ordem = GRUPOS_ABAS.flat().map((i) => i.id)
    const atual = ordem.indexOf(aba)
    let destino = -1
    if (e.key === 'ArrowDown') destino = (atual + 1) % ordem.length
    else if (e.key === 'ArrowUp') destino = (atual - 1 + ordem.length) % ordem.length
    else if (e.key === 'Home') destino = 0
    else if (e.key === 'End') destino = ordem.length - 1
    if (destino < 0) return
    e.preventDefault()
    const id = ordem[destino]
    definirAba(id)
    setRecolhido(false)
    refsAbas.current[id]?.focus()
  }

  // ---- Troca de aba: clicar na aba ativa recolhe o painel ----
  const selecionarAba = (id: Aba) => {
    if (id === aba) {
      setRecolhido((r) => !r)
    } else {
      definirAba(id)
      setRecolhido(false)
    }
  }

  const renderConteudo = () => {
    switch (aba) {
      case 'Templates': {
        const norm = (s: string) =>
          s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const q = norm(buscaTemplate.trim())
        const templatesFiltrados = TEMPLATES.filter(
          (t) =>
            (filtroCategoria === 'Todos' || t.categoria === filtroCategoria) &&
            (q === '' || norm(t.nome).includes(q) || norm(t.categoria).includes(q)),
        )
        const temasVisiveis = TEMAS_COR.filter((t) => t.cores.length > 0)
        const embaralharCores = () => {
          const t = temasVisiveis[Math.floor(Math.random() * temasVisiveis.length)]
          if (t) recolorirDesignAtivo(t.cores)
        }
        return (
          <div className="space-y-5">
            {/* Estilos de cor: recolore o design inteiro com um clique */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className={classeRotuloSecao + ' mb-0'}>Estilos de cor</h3>
                <button
                  onClick={embaralharCores}
                  className="text-xs font-semibold text-primaria-600 transition hover:text-primaria-500 dark:text-primaria-300"
                  title="Aplicar uma paleta aleatória ao design"
                >
                  🎲 Embaralhar
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {temasVisiveis.map((tema) => (
                  <button
                    key={tema.id}
                    onClick={() => recolorirDesignAtivo(tema.cores)}
                    title={`Aplicar tema ${tema.nome}`}
                    className="group rounded-xl2 border border-superficie-200 p-1 transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800"
                  >
                    <span className="flex h-7 overflow-hidden rounded-lg">
                      {tema.cores.map((c, i) => (
                        <span key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-medium text-superficie-700 dark:text-superficie-300">
                      {tema.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modelos com busca + filtro de categoria */}
            <div>
              <h3 className={classeRotuloSecao}>Modelos</h3>
              <input
                value={buscaTemplate}
                onChange={(e) => setBuscaTemplate(e.target.value)}
                placeholder="Buscar modelos…"
                className="campo-texto mb-2"
                aria-label="Buscar modelos"
              />
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(['Todos', ...CATEGORIAS_TEMPLATE] as const).map((cat) => {
                  const ativo = cat === filtroCategoria
                  return (
                    <button
                      key={cat}
                      onClick={() => setFiltroCategoria(cat)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        ativo
                          ? 'bg-primaria-500 text-white'
                          : 'bg-superficie-100 text-superficie-700 hover:bg-superficie-200 dark:bg-superficie-800 dark:text-superficie-200 dark:hover:bg-superficie-700'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
              {templatesFiltrados.length === 0 ? (
                <p className="py-6 text-center text-xs text-superficie-500 dark:text-superficie-400">
                  Nenhum modelo encontrado.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {templatesFiltrados.map((tpl, i) => (
                    <button
                      key={tpl.id}
                      // Stagger de 40ms com teto de 8 itens (§7.5)
                      style={i < 8 ? { animationDelay: `${i * 40}ms` } : undefined}
                      onClick={() =>
                        aplicarTemplate(
                          tpl.gerarElementos(projeto.larguraCanvas, projeto.alturaCanvas),
                          tpl.corFundo,
                        )
                      }
                      title={`${tpl.nome} · ${tpl.categoria}`}
                      className={`group overflow-hidden rounded-xl2 border border-superficie-200 bg-white text-left shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 ${
                        i < 8 ? 'entra-item' : ''
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-superficie-100 dark:bg-superficie-950">
                        <img
                          src={miniaturaTemplate(tpl)}
                          alt={`Prévia de ${tpl.nome}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold text-superficie-900 dark:text-superficie-100">
                          {tpl.nome}
                        </p>
                        <p className="text-[10px] text-superficie-600 dark:text-superficie-300">
                          {tpl.categoria}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }

      case 'Elementos':
        return (
          <div className="space-y-5">
            <div>
              <h3 className={classeRotuloSecao}>Formas</h3>
              <div className="grid grid-cols-3 gap-2">
                {FORMAS.map((forma) => (
                  <button
                    key={forma.tipo}
                    onClick={() => inserirForma(forma.tipo)}
                    className={classeBotaoBloco}
                    title={forma.rotulo}
                  >
                    <span className="text-2xl leading-none text-primaria-500">
                      {forma.icone}
                    </span>
                    <span>{forma.rotulo}</span>
                  </button>
                ))}
                <button
                  onClick={inserirLinha}
                  className={classeBotaoBloco}
                  title="Linha"
                >
                  <span className="text-2xl leading-none text-primaria-500">➖</span>
                  <span>Linha</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className={classeRotuloSecao}>Vetor e dados</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => definirFerramenta('caneta')}
                  className={classeBotaoBloco}
                  title="Caneta vetorial (P) — clique para criar pontos, Enter/duplo clique finaliza"
                >
                  <span className="text-2xl leading-none text-primaria-500">✒️</span>
                  <span>Caneta</span>
                </button>
                <button
                  onClick={() => definirFerramenta('lapis')}
                  className={classeBotaoBloco}
                  title="Lápis (B) — desenhe à mão livre arrastando o mouse"
                >
                  <span className="text-primaria-500">
                    <IconeLapis tamanho={24} />
                  </span>
                  <span>Lápis</span>
                </button>
                <button
                  onClick={() =>
                    adicionarElemento(criarGrafico(centrarX(480), centrarY(320)))
                  }
                  className={classeBotaoBloco}
                  title="Gráfico"
                >
                  <span className="text-2xl leading-none text-primaria-500">📊</span>
                  <span>Gráfico</span>
                </button>
                <button
                  onClick={() =>
                    adicionarElemento(criarTabela(centrarX(520), centrarY(180)))
                  }
                  className={classeBotaoBloco}
                  title="Tabela"
                >
                  <span className="text-2xl leading-none text-primaria-500">▦</span>
                  <span>Tabela</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className={classeRotuloSecao}>QR Code</h3>
              <div className="flex gap-2">
                <input
                  value={qrTexto}
                  onChange={(e) => {
                    setQrTexto(e.target.value)
                    setErroQr('')
                  }}
                  placeholder="https://seusite.com.br"
                  className="campo-texto"
                  aria-label="Conteúdo do QR Code"
                />
                <button
                  onClick={() => {
                    try {
                      const url = qrParaSvgDataUrl(qrTexto.trim())
                      const lado = Math.min(projeto.larguraCanvas, projeto.alturaCanvas) * 0.35
                      adicionarElemento(
                        criarImagem(url, centrarX(lado), centrarY(lado), lado, lado, {
                          nome: 'QR Code',
                        }),
                      )
                      setQrTexto('')
                    } catch (erro) {
                      setErroQr(erro instanceof Error ? erro.message : 'Falha ao gerar o QR')
                    }
                  }}
                  disabled={qrTexto.trim() === ''}
                  className="botao-primario flex shrink-0 items-center gap-1.5 disabled:pointer-events-none disabled:opacity-40"
                  title="Gerar QR Code e inserir no canvas"
                >
                  <IconeQr tamanho={15} /> Gerar
                </button>
              </div>
              {erroQr && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{erroQr}</p>}
            </div>

            <div>
              <h3 className={classeRotuloSecao}>Ícones</h3>
              <div className="grid grid-cols-4 gap-2">
                {ICONES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => inserirImagemGaleria(item, 200)}
                    className={classeItemGaleria}
                    title={item.nome}
                  >
                    <img
                      src={item.url}
                      alt={item.nome}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className={classeRotuloSecao}>Stickers</h3>
              <div className="grid grid-cols-4 gap-2">
                {STICKERS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => inserirImagemGaleria(item, 200)}
                    className={classeItemGaleria}
                    title={item.nome}
                  >
                    <img
                      src={item.url}
                      alt={item.nome}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'Texto':
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <button
                onClick={() => inserirTexto('Título', 72, true)}
                className="w-full rounded-xl2 border border-superficie-200 bg-white px-3 py-3 text-left text-2xl font-bold text-superficie-900 shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 dark:text-white"
              >
                Adicionar título
              </button>
              <button
                onClick={() => inserirTexto('Subtítulo', 44)}
                className="w-full rounded-xl2 border border-superficie-200 bg-white px-3 py-3 text-left text-lg font-semibold text-superficie-900 shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 dark:text-superficie-100"
              >
                Adicionar subtítulo
              </button>
              <button
                onClick={() => inserirTexto('Seu texto aqui', 28)}
                className="w-full rounded-xl2 border border-superficie-200 bg-white px-3 py-3 text-left text-sm text-superficie-900 shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900 dark:text-superficie-200"
              >
                Adicionar corpo de texto
              </button>
            </div>

            <div>
              <h3 className={classeRotuloSecao}>Combinações</h3>
              <div className="space-y-2">
                {PARES_FONTES.map((par) => (
                  <button
                    key={par.nome}
                    onClick={() => inserirParFontes(par)}
                    className="w-full rounded-xl2 border border-superficie-200 bg-white p-3 text-left shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
                  >
                    <span
                      className="block text-base font-bold text-superficie-900 dark:text-white"
                      style={{ fontFamily: par.titulo }}
                    >
                      {par.nome}
                    </span>
                    <span
                      className="block text-xs text-superficie-700 dark:text-superficie-300"
                      style={{ fontFamily: par.corpo }}
                    >
                      {par.titulo} · {par.corpo}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'Uploads':
        return (
          <div className="space-y-4">
            <label className="botao-primario flex cursor-pointer items-center justify-center gap-2">
              <span>⬆️</span>
              <span>Enviar imagens</span>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={aoSelecionarArquivos}
              />
            </label>

            <p className="text-xs text-superficie-600 dark:text-superficie-400">
              Você também pode arrastar imagens direto para o canvas, ou colar
              um print com <kbd className="rounded border border-superficie-300 px-1 font-medium dark:border-superficie-700">Ctrl+V</kbd>.
            </p>

            {uploads.length === 0 ? (
              <p className="text-xs text-superficie-700 dark:text-superficie-300">
                Suas imagens enviadas aparecem aqui. Clique numa delas para
                adicionar de novo ao canvas.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {uploads.map((img, i) => (
                  <button
                    key={`${img.url.slice(0, 24)}-${i}`}
                    onClick={() => inserirImagemCarregada(img)}
                    className={classeItemGaleria}
                    title="Adicionar ao canvas"
                  >
                    <img
                      src={img.url}
                      alt="Imagem enviada"
                      className="max-h-full max-w-full rounded-lg object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case 'Fotos':
        return (
          <div>
            <h3 className={classeRotuloSecao}>Fotos</h3>
            <div className="grid grid-cols-2 gap-2">
              {FOTOS.map((foto) => (
                <button
                  key={foto.id}
                  onClick={() => inserirImagemGaleria(foto, 400)}
                  className="group aspect-square overflow-hidden rounded-xl2 border border-superficie-200 shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800"
                  title={foto.nome}
                >
                  <img
                    src={foto.url}
                    alt={foto.nome}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        )

      case 'IA':
        return <PainelIA />

      case 'Marca':
        return <PainelMarca />

      case 'Colaborar':
        return <PainelColab />

      case 'Time':
        return <PainelTime />

      case 'Apps':
        return (
          <div className="space-y-3">
            <h3 className={classeRotuloSecao}>Apps e extensões</h3>
            <p className="text-xs text-superficie-600 dark:text-superficie-400">
              Plugins registrados via arquitetura de extensões.
            </p>
            {listarPlugins().map((plugin) => (
              <button
                key={plugin.id}
                onClick={plugin.executar}
                className="flex w-full items-center gap-3 rounded-xl2 border border-superficie-200 bg-white p-3 text-left shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
              >
                <span className="text-2xl">{plugin.icone}</span>
                <span>
                  <span className="block text-sm font-semibold text-superficie-900 dark:text-superficie-100">
                    {plugin.nome}
                  </span>
                  <span className="block text-xs text-superficie-600 dark:text-superficie-400">
                    {plugin.descricao}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="relative flex h-full">
      {/* Trilha vertical de abas em 4 grupos */}
      <div
        ref={refTrilha}
        role="tablist"
        aria-orientation="vertical"
        aria-label="Ferramentas"
        onKeyDown={aoTeclarNaTrilha}
        className="rolagem-fina relative flex w-16 shrink-0 flex-col items-center overflow-y-auto border-r border-superficie-200 bg-white py-2 dark:border-superficie-800 dark:bg-superficie-900"
      >
        {/* Indicador único que DESLIZA entre as abas (§7.2) — nunca pisca */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 z-10 w-1 rounded-r-full bg-primaria-500 transition-[transform,opacity,height] duration-media ease-facil-saida"
          style={{
            height: indicador.altura,
            transform: `translateY(${indicador.y}px)`,
            opacity: indicador.altura > 0 ? 1 : 0,
          }}
        />
        {GRUPOS_ABAS.map((grupo, indiceGrupo) => (
          <div key={indiceGrupo} className="flex w-full flex-col items-center gap-0.5">
            {indiceGrupo > 0 && (
              <span className="my-1.5 h-px w-8 bg-superficie-200 dark:bg-superficie-700" />
            )}
            {grupo.map((item) => {
              const ativa = item.id === aba && !recolhido
              return (
                <button
                  key={item.id}
                  ref={(no) => (refsAbas.current[item.id] = no)}
                  onClick={() => selecionarAba(item.id)}
                  title={item.id}
                  role="tab"
                  aria-selected={ativa}
                  // Roving tabindex: só a aba ativa entra na ordem de Tab
                  tabIndex={item.id === aba ? 0 : -1}
                  className={`group relative flex w-14 flex-col items-center gap-1 rounded-xl2 py-2 text-[10px] font-medium transition-[background-color,color] duration-micro ease-facil-padrao ${
                    ativa
                      ? 'bg-primaria-500/10 text-primaria-600 dark:bg-primaria-500/20 dark:text-primaria-300'
                      : 'text-superficie-600 hover:bg-superficie-100 hover:text-superficie-900 dark:text-superficie-300 dark:hover:bg-superficie-800 dark:hover:text-superficie-100'
                  }`}
                >
                  <span className="transition-transform duration-micro ease-facil-padrao group-hover:scale-[1.08]">
                    <item.Icone tamanho={20} />
                  </span>
                  <span>{item.id}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Fundo que fecha o painel ao toque — só existe quando ele flutua */}
      {!recolhido && compacta && (
        <button
          type="button"
          aria-label="Fechar painel"
          onClick={() => setRecolhido(true)}
          className="fixed inset-0 z-20 bg-superficie-950/40"
        />
      )}

      {/* Painel expansível com o conteúdo da aba ativa.
          A `key` faz o conteúdo re-animar a cada troca de aba (§7.2).
          Em tela compacta ele flutua sobre o canvas em vez de empurrá-lo:
          espremido entre trilha e propriedades, não sobraria canvas. */}
      {!recolhido && (
        <div
          key={aba}
          className={`entra-painel rolagem-fina overflow-y-auto border-r border-superficie-200 bg-superficie-50 p-3 dark:border-superficie-800 dark:bg-superficie-950 ${
            compacta
              ? 'absolute bottom-0 left-16 top-0 z-30 w-[min(280px,calc(100vw-4rem))] shadow-flutuante'
              : 'w-[260px] shrink-0'
          }`}
        >
          {/* Flutuando, o painel cobre quase toda a tela: sobra uma faixa
              de fundo estreita demais para servir de área de fechar. */}
          {compacta && (
            <button
              type="button"
              onClick={() => setRecolhido(true)}
              className="mb-2 flex w-full items-center gap-1.5 rounded-lg px-1 py-2 text-sm font-semibold text-superficie-700 dark:text-superficie-200"
            >
              <span aria-hidden="true">✕</span> Fechar {aba}
            </button>
          )}
          {renderConteudo()}
        </div>
      )}
    </div>
  )
}
