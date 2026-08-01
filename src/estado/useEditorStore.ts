// =============================================================
// Store do editor — estado em tempo real do canvas.
// A partir do esquema 2 o projeto tem várias PÁGINAS; todas as
// mutações de elementos/fundo atuam na PÁGINA ATIVA. `aplicarAlteracao`
// registra o snapshot (undo/redo cobre inclusive páginas) e agenda o
// auto-save com debounce de 2 segundos.
// =============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { Historico } from '../nucleo/historico'
import { desserializarComBanco, limparBanco, serializarComBanco } from '../nucleo/bancoImagens'
import { clonarElemento } from '../nucleo/elementos'
import { recolorirDesign } from '../nucleo/recolorir'
import { redimensionarElementos } from '../nucleo/ia/redimensionar'
import { caixaDe, deslocamentoPara } from '../nucleo/geometria'
import { exportarDataUrl } from '../nucleo/exportacao'
import { debounce } from '../utilitarios/tempo'
import { Comentario, Elemento, Ferramenta, Pagina, Projeto } from '../tipos/projeto'
import { useProjetosStore } from './useProjetosStore'

export type EstadoSalvamento = 'salvo' | 'pendente' | 'salvando' | 'erro'

/** Parte do estado (por página) coberta pelo histórico de undo/redo */
interface SnapshotPagina {
  elementos: Elemento[]
  corFundo: string
}

interface EstadoEditor {
  projeto: Projeto | null
  paginaAtivaId: string
  selecionados: string[]
  ferramenta: Ferramenta
  zoom: number
  deslocamento: { x: number; y: number }
  estadoSalvamento: EstadoSalvamento
  textoEmEdicao: string | null
  podeDesfazer: boolean
  podeRefazer: boolean

  abrirProjeto: (projeto: Projeto) => void
  fecharProjeto: () => void
  renomearProjeto: (nome: string) => void

  definirFerramenta: (ferramenta: Ferramenta) => void
  definirZoom: (zoom: number, deslocamento?: { x: number; y: number }) => void
  definirDeslocamento: (deslocamento: { x: number; y: number }) => void
  definirTextoEmEdicao: (id: string | null) => void

  selecionar: (ids: string[]) => void
  alternarSelecao: (id: string) => void
  limparSelecao: () => void

  aplicarAlteracao: (
    mutador: (atual: SnapshotPagina) => SnapshotPagina,
    registrarHistorico?: boolean,
  ) => void
  adicionarElemento: (elemento: Elemento, selecionarNovo?: boolean) => void
  aplicarTemplate: (elementos: Elemento[], corFundo: string) => void
  atualizarElementos: (ids: string[], mudancas: Partial<Elemento>) => void
  removerSelecionados: () => void
  duplicarSelecionados: () => void
  copiarSelecionados: () => void
  colar: () => void
  moverSelecionados: (dx: number, dy: number) => void
  reordenarElemento: (id: string, novoIndice: number) => void
  moverCamada: (id: string, direcao: 'frente' | 'tras' | 'topo' | 'fundo') => void
  alinharSelecionados: (
    eixo: 'esquerda' | 'centroH' | 'direita' | 'topo' | 'centroV' | 'base',
  ) => void
  /** Distribui 3+ elementos com espaçamento igual entre os extremos */
  distribuirSelecionados: (eixo: 'horizontal' | 'vertical') => void
  /** Agrupa a seleção (2+): passam a selecionar e mover juntos */
  agruparSelecionados: () => void
  /** Remove o vínculo de grupo dos selecionados */
  desagruparSelecionados: () => void
  /** Define a cor principal dos selecionados (conta-gotas) */
  definirCorSelecionados: (cor: string) => void
  /** Substitui texto em TODAS as páginas (insensível a maiúsculas). Retorna nº de trocas */
  substituirTexto: (busca: string, troca: string) => number
  definirCorFundo: (cor: string) => void

  /** Recolore o design da página ativa para uma paleta-alvo (temas/marca) */
  recolorirDesignAtivo: (cores: string[]) => void
  /** Aplica uma fonte a todos os textos da página ativa (Kit de Marca) */
  definirFonteGlobal: (fonte: string) => void

