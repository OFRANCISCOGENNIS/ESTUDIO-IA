// =============================================================
// Adaptador de IA com Claude — implementa `AdaptadorIA` chamando a
// Messages API da Anthropic.
//
// Três decisões que valem explicação:
//
// 1. Só o que é linguagem vai para o Claude. Remoção de fundo e
//    extração de paleta são operações de pixel; continuam no adaptador
//    local, que faz isso melhor, de graça e offline.
// 2. O modelo devolve LAYOUT, não elementos prontos: coordenadas em
//    fração de 0 a 1, convertidas aqui para o tamanho do canvas. Assim
//    o mesmo design serve a um post 1080×1080 e a um story 1080×1920.
// 3. Toda resposta é validada e saneada antes de virar elemento. Cor
//    fora do formato, número fora da faixa ou fonte que o app não
//    embute são corrigidos em vez de entrarem no documento.
//
// Falhou a chamada? Cai no adaptador local e avisa quem pediu — um
// editor de design não pode parar porque a rede caiu.
// =============================================================

import { criarForma, criarTexto } from '../elementos'
import { Elemento } from '../../tipos/projeto'
import { adaptadorLocal } from './adaptadorLocal'
import {
  AdaptadorIA,
  OpcaoDesignIA,
  SugestaoEstilo,
  TipoTextoIA,
  TomTexto,
} from './tipos'

/** Fontes que o app embute — o modelo não pode inventar outras */
const FONTES = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Playfair Display',
  'Bebas Neue',
  'Lobster',
  'Caveat',
] as const

export type Esforco = 'low' | 'medium' | 'high'

/** Um pedido ao modelo, já com o formato de saída exigido */
export interface PedidoClaude {
  sistema: string
  usuario: string
  /** JSON Schema que a resposta deve obedecer */
  esquema: Record<string, unknown>
  esforco: Esforco
}

/**
 * Transporte até o modelo. A implementação real vive em
 * `clienteAnthropic`; os testes injetam uma versão de mentira.
 */
export interface ClienteClaude {
  gerar: (pedido: PedidoClaude) => Promise<unknown>
}

// ---------------------------------------------------------------
// Esquemas de saída
// ---------------------------------------------------------------

/** Objeto de esquema com todas as chaves obrigatórias (exigência do
 *  formato estruturado: nada de campo opcional) */
const objeto = (propriedades: Record<string, unknown>) => ({
  type: 'object',
  properties: propriedades,
  required: Object.keys(propriedades),
  additionalProperties: false,
})

const texto = { type: 'string' }
const numero = { type: 'number' }

const ESQUEMA_TEXTOS = objeto({
  opcoes: { type: 'array', items: texto },
})

const ESQUEMA_ESTILO = objeto({
  parFonte: objeto({ nome: texto, titulo: texto, corpo: texto }),
  paleta: { type: 'array', items: texto },
})

const ESQUEMA_ELEMENTO = objeto({
  tipo: { type: 'string', enum: ['texto', 'retangulo', 'elipse'] },
  // Fração de 0 a 1 do lado correspondente do canvas
  x: numero,
  y: numero,
  largura: numero,
  altura: numero,
  cor: texto,
  /** Vazio nas formas */
  conteudo: texto,
  /** Fração da ALTURA do canvas; 0 nas formas */
  tamanhoTexto: numero,
  fonte: texto,
  negrito: { type: 'boolean' },
  alinhamento: { type: 'string', enum: ['left', 'center', 'right'] },
  raioCanto: numero,
  opacidade: numero,
})

const ESQUEMA_DESIGN = objeto({
  opcoes: {
    type: 'array',
    items: objeto({
      nome: texto,
      corFundo: texto,
      coresPreview: { type: 'array', items: texto },
      elementos: { type: 'array', items: ESQUEMA_ELEMENTO },
    }),
  },
})

// ---------------------------------------------------------------
// Saneamento — nada da resposta entra no documento sem passar aqui
// ---------------------------------------------------------------

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function corValida(valor: unknown, padrao: string): string {
  return typeof valor === 'string' && HEX.test(valor.trim()) ? valor.trim() : padrao
}

export function fracao(valor: unknown, padrao: number): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return padrao
  return Math.min(1, Math.max(0, valor))
}

export function fonteValida(valor: unknown): string {
  return typeof valor === 'string' && (FONTES as readonly string[]).includes(valor)
    ? valor
    : 'Inter'
}

const listaDeTextos = (valor: unknown): string[] =>
  Array.isArray(valor)
    ? valor.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    : []

