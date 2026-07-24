// =============================================================
// BarraFerramentas — barra lateral esquerda do editor.
// Uma trilha vertical de abas (ícones) + um painel expansível
// à direita com o conteúdo da aba ativa. Os painéis apenas
// leem/escrevem no store; não conhecem o Konva.
// =============================================================

import { useState, type ChangeEvent } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { useProjetosStore } from '../../estado/useProjetosStore'
import { criarForma, criarGrafico, criarImagem, criarLinha, criarTabela, criarTexto } from '../../nucleo/elementos'
import { TEMPLATES } from '../../dados/templates'
import { PARES_FONTES, ParFonte } from '../../dados/fontes'
import { FOTOS, ICONES, ItemGaleria, STICKERS } from '../../dados/galeria'
import { carregarArquivoImagem, ImagemCarregada } from '../../utilitarios/imagem'
import { tempoRelativo } from '../../utilitarios/tempo'
import { PainelIA } from './PainelIA'
import { PainelMarca } from './PainelMarca'
import { PainelColab } from './PainelColab'
import { PainelTime } from './PainelTime'
import { listarPlugins } from '../../nucleo/plugins/registro'

/** Identificadores das abas da trilha lateral */
type Aba =
  | 'Templates' | 'Elementos' | 'Texto' | 'Uploads' | 'Fotos'
  | 'IA' | 'Marca' | 'Colaborar' | 'Time' | 'Projetos' | 'Apps'

/** Abas exibidas na trilha, em ordem */
const ABAS: { id: Aba; icone: string }[] = [
  { id: 'Templates', icone: '🎨' },
  { id: 'Elementos', icone: '⬡' },
  { id: 'Texto', icone: 'T' },
  { id: 'Uploads', icone: '⬆️' },
  { id: 'Fotos', icone: '🖼️' },
  { id: 'IA', icone: '✨' },
  { id: 'Marca', icone: '🎯' },
  { id: 'Colaborar', icone: '👥' },
  { id: 'Time', icone: '🏢' },
  { id: 'Projetos', icone: '📁' },
  { id: 'Apps', icone: '🧩' },
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
  const abrirProjeto = useEditorStore((s) => s.abrirProjeto)
  const resumos = useProjetosStore((s) => s.resumos)
  const carregarProjeto = useProjetosStore((s) => s.carregarProjeto)

  const [aba, setAba] = useState<Aba>('Templates')
  const [recolhido, setRecolhido] = useState(false)
  const [uploads, setUploads] = useState<ImagemCarregada[]>([])

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
    adicionarElemento(
      criarImagem(img.url, centrarX(img.largura), centrarY(img.altura), img.largura, img.altura),
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

  const abrirResumo = (id: string) => {
    const p = carregarProjeto(id)
    if (p) abrirProjeto(p)
  }

  // ---- Troca de aba: clicar na aba ativa recolhe o painel ----
  const selecionarAba = (id: Aba) => {
    if (id === aba) {
      setRecolhido((r) => !r)
    } else {
      setAba(id)
      setRecolhido(false)
    }
  }

  const renderConteudo = () => {
    switch (aba) {
      case 'Templates':
        return (
          <div>
            <h3 className={classeRotuloSecao}>Templates</h3>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() =>
                    aplicarTemplate(
                      tpl.gerarElementos(projeto.larguraCanvas, projeto.alturaCanvas),
                      tpl.corFundo,
                    )
                  }
                  className="group overflow-hidden rounded-xl2 border border-superficie-200 bg-white text-left shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
                >
                  <div className="flex h-16 w-full">
                    {tpl.coresPreview.map((c, i) => (
                      <span
                        key={i}
                        className="h-full flex-1"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">
                      {tpl.nome}
                    </p>
                    <p className="text-xs text-superficie-700 dark:text-superficie-200">
                      {tpl.categoria}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

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

      case 'Projetos':
        return (
          <div>
            <h3 className={classeRotuloSecao}>Seus projetos</h3>
            {resumos.length === 0 ? (
              <p className="text-xs text-superficie-700 dark:text-superficie-300">
                Nenhum projeto salvo ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {resumos.map((resumo) => (
                  <button
                    key={resumo.id}
                    onClick={() => abrirResumo(resumo.id)}
                    className="flex w-full items-center gap-3 rounded-xl2 border border-superficie-200 bg-white p-2 text-left shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-superficie-100 dark:bg-superficie-850">
                      {resumo.miniatura ? (
                        <img
                          src={resumo.miniatura}
                          alt={`Miniatura de ${resumo.nome}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-lg opacity-40">🎨</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">
                        {resumo.nome}
                      </span>
                      <span className="block text-xs text-superficie-700 dark:text-superficie-300">
                        {tempoRelativo(resumo.atualizadoEm)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )

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
    <div className="flex h-full">
      {/* Trilha vertical de abas */}
      <div className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-superficie-200 bg-white py-3 dark:border-superficie-800 dark:bg-superficie-900">
        {ABAS.map((item) => {
          const ativa = item.id === aba && !recolhido
          return (
            <button
              key={item.id}
              onClick={() => selecionarAba(item.id)}
              title={item.id}
              aria-pressed={ativa}
              className={`flex w-14 flex-col items-center gap-0.5 rounded-xl2 py-2 text-[10px] font-medium transition ${
                ativa
                  ? 'bg-primaria-500 text-white shadow-suave'
                  : 'text-superficie-700 hover:bg-superficie-100 dark:text-superficie-200 dark:hover:bg-superficie-800'
              }`}
            >
              <span className="text-lg leading-none">{item.icone}</span>
              <span>{item.id}</span>
            </button>
          )
        })}
      </div>

      {/* Painel expansível com o conteúdo da aba ativa */}
      {!recolhido && (
        <div className="rolagem-fina w-[260px] shrink-0 overflow-y-auto border-r border-superficie-200 bg-superficie-50 p-3 dark:border-superficie-800 dark:bg-superficie-950">
          {renderConteudo()}
        </div>
      )}
    </div>
  )
}