  /** Redimensionamento mágico: novo tamanho de canvas + reflow das páginas */
  redimensionarProjeto: (largura: number, altura: number) => void
  /**
   * Magic Resize em massa: gera CÓPIAS do projeto em vários formatos
   * (novos projetos salvos), sem alterar o design atual. Devolve quantas
   * foram gravadas e quantas não couberam no armazenamento.
   */
  gerarVariacoesFormato: (
    formatos: { nome: string; largura: number; altura: number }[],
  ) => { criados: number; falharam: number }

  // ---- Páginas ----
  adicionarPagina: () => void
  duplicarPagina: (id: string) => void
  removerPagina: (id: string) => void
  selecionarPagina: (id: string) => void
  renomearPagina: (id: string, nome: string) => void
  atualizarPagina: (
    id: string,
    mudancas: Partial<Pick<Pagina, 'nome' | 'notas' | 'transicao'>>,
  ) => void

  // ---- Apresentação ----
  apresentando: boolean
  iniciarApresentacao: () => void
  sairApresentacao: () => void

  // ---- Colaboração (comentários) ----
  adicionarComentario: (comentario: Comentario) => void
  resolverComentario: (id: string) => void
  removerComentario: (id: string) => void
  /** Aplica elementos vindos de outro colaborador (sem histórico) */
  aplicarElementosRemotos: (paginaId: string, elementos: Elemento[], corFundo: string) => void
  /** Aplica comentários vindos de outro colaborador */
  aplicarComentariosRemotos: (paginaId: string, comentarios: Comentario[]) => void

  desfazer: () => void
  refazer: () => void

  salvarAgora: () => void
}

// Histórico e área de transferência vivem fora do estado reativo
const historico = new Historico()
let areaTransferencia: Elemento[] = []

/** Estrutura do snapshot de histórico (páginas + tamanho do canvas) */
interface SnapshotProjeto {
  paginas: Pagina[]
  larguraCanvas: number
  alturaCanvas: number
}

/**
 * Snapshot do histórico: páginas + tamanho do canvas. Inclui o tamanho
 * para que o redimensionamento mágico também seja desfazível.
 */
function snapshotDe(projeto: Projeto): string {
  const s: SnapshotProjeto = {
    paginas: projeto.paginas,
    larguraCanvas: projeto.larguraCanvas,
    alturaCanvas: projeto.alturaCanvas,
  }
  // As imagens saem por referência: sem isso, cada um dos 100 passos do
  // histórico carregaria uma cópia inteira do base64 de cada foto.
  return serializarComBanco(s)
}

/** Índice e objeto da página ativa (ou -1/null) */
function paginaAtiva(
  projeto: Projeto | null,
  paginaAtivaId: string,
): { indice: number; pagina: Pagina | null } {
  if (!projeto) return { indice: -1, pagina: null }
  const indice = projeto.paginas.findIndex((p) => p.id === paginaAtivaId)
  return { indice, pagina: indice >= 0 ? projeto.paginas[indice] : null }
}

/** Clona os elementos de uma página com novos ids (para duplicar página) */
function clonarElementosParaPagina(elementos: Elemento[]): Elemento[] {
  return elementos.map((el) => ({ ...structuredClone(el), id: nanoid(10) }))
}