interface ElementoBruto {
  tipo?: unknown
  x?: unknown
  y?: unknown
  largura?: unknown
  altura?: unknown
  cor?: unknown
  conteudo?: unknown
  tamanhoTexto?: unknown
  fonte?: unknown
  negrito?: unknown
  alinhamento?: unknown
  raioCanto?: unknown
  opacidade?: unknown
}

/**
 * Converte um elemento em coordenadas relativas para um elemento real
 * no tamanho do canvas pedido.
 */
export function materializar(
  bruto: ElementoBruto,
  largura: number,
  altura: number,
): Elemento | null {
  const x = fracao(bruto.x, 0) * largura
  const y = fracao(bruto.y, 0) * altura
  const l = Math.max(1, fracao(bruto.largura, 0.5) * largura)
  const a = Math.max(1, fracao(bruto.altura, 0.2) * altura)
  const opacidade = fracao(bruto.opacidade, 1)

  if (bruto.tipo === 'texto') {
    const conteudo = typeof bruto.conteudo === 'string' ? bruto.conteudo.trim() : ''
    if (conteudo === '') return null
    // O tamanho vem como fração da altura para acompanhar o formato
    const tamanhoFonte = Math.max(10, Math.round(fracao(bruto.tamanhoTexto, 0.06) * altura))
    return criarTexto(x, y, {
      texto: conteudo,
      largura: l,
      tamanhoFonte,
      fonte: fonteValida(bruto.fonte),
      negrito: bruto.negrito === true,
      cor: corValida(bruto.cor, '#1f2937'),
      alinhamento:
        bruto.alinhamento === 'center' || bruto.alinhamento === 'right'
          ? bruto.alinhamento
          : 'left',
      opacidade,
    })
  }

  if (bruto.tipo === 'retangulo' || bruto.tipo === 'elipse') {
    return criarForma(bruto.tipo, x, y, {
      largura: l,
      altura: a,
      preenchimento: corValida(bruto.cor, '#7c4dff'),
      raioCanto: Math.max(0, fracao(bruto.raioCanto, 0) * Math.min(l, a)),
      opacidade,
    })
  }

  return null
}

// ---------------------------------------------------------------
// Instruções
// ---------------------------------------------------------------

const SISTEMA_DESIGN = `Você compõe layouts para um editor de design brasileiro. Responde em português do Brasil.

Coordenadas: x, y, largura e altura são frações de 0 a 1 do canvas. tamanhoTexto é fração da ALTURA do canvas (um título costuma ficar entre 0.08 e 0.16). Nas formas, conteudo é "" e tamanhoTexto é 0.

Fontes disponíveis, e nenhuma outra: ${FONTES.join(', ')}.

Cada opção deve ser visualmente distinta das outras — paletas, densidade e hierarquia diferentes, não a mesma composição recolorida. Evite o visual genérico de IA: fundo creme com serifada e acento terracota, gradiente roxo-para-azul, tudo centralizado. Escolha cores que sirvam ao assunto.

Ordem dos elementos é ordem de empilhamento: o primeiro fica no fundo. Deixe margem — nada encostado na borda sem intenção. coresPreview são três cores que representam a opção.`

const SISTEMA_TEXTO = `Você escreve textos curtos para peças de design, em português do Brasil.

Devolva variações realmente diferentes entre si — ângulos distintos, não sinônimos trocados. Sem aspas ao redor, sem numeração, sem explicação. Respeite o tipo pedido: título é curto e direto; subtítulo complementa sem repetir; legenda cabe embaixo de uma imagem; CTA é um comando de duas ou três palavras.`

const SISTEMA_ESTILO = `Você sugere direção visual para peças de design. Responde em português do Brasil.

Escolha um par de fontes entre as disponíveis (${FONTES.join(', ')}) e uma paleta de 5 cores em hexadecimal que sirva ao assunto descrito. Dê à paleta contraste suficiente para texto legível sobre o fundo.`

const rotuloTipo: Record<TipoTextoIA, string> = {
  titulo: 'título',
  subtitulo: 'subtítulo',
  legenda: 'legenda',
  cta: 'chamada para ação (CTA)',
}

const rotuloTom: Record<TomTexto, string> = {
  profissional: 'profissional',
  descontraido: 'descontraído',
  ousado: 'ousado',
  amigavel: 'amigável',
}

// ---------------------------------------------------------------
// Adaptador
// ---------------------------------------------------------------

export interface OpcoesAdaptadorClaude {
  /** Chamado quando a chamada falha e o adaptador local assume */
  aoFalhar?: (erro: unknown) => void
  /** Adaptador usado nas operações de pixel e como reserva */
  base?: AdaptadorIA
}

export function criarAdaptadorClaude(
  cliente: ClienteClaude,
  opcoes: OpcoesAdaptadorClaude = {},
): AdaptadorIA {
  const base = opcoes.base ?? adaptadorLocal
  const avisar = opcoes.aoFalhar ?? (() => {})

  /** Executa o pedido; devolve null (e avisa) se algo der errado */
  const tentar = async (pedido: PedidoClaude): Promise<Record<string, unknown> | null> => {
    try {
      const resposta = await cliente.gerar(pedido)
      if (typeof resposta !== 'object' || resposta === null) throw new Error('resposta vazia')
      return resposta as Record<string, unknown>
    } catch (erro) {
      avisar(erro)
      return null
    }
  }

  return {
    id: 'claude',
    nome: 'Claude',

    gerarTextos: async (tipo, assunto, tom) => {
      const dados = await tentar({
        sistema: SISTEMA_TEXTO,
        usuario: `Escreva 4 variações de ${rotuloTipo[tipo]} em tom ${rotuloTom[tom]} sobre: ${assunto || 'um assunto livre'}.`,
        esquema: ESQUEMA_TEXTOS,
        esforco: 'low',
      })
      const opcoes = listaDeTextos(dados?.opcoes)
      return opcoes.length > 0 ? opcoes : base.gerarTextos(tipo, assunto, tom)
    },

    sugerirEstilo: async (descricao) => {
      const dados = await tentar({
        sistema: SISTEMA_ESTILO,
        usuario: `Sugira fontes e paleta para: ${descricao || 'uma peça de comunicação'}.`,
        esquema: ESQUEMA_ESTILO,
        esforco: 'low',
      })
      const paleta = listaDeTextos((dados?.paleta as unknown))
        .map((c) => corValida(c, ''))
        .filter((c) => c !== '')
      const par = dados?.parFonte as Record<string, unknown> | undefined
      if (paleta.length === 0 || !par) return base.sugerirEstilo(descricao)

      const sugestao: SugestaoEstilo = {
        parFonte: {
          nome: typeof par.nome === 'string' && par.nome.trim() !== '' ? par.nome : 'Sugestão',
          titulo: fonteValida(par.titulo),
          corpo: fonteValida(par.corpo),
        },
        paleta,
      }
      return sugestao
    },

    gerarDesign: async (descricao) => {
      const dados = await tentar({
        sistema: SISTEMA_DESIGN,
        usuario: `Componha 4 opções de layout para: ${descricao || 'uma peça de comunicação'}.`,
        esquema: ESQUEMA_DESIGN,
        esforco: 'medium',
      })
      const brutas = Array.isArray(dados?.opcoes) ? (dados.opcoes as unknown[]) : []
      const opcoes: OpcaoDesignIA[] = []

      for (const [i, bruta] of brutas.entries()) {
        if (typeof bruta !== 'object' || bruta === null) continue
        const o = bruta as Record<string, unknown>
        const elementosBrutos = Array.isArray(o.elementos) ? (o.elementos as ElementoBruto[]) : []
        if (elementosBrutos.length === 0) continue

        const corFundo = corValida(o.corFundo, '#ffffff')
        const preview = listaDeTextos(o.coresPreview).map((c) => corValida(c, corFundo))
        opcoes.push({
          id: `claude-${i}`,
          nome: typeof o.nome === 'string' && o.nome.trim() !== '' ? o.nome : `Opção ${i + 1}`,
          corFundo,
          coresPreview: [
            preview[0] ?? corFundo,
            preview[1] ?? '#7c4dff',
            preview[2] ?? '#1f2937',
          ],
          // Os elementos só são construídos quando o tamanho do canvas
          // é conhecido — a mesma opção serve a qualquer formato.
          gerarElementos: (largura, altura) =>
            elementosBrutos
              .map((e) => materializar(e, largura, altura))
              .filter((e): e is Elemento => e !== null),
        })
      }

      return opcoes.length > 0 ? opcoes : base.gerarDesign(descricao)
    },

    // Operações de pixel: o navegador resolve melhor, offline e de graça
    removerFundo: (imagem) => base.removerFundo(imagem),
    extrairPaleta: (imagem, quantidade) => base.extrairPaleta(imagem, quantidade),
  }
}