export const useEditorStore = create<EstadoEditor>((set, get) => {
  // ---- Auto-save com debounce de 2s e miniatura para o dashboard ----
  const persistir = () => {
    const { projeto } = get()
    if (!projeto) return
    set({ estadoSalvamento: 'salvando' })
    let miniatura = projeto.miniatura
    try {
      const escala = Math.min(1, 320 / projeto.larguraCanvas)
      miniatura = exportarDataUrl({ formato: 'jpg', escala }) ?? miniatura
    } catch {
      // Sem canvas montado (ex.: teste) — segue sem miniatura nova
    }
    const salvo: Projeto = {
      ...projeto,
      miniatura,
      atualizadoEm: new Date().toISOString(),
    }
    // Quando o localStorage está cheio o projeto NÃO foi para o disco.
    // Ficar em 'salvo' aqui esconderia a perda até o próximo recarregamento.
    const persistido = useProjetosStore.getState().salvarProjeto(salvo)
    set({ projeto: salvo, estadoSalvamento: persistido ? 'salvo' : 'erro' })
  }
  // Debounce por tipo de edição (§11.2): arrastar produz muitos eventos
  // seguidos e pode salvar rápido; digitar precisa de mais folga.
  const persistirRapido = debounce(persistir, 400)
  const persistirNormal = debounce(persistir, 800)
  const agendarSalvamento = (ritmo: 'rapido' | 'normal' = 'normal') => {
    set({ estadoSalvamento: 'pendente' })
    // Os dois ritmos levam ao MESMO `persistir`. Deixar os dois
    // temporizadores vivos (arrastar e depois digitar, por exemplo)
    // fazia o salvamento rodar duas vezes para a mesma edição: duas
    // gravações e duas rasterizações de miniatura, com o indicador
    // piscando de "salvo" de volta para "salvando".
    persistirRapido.cancelar()
    persistirNormal.cancelar()
    if (ritmo === 'rapido') persistirRapido()
    else persistirNormal()
  }
  /** Salva já, descartando o que estava agendado */
  const persistirAgora = () => {
    persistirRapido.cancelar()
    persistirNormal.cancelar()
    persistir()
  }

  const atualizarFlagsHistorico = () =>
    set({ podeDesfazer: historico.podeDesfazer(), podeRefazer: historico.podeRefazer() })

  /** Substitui a página ativa por uma versão transformada */
  const mutarPaginaAtiva = (
    transformar: (pagina: Pagina) => Pagina,
    registrarHistorico = true,
    ritmo: 'rapido' | 'normal' = 'normal',
  ) => {
    const { projeto, paginaAtivaId } = get()
    if (!projeto) return
    const { indice, pagina } = paginaAtiva(projeto, paginaAtivaId)
    if (!pagina) return
    if (registrarHistorico) {
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
    }
    const paginas = [...projeto.paginas]
    paginas[indice] = transformar(pagina)
    set({ projeto: { ...projeto, paginas } })
    agendarSalvamento(ritmo)
  }

  /** Elementos da página ativa (ou lista vazia) */
  const elementosAtivos = (): Elemento[] => {
    const { projeto, paginaAtivaId } = get()
    return paginaAtiva(projeto, paginaAtivaId).pagina?.elementos ?? []
  }

  return {
    projeto: null,
    paginaAtivaId: '',
    selecionados: [],
    ferramenta: 'selecao',
    zoom: 1,
    deslocamento: { x: 0, y: 0 },
    estadoSalvamento: 'salvo',
    textoEmEdicao: null,
    podeDesfazer: false,
    podeRefazer: false,

    abrirProjeto: (projeto) => {
      // Um salvamento agendado do projeto ANTERIOR dispararia depois da
      // troca e, como `persistir` lê o estado atual, gravaria o projeto
      // NOVO — as últimas edições do anterior sumiriam sem aviso.
      // Trocar de projeto pelo seletor do topo bastava para reproduzir.
      if (get().projeto) persistirAgora()
      historico.limpar()
      // Sem snapshots vivos, nada mais referencia as imagens guardadas.
      limparBanco()
      set({
        projeto,
        paginaAtivaId: projeto.paginas[0]?.id ?? '',
        selecionados: [],
        ferramenta: 'selecao',
        zoom: 1,
        deslocamento: { x: 0, y: 0 },
        estadoSalvamento: 'salvo',
        textoEmEdicao: null,
        podeDesfazer: false,
        podeRefazer: false,
      })
    },

    fecharProjeto: () => {
      persistirAgora()
      historico.limpar()
      // Sem snapshots vivos, nada mais referencia as imagens guardadas.
      limparBanco()
      set({ projeto: null, paginaAtivaId: '', selecionados: [], textoEmEdicao: null })
    },

    renomearProjeto: (nome) => {
      const { projeto } = get()
      if (!projeto) return
      set({ projeto: { ...projeto, nome: nome.trim() || 'Design sem título' } })
      agendarSalvamento()
    },

    definirFerramenta: (ferramenta) => set({ ferramenta }),
    definirZoom: (zoom, deslocamento) =>
      set({
        zoom: Math.min(5, Math.max(0.1, zoom)),
        ...(deslocamento ? { deslocamento } : {}),
      }),
    definirDeslocamento: (deslocamento) => set({ deslocamento }),
    definirTextoEmEdicao: (id) => set({ textoEmEdicao: id }),

    selecionar: (ids) => set({ selecionados: ids }),
    alternarSelecao: (id) => {
      const { selecionados } = get()
      set({
        selecionados: selecionados.includes(id)
          ? selecionados.filter((s) => s !== id)
          : [...selecionados, id],
      })
    },
    limparSelecao: () => set({ selecionados: [] }),

    aplicarAlteracao: (mutador, registrarHistorico = true) => {
      mutarPaginaAtiva((pagina) => {
        const resultado = mutador({ elementos: pagina.elementos, corFundo: pagina.corFundo })
        return { ...pagina, elementos: resultado.elementos, corFundo: resultado.corFundo }
      }, registrarHistorico)
    },

    adicionarElemento: (elemento, selecionarNovo = true) => {
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, elemento],
      }))
      if (selecionarNovo) set({ selecionados: [elemento.id], ferramenta: 'selecao' })
    },

    aplicarTemplate: (elementos, corFundo) => {
      get().aplicarAlteracao(() => ({ elementos, corFundo }))
      set({ selecionados: [] })
    },

    atualizarElementos: (ids, mudancas) => {
      // Vem de arraste/transformação na maioria das vezes: salva rápido
      mutarPaginaAtiva(
        (pagina) => ({
          ...pagina,
          elementos: pagina.elementos.map((elemento) =>
            ids.includes(elemento.id) ? ({ ...elemento, ...mudancas } as Elemento) : elemento,
          ),
        }),
        true,
        'rapido',
      )
    },

    removerSelecionados: () => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.filter(
          (elemento) => !selecionados.includes(elemento.id) || elemento.bloqueado,
        ),
      }))
      set({ selecionados: [] })
    },

    duplicarSelecionados: () => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      const copias = elementosAtivos()
        .filter((elemento) => selecionados.includes(elemento.id))
        .map((elemento) => clonarElemento(elemento))
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, ...copias],
      }))
      set({ selecionados: copias.map((c) => c.id) })
    },

    copiarSelecionados: () => {
      const { selecionados } = get()
      areaTransferencia = elementosAtivos().filter((elemento) =>
        selecionados.includes(elemento.id),
      )
    },

    colar: () => {
      if (areaTransferencia.length === 0) return
      const copias = areaTransferencia.map((elemento) => clonarElemento(elemento))
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: [...atual.elementos, ...copias],
      }))
      set({ selecionados: copias.map((c) => c.id) })
    },

    moverSelecionados: (dx, dy) => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((elemento) =>
          selecionados.includes(elemento.id) && !elemento.bloqueado
            ? { ...elemento, x: elemento.x + dx, y: elemento.y + dy }
            : elemento,
        ),
      }))
    },

    reordenarElemento: (id, novoIndice) => {
      get().aplicarAlteracao((atual) => {
        const indiceAtual = atual.elementos.findIndex((e) => e.id === id)
        if (indiceAtual < 0) return atual
        const elementos = [...atual.elementos]
        const [removido] = elementos.splice(indiceAtual, 1)
        elementos.splice(Math.max(0, Math.min(elementos.length, novoIndice)), 0, removido)
        return { ...atual, elementos }
      })
    },

    moverCamada: (id, direcao) => {
      const elementos = elementosAtivos()
      const indice = elementos.findIndex((e) => e.id === id)
      if (indice < 0) return
      const destino =
        direcao === 'topo'
          ? elementos.length - 1
          : direcao === 'fundo'
            ? 0
            : direcao === 'frente'
              ? Math.min(elementos.length - 1, indice + 1)
              : Math.max(0, indice - 1)
      if (destino === indice) return
      get().reordenarElemento(id, destino)
    },

    alinharSelecionados: (eixo) => {
      const { projeto, selecionados } = get()
      if (!projeto || selecionados.length === 0) return
      const { larguraCanvas, alturaCanvas } = projeto
      // Cada eixo vira "encoste esta borda da CAIXA neste alvo". Mexer
      // direto em x/y só acertava quando caixa e origem coincidiam —
      // ou seja, nunca em texto de várias linhas, linha ou elemento
      // girado.
      const regras: Record<
        typeof eixo,
        { eixo: 'x' | 'y'; borda: 'inicio' | 'centro' | 'fim'; alvo: number }
      > = {
        esquerda: { eixo: 'x', borda: 'inicio', alvo: 0 },
        centroH: { eixo: 'x', borda: 'centro', alvo: larguraCanvas / 2 },
        direita: { eixo: 'x', borda: 'fim', alvo: larguraCanvas },
        topo: { eixo: 'y', borda: 'inicio', alvo: 0 },
        centroV: { eixo: 'y', borda: 'centro', alvo: alturaCanvas / 2 },
        base: { eixo: 'y', borda: 'fim', alvo: alturaCanvas },
      }
      const regra = regras[eixo]
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((elemento) => {
          if (!selecionados.includes(elemento.id) || elemento.bloqueado) return elemento
          const delta = deslocamentoPara(caixaDe(elemento), regra.eixo, regra.borda, regra.alvo)
          return regra.eixo === 'x'
            ? { ...elemento, x: elemento.x + delta }
            : { ...elemento, y: elemento.y + delta }
        }),
      }))
    },

    distribuirSelecionados: (eixo) => {
      const { selecionados } = get()
      const alvos = elementosAtivos().filter(
        (el) => selecionados.includes(el.id) && !el.bloqueado,
      )
      if (alvos.length < 3) return
      const chave = eixo === 'horizontal' ? 'x' : 'y'
      // Espaçamento é sobre as CAIXAS; a origem só é usada no fim,
      // para converter a posição desejada em deslocamento.
      const caixas = new Map(alvos.map((el) => [el.id, caixaDe(el)]))
      const inicioDe = (el: Elemento) => (eixo === 'horizontal' ? caixas.get(el.id)!.x : caixas.get(el.id)!.y)
      const medida = (el: Elemento) =>
        eixo === 'horizontal' ? caixas.get(el.id)!.largura : caixas.get(el.id)!.altura

      // Ordena pelo início; extremos ficam fixos e o miolo é espaçado igualmente
      const ordenados = [...alvos].sort((a, b) => inicioDe(a) - inicioDe(b))
      const primeiro = ordenados[0]
      const ultimo = ordenados[ordenados.length - 1]
      const inicio = inicioDe(primeiro) + medida(primeiro)
      const fim = inicioDe(ultimo)
      const miolo = ordenados.slice(1, -1)
      const somaMiolo = miolo.reduce((s, el) => s + medida(el), 0)
      const vao = (fim - inicio - somaMiolo) / (miolo.length + 1)
      let cursor = inicio + vao
      const deslocamentos = new Map<string, number>()
      for (const el of miolo) {
        deslocamentos.set(el.id, cursor - inicioDe(el))
        cursor += medida(el) + vao
      }
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((el) =>
          deslocamentos.has(el.id)
            ? { ...el, [chave]: (el[chave] as number) + deslocamentos.get(el.id)! }
            : el,
        ),
      }))
    },

    agruparSelecionados: () => {
      const { selecionados } = get()
      if (selecionados.length < 2) return
      const grupoId = nanoid(8)
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((el) =>
          selecionados.includes(el.id) ? { ...el, grupoId } : el,
        ),
      }))
    },

    desagruparSelecionados: () => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((el) =>
          selecionados.includes(el.id) ? { ...el, grupoId: undefined } : el,
        ),
      }))
    },

    definirCorSelecionados: (cor) => {
      const { selecionados } = get()
      if (selecionados.length === 0) return
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((el) => {
          if (!selecionados.includes(el.id) || el.bloqueado) return el
          switch (el.tipo) {
            case 'texto':
            case 'linha':
              return { ...el, cor }
            case 'retangulo':
            case 'elipse':
            case 'triangulo':
            case 'estrela':
              return { ...el, preenchimento: cor, gradiente: undefined }
            case 'caminho':
              return { ...el, corBorda: cor }
            case 'tabela':
              return { ...el, corCabecalho: cor }
            default:
              return el
          }
        }),
      }))
    },

    substituirTexto: (busca, troca) => {
      const { projeto } = get()
      if (!projeto || !busca) return 0
      const padrao = new RegExp(busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      let trocas = 0
      const paginas = projeto.paginas.map((p) => ({
        ...p,
        elementos: p.elementos.map((el) => {
          if (el.tipo !== 'texto') return el
          const ocorrencias = el.texto.match(padrao)?.length ?? 0
          if (ocorrencias === 0) return el
          trocas += ocorrencias
          // Troca por FUNÇÃO: como string, `$&`, `$\``, `$'` e `$$`
          // seriam padrões de substituição. Trocar algo por "R$&nbsp;5"
          // inseria o próprio texto encontrado no lugar do "$&".
          return { ...el, texto: el.texto.replace(padrao, () => troca) }
        }),
      }))
      if (trocas === 0) return 0
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
      return trocas
    },

    definirCorFundo: (cor) => {
      get().aplicarAlteracao((atual) => ({ ...atual, corFundo: cor }))
    },

    recolorirDesignAtivo: (cores) => {
      if (cores.length === 0) return
      get().aplicarAlteracao((atual) => recolorirDesign(atual.elementos, atual.corFundo, cores))
    },

    definirFonteGlobal: (fonte) => {
      get().aplicarAlteracao((atual) => ({
        ...atual,
        elementos: atual.elementos.map((el) =>
          el.tipo === 'texto' ? { ...el, fonte } : el,
        ),
      }))
    },

    redimensionarProjeto: (largura, altura) => {
      const { projeto } = get()
      if (!projeto || largura < 1 || altura < 1) return
      if (largura === projeto.larguraCanvas && altura === projeto.alturaCanvas) return
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      const paginas = projeto.paginas.map((p) => ({
        ...p,
        elementos: redimensionarElementos(
          p.elementos,
          projeto.larguraCanvas,
          projeto.alturaCanvas,
          largura,
          altura,
        ),
      }))
      set({
        projeto: { ...projeto, larguraCanvas: largura, alturaCanvas: altura, paginas },
        selecionados: [],
      })
      agendarSalvamento()
    },

    gerarVariacoesFormato: (formatos) => {
      const { projeto } = get()
      if (!projeto) return { criados: 0, falharam: 0 }
      const agora = new Date().toISOString()
      let criados = 0
      let falharam = 0
      for (const f of formatos) {
        if (f.largura === projeto.larguraCanvas && f.altura === projeto.alturaCanvas) continue
        const paginas: Pagina[] = projeto.paginas.map((p) => ({
          ...structuredClone(p),
          id: nanoid(10),
          elementos: redimensionarElementos(
            p.elementos,
            projeto.larguraCanvas,
            projeto.alturaCanvas,
            f.largura,
            f.altura,
          ),
          comentarios: [],
        }))
        const copia: Projeto = {
          ...projeto,
          id: nanoid(12),
          nome: `${projeto.nome} · ${f.nome}`,
          larguraCanvas: f.largura,
          alturaCanvas: f.altura,
          paginas,
          miniatura: undefined,
          criadoEm: agora,
          atualizadoEm: agora,
        }
        // Cada cópia é um projeto inteiro; com o armazenamento perto do
        // limite algumas não cabem. Contar antes de conferir anunciava
        // "4 variações criadas" com zero gravadas.
        if (useProjetosStore.getState().salvarProjeto(copia)) criados++
        else falharam++
      }
      return { criados, falharam }
    },

    // ---- Páginas ----
    adicionarPagina: () => {
      const { projeto } = get()
      if (!projeto) return
      const nova: Pagina = {
        id: nanoid(10),
        nome: `Página ${projeto.paginas.length + 1}`,
        corFundo: '#ffffff',
        elementos: [],
        notas: '',
        transicao: 'fade',
        comentarios: [],
      }
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      set({
        projeto: { ...projeto, paginas: [...projeto.paginas, nova] },
        paginaAtivaId: nova.id,
        selecionados: [],
      })
      agendarSalvamento()
    },

    duplicarPagina: (id) => {
      const { projeto } = get()
      if (!projeto) return
      const indice = projeto.paginas.findIndex((p) => p.id === id)
      if (indice < 0) return
      const original = projeto.paginas[indice]
      const copia: Pagina = {
        id: nanoid(10),
        nome: `${original.nome} (cópia)`,
        corFundo: original.corFundo,
        elementos: clonarElementosParaPagina(original.elementos),
        notas: original.notas,
        transicao: original.transicao,
        comentarios: [],
      }
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      const paginas = [...projeto.paginas]
      paginas.splice(indice + 1, 0, copia)
      set({ projeto: { ...projeto, paginas }, paginaAtivaId: copia.id, selecionados: [] })
      agendarSalvamento()
    },

    removerPagina: (id) => {
      const { projeto, paginaAtivaId } = get()
      if (!projeto || projeto.paginas.length <= 1) return
      const indice = projeto.paginas.findIndex((p) => p.id === id)
      if (indice < 0) return
      historico.registrar(snapshotDe(projeto))
      atualizarFlagsHistorico()
      const paginas = projeto.paginas.filter((p) => p.id !== id)
      const novoAtivo =
        paginaAtivaId === id
          ? paginas[Math.max(0, indice - 1)].id
          : paginaAtivaId
      set({ projeto: { ...projeto, paginas }, paginaAtivaId: novoAtivo, selecionados: [] })
      agendarSalvamento()
    },

    selecionarPagina: (id) => {
      const { projeto } = get()
      if (!projeto || !projeto.paginas.some((p) => p.id === id)) return
      set({ paginaAtivaId: id, selecionados: [], textoEmEdicao: null })
    },

    renomearPagina: (id, nome) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) =>
        p.id === id ? { ...p, nome: nome.trim() || p.nome } : p,
      )
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
    },

    atualizarPagina: (id, mudancas) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) => (p.id === id ? { ...p, ...mudancas } : p))
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
    },

    apresentando: false,
    iniciarApresentacao: () => set({ apresentando: true }),
    sairApresentacao: () => set({ apresentando: false }),

    adicionarComentario: (comentario) => {
      const { projeto, paginaAtivaId } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) =>
        p.id === paginaAtivaId ? { ...p, comentarios: [...p.comentarios, comentario] } : p,
      )
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
    },

    resolverComentario: (id) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) => ({
        ...p,
        comentarios: p.comentarios.map((c) =>
          c.id === id ? { ...c, resolvido: !c.resolvido } : c,
        ),
      }))
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
    },

    removerComentario: (id) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) => ({
        ...p,
        comentarios: p.comentarios.filter((c) => c.id !== id),
      }))
      set({ projeto: { ...projeto, paginas } })
      agendarSalvamento()
    },

    aplicarElementosRemotos: (paginaId, elementos, corFundo) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) =>
        p.id === paginaId ? { ...p, elementos, corFundo } : p,
      )
      set({ projeto: { ...projeto, paginas } })
    },

    aplicarComentariosRemotos: (paginaId, comentarios) => {
      const { projeto } = get()
      if (!projeto) return
      const paginas = projeto.paginas.map((p) =>
        p.id === paginaId ? { ...p, comentarios } : p,
      )
      set({ projeto: { ...projeto, paginas } })
    },

    desfazer: () => {
      const { projeto } = get()
      if (!projeto) return
      const anterior = historico.desfazer(snapshotDe(projeto))
      if (anterior === null) return
      aplicarSnapshotPaginas(anterior)
    },

    refazer: () => {
      const { projeto } = get()
      if (!projeto) return
      const proximo = historico.refazer(snapshotDe(projeto))
      if (proximo === null) return
      aplicarSnapshotPaginas(proximo)
    },

    salvarAgora: persistirAgora,
  }

  /** Restaura um snapshot (undo/redo) preservando a página ativa */
  function aplicarSnapshotPaginas(snapshot: string) {
    const { projeto, paginaAtivaId, selecionados } = get()
    if (!projeto) return
    const dados = desserializarComBanco<SnapshotProjeto>(snapshot)
    const paginas = dados.paginas
    const aindaExiste = paginas.some((p) => p.id === paginaAtivaId)
    const ativo = aindaExiste ? paginaAtivaId : paginas[0]?.id ?? ''
    const idsValidos = paginas.find((p) => p.id === ativo)?.elementos.map((e) => e.id) ?? []
    set({
      projeto: {
        ...projeto,
        paginas,
        larguraCanvas: dados.larguraCanvas,
        alturaCanvas: dados.alturaCanvas,
      },
      paginaAtivaId: ativo,
      selecionados: selecionados.filter((id) => idsValidos.includes(id)),
    })
    atualizarFlagsHistorico()
    agendarSalvamento()
  }
})
