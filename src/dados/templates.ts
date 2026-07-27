// =============================================================
// Templates básicos (Fase 1) — cada template é uma função que
// recebe o tamanho do canvas e devolve elementos posicionados
// proporcionalmente, para funcionar em qualquer formato.
// =============================================================

import {
  criarForma,
  criarLinha,
  criarTexto,
  instantaneoContadorNomes,
  restaurarContadorNomes,
} from '../nucleo/elementos'
import { paginaParaSvg } from '../nucleo/exportadores/svg'
import { Elemento, Pagina } from '../tipos/projeto'

export type CategoriaTemplate =
  | 'Social Media'
  | 'Negócios'
  | 'Educação'
  | 'Eventos'
  | 'Marketing'
  | 'Comida'
  | 'Moda'

export interface Template {
  id: string
  nome: string
  categoria: CategoriaTemplate
  /** Cores para o cartão de pré-visualização no painel */
  coresPreview: [string, string, string]
  corFundo: string
  gerarElementos: (largura: number, altura: number) => Elemento[]
}

/** Ordem das categorias no navegador de modelos */
export const CATEGORIAS_TEMPLATE: CategoriaTemplate[] = [
  'Social Media',
  'Marketing',
  'Negócios',
  'Educação',
  'Eventos',
  'Comida',
  'Moda',
]

// ---------------------------------------------------------------
// Miniatura real do modelo: renderiza os elementos do template em SVG
// (vetorial, leve) e devolve um data URL cacheado. A geração não deve
// mexer no contador de nomes global, então é preservado e restaurado.
// ---------------------------------------------------------------
const LADO_MINIATURA = 500
const cacheMiniatura = new Map<string, string>()

export function miniaturaTemplate(t: Template): string {
  const emCache = cacheMiniatura.get(t.id)
  if (emCache) return emCache
  const snap = instantaneoContadorNomes()
  const elementos = t.gerarElementos(LADO_MINIATURA, LADO_MINIATURA)
  restaurarContadorNomes(snap)
  const pagina = { corFundo: t.corFundo, elementos } as Pagina
  const svg = paginaParaSvg(pagina, LADO_MINIATURA, LADO_MINIATURA)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  cacheMiniatura.set(t.id, url)
  return url
}

export const TEMPLATES: Template[] = [
  {
    id: 'promo-moderno',
    nome: 'Promoção moderna',
    categoria: 'Marketing',
    coresPreview: ['#181b21', '#ffd166', '#7c4dff'],
    corFundo: '#181b21',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, a * 0.62, {
        nome: 'Faixa inferior',
        largura: l,
        altura: a * 0.38,
        preenchimento: '#7c4dff',
      }),
      criarForma('elipse', l * 0.68, a * 0.06, {
        nome: 'Círculo destaque',
        largura: l * 0.26,
        altura: l * 0.26,
        preenchimento: '#ffd166',
      }),
      criarTexto(l * 0.72, a * 0.13, {
        texto: '50%\nOFF',
        tamanhoFonte: Math.round(l * 0.055),
        negrito: true,
        cor: '#181b21',
        alinhamento: 'center',
        largura: l * 0.18,
      }),
      criarTexto(l * 0.08, a * 0.3, {
        texto: 'SUPER\nPROMOÇÃO',
        tamanhoFonte: Math.round(l * 0.085),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.84,
        alturaLinha: 1.05,
      }),
      criarTexto(l * 0.08, a * 0.68, {
        texto: 'Somente esta semana, aproveite!',
        tamanhoFonte: Math.round(l * 0.035),
        cor: '#ffffff',
        largura: l * 0.84,
      }),
      criarForma('retangulo', l * 0.08, a * 0.78, {
        nome: 'Botão CTA',
        largura: l * 0.4,
        altura: a * 0.09,
        preenchimento: '#ffd166',
        raioCanto: 999,
      }),
      criarTexto(l * 0.08, a * 0.803, {
        texto: 'PEÇA AGORA',
        tamanhoFonte: Math.round(l * 0.033),
        negrito: true,
        cor: '#181b21',
        alinhamento: 'center',
        largura: l * 0.4,
      }),
    ],
  },
  {
    id: 'citacao-minimalista',
    nome: 'Citação minimalista',
    categoria: 'Social Media',
    coresPreview: ['#f6f1ea', '#b08968', '#3d3d3d'],
    corFundo: '#f6f1ea',
    gerarElementos: (l, a) => [
      criarForma('retangulo', l * 0.06, a * 0.06, {
        nome: 'Moldura',
        largura: l * 0.88,
        altura: a * 0.88,
        preenchimento: '#00000000',
        corBorda: '#b08968',
        espessuraBorda: Math.max(2, l * 0.004),
      }),
      criarTexto(l * 0.12, a * 0.3, {
        texto: '“A criatividade é a\ninteligência se divertindo.”',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.06),
        cor: '#3d3d3d',
        alinhamento: 'center',
        largura: l * 0.76,
        alturaLinha: 1.3,
      }),
      criarLinha(l * 0.42, a * 0.56, {
        pontos: [0, 0, l * 0.16, 0],
        cor: '#b08968',
        espessura: Math.max(2, l * 0.004),
      }),
      criarTexto(l * 0.12, a * 0.6, {
        texto: 'ALBERT EINSTEIN',
        tamanhoFonte: Math.round(l * 0.028),
        cor: '#b08968',
        alinhamento: 'center',
        largura: l * 0.76,
        espacamentoLetras: 4,
      }),
    ],
  },
  {
    id: 'thumbnail-impacto',
    nome: 'Thumbnail de impacto',
    categoria: 'Social Media',
    coresPreview: ['#0f172a', '#ef4444', '#facc15'],
    corFundo: '#0f172a',
    gerarElementos: (l, a) => [
      criarForma('retangulo', -l * 0.05, a * 0.55, {
        nome: 'Faixa diagonal',
        largura: l * 1.15,
        altura: a * 0.28,
        preenchimento: '#ef4444',
        rotacao: -4,
      }),
      criarTexto(l * 0.05, a * 0.12, {
        texto: 'VOCÊ PRECISA\nVER ISSO',
        tamanhoFonte: Math.round(a * 0.17),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.9,
        alturaLinha: 1.05,
      }),
      criarTexto(l * 0.05, a * 0.62, {
        texto: 'ANTES QUE ACABE ➜',
        tamanhoFonte: Math.round(a * 0.09),
        negrito: true,
        cor: '#facc15',
        largura: l * 0.9,
      }),
      criarForma('estrela', l * 0.82, a * 0.08, {
        nome: 'Estrela destaque',
        largura: a * 0.28,
        altura: a * 0.28,
        preenchimento: '#facc15',
        rotacao: 15,
      }),
    ],
  },
  {
    id: 'aula-educacao',
    nome: 'Aula / Educação',
    categoria: 'Educação',
    coresPreview: ['#eef6ff', '#2563eb', '#1e3a5f'],
    corFundo: '#eef6ff',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, 0, {
        nome: 'Cabeçalho',
        largura: l,
        altura: a * 0.16,
        preenchimento: '#2563eb',
      }),
      criarTexto(l * 0.06, a * 0.045, {
        texto: 'AULA 01 — INTRODUÇÃO',
        tamanhoFonte: Math.round(l * 0.032),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.88,
        espacamentoLetras: 2,
      }),
      criarTexto(l * 0.06, a * 0.28, {
        texto: 'O que você vai aprender hoje',
        tamanhoFonte: Math.round(l * 0.055),
        negrito: true,
        cor: '#1e3a5f',
        largura: l * 0.88,
      }),
      criarForma('elipse', l * 0.06, a * 0.48, {
        nome: 'Marcador 1',
        largura: l * 0.03,
        altura: l * 0.03,
        preenchimento: '#2563eb',
      }),
      criarTexto(l * 0.11, a * 0.475, {
        texto: 'Conceitos fundamentais',
        tamanhoFonte: Math.round(l * 0.035),
        cor: '#1e3a5f',
        largura: l * 0.8,
      }),
      criarForma('elipse', l * 0.06, a * 0.58, {
        nome: 'Marcador 2',
        largura: l * 0.03,
        altura: l * 0.03,
        preenchimento: '#2563eb',
      }),
      criarTexto(l * 0.11, a * 0.575, {
        texto: 'Exemplos práticos',
        tamanhoFonte: Math.round(l * 0.035),
        cor: '#1e3a5f',
        largura: l * 0.8,
      }),
      criarForma('elipse', l * 0.06, a * 0.68, {
        nome: 'Marcador 3',
        largura: l * 0.03,
        altura: l * 0.03,
        preenchimento: '#2563eb',
      }),
      criarTexto(l * 0.11, a * 0.675, {
        texto: 'Exercícios para fixação',
        tamanhoFonte: Math.round(l * 0.035),
        cor: '#1e3a5f',
        largura: l * 0.8,
      }),
    ],
  },
  {
    id: 'evento-festa',
    nome: 'Convite de evento',
    categoria: 'Eventos',
    coresPreview: ['#2d1b4e', '#e879f9', '#fbbf24'],
    corFundo: '#2d1b4e',
    gerarElementos: (l, a) => [
      criarForma('elipse', -l * 0.2, -l * 0.2, {
        nome: 'Bolha superior',
        largura: l * 0.55,
        altura: l * 0.55,
        preenchimento: '#e879f9',
        opacidade: 0.35,
      }),
      criarForma('elipse', l * 0.7, a * 0.75, {
        nome: 'Bolha inferior',
        largura: l * 0.5,
        altura: l * 0.5,
        preenchimento: '#fbbf24',
        opacidade: 0.3,
      }),
      criarTexto(l * 0.1, a * 0.22, {
        texto: 'VOCÊ ESTÁ\nCONVIDADO!',
        tamanhoFonte: Math.round(l * 0.09),
        negrito: true,
        cor: '#ffffff',
        alinhamento: 'center',
        largura: l * 0.8,
        alturaLinha: 1.1,
      }),
      criarTexto(l * 0.1, a * 0.5, {
        texto: 'Sábado · 20h · Espaço Central',
        tamanhoFonte: Math.round(l * 0.038),
        cor: '#e879f9',
        alinhamento: 'center',
        largura: l * 0.8,
      }),
      criarLinha(l * 0.3, a * 0.6, {
        pontos: [0, 0, l * 0.4, 0],
        cor: '#fbbf24',
        espessura: 3,
        tracejada: true,
      }),
      criarTexto(l * 0.1, a * 0.65, {
        texto: 'Confirme sua presença',
        tamanhoFonte: Math.round(l * 0.03),
        cor: '#ffffff',
        alinhamento: 'center',
        largura: l * 0.8,
        espacamentoLetras: 2,
      }),
    ],
  },
  {
    id: 'negocios-corporativo',
    nome: 'Anúncio corporativo',
    categoria: 'Negócios',
    coresPreview: ['#ffffff', '#0f766e', '#134e4a'],
    corFundo: '#ffffff',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, 0, {
        nome: 'Painel lateral',
        largura: l * 0.42,
        altura: a,
        preenchimento: '#0f766e',
      }),
      criarTexto(l * 0.06, a * 0.18, {
        texto: 'SUA\nEMPRESA',
        tamanhoFonte: Math.round(l * 0.06),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.32,
        alturaLinha: 1.15,
      }),
      criarLinha(l * 0.06, a * 0.42, {
        pontos: [0, 0, l * 0.2, 0],
        cor: '#5eead4',
        espessura: 4,
      }),
      criarTexto(l * 0.5, a * 0.25, {
        texto: 'Soluções que\ntransformam',
        tamanhoFonte: Math.round(l * 0.055),
        negrito: true,
        cor: '#134e4a',
        largura: l * 0.44,
        alturaLinha: 1.2,
      }),
      criarTexto(l * 0.5, a * 0.52, {
        texto: 'Consultoria, tecnologia e resultados para o seu negócio crescer.',
        tamanhoFonte: Math.round(l * 0.028),
        cor: '#475569',
        largura: l * 0.42,
        alturaLinha: 1.4,
      }),
      criarForma('retangulo', l * 0.5, a * 0.72, {
        nome: 'Botão contato',
        largura: l * 0.28,
        altura: a * 0.08,
        preenchimento: '#134e4a',
        raioCanto: 8,
      }),
      criarTexto(l * 0.5, a * 0.742, {
        texto: 'FALE CONOSCO',
        tamanhoFonte: Math.round(l * 0.024),
        negrito: true,
        cor: '#ffffff',
        alinhamento: 'center',
        largura: l * 0.28,
        espacamentoLetras: 1,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Social Media
  // ---------------------------------------------------------------
  {
    id: 'post-gradiente-frase',
    nome: 'Frase em gradiente',
    categoria: 'Social Media',
    coresPreview: ['#7c4dff', '#ff6ec7', '#ffffff'],
    corFundo: '#7c4dff',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, 0, {
        nome: 'Fundo gradiente',
        largura: l,
        altura: a,
        preenchimento: '#7c4dff',
        gradiente: {
          tipo: 'linear',
          angulo: 135,
          paradas: [
            { deslocamento: 0, cor: '#7c4dff' },
            { deslocamento: 1, cor: '#ff6ec7' },
          ],
        },
      }),
      criarTexto(l * 0.1, a * 0.32, {
        texto: 'Faça hoje o que\nvai te orgulhar\namanhã.',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.08),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.8,
        alturaLinha: 1.15,
      }),
      criarLinha(l * 0.1, a * 0.7, {
        pontos: [0, 0, l * 0.18, 0],
        cor: '#ffffff',
        espessura: Math.max(3, l * 0.006),
      }),
      criarTexto(l * 0.1, a * 0.74, {
        texto: '@suamarca',
        tamanhoFonte: Math.round(l * 0.032),
        cor: '#ffffff',
        largura: l * 0.8,
        espacamentoLetras: 2,
      }),
    ],
  },
  {
    id: 'post-carrossel-dica',
    nome: 'Dica em destaque',
    categoria: 'Social Media',
    coresPreview: ['#ffffff', '#111827', '#7c4dff'],
    corFundo: '#ffffff',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, 0, {
        nome: 'Barra topo',
        largura: l,
        altura: a * 0.03,
        preenchimento: '#7c4dff',
      }),
      criarTexto(l * 0.08, a * 0.1, {
        texto: 'DICA #03',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#7c4dff',
        largura: l * 0.84,
        espacamentoLetras: 3,
      }),
      criarTexto(l * 0.08, a * 0.18, {
        texto: 'Comece antes de\nse sentir pronto',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.075),
        negrito: true,
        cor: '#111827',
        largura: l * 0.84,
        alturaLinha: 1.1,
      }),
      criarForma('retangulo', l * 0.08, a * 0.46, {
        nome: 'Cartão',
        largura: l * 0.84,
        altura: a * 0.34,
        preenchimento: '#f5f3ff',
        raioCanto: Math.round(l * 0.03),
      }),
      criarTexto(l * 0.13, a * 0.52, {
        texto: 'A perfeição paralisa. A ação constrói. Dê o primeiro passo pequeno hoje e ajuste o caminho depois.',
        tamanhoFonte: Math.round(l * 0.035),
        cor: '#4c1d95',
        largura: l * 0.74,
        alturaLinha: 1.5,
      }),
      criarTexto(l * 0.08, a * 0.88, {
        texto: 'Arraste para o lado →',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#7c4dff',
        largura: l * 0.84,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Marketing
  // ---------------------------------------------------------------
  {
    id: 'promo-black-friday',
    nome: 'Black Friday',
    categoria: 'Marketing',
    coresPreview: ['#000000', '#facc15', '#ffffff'],
    corFundo: '#000000',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, a * 0.34, {
        nome: 'Faixa',
        largura: l,
        altura: a * 0.2,
        preenchimento: '#facc15',
      }),
      criarTexto(l * 0.06, a * 0.1, {
        texto: 'BLACK',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.16),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.88,
        alturaLinha: 1,
      }),
      criarTexto(l * 0.06, a * 0.355, {
        texto: 'FRIDAY',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.16),
        negrito: true,
        cor: '#000000',
        largura: l * 0.88,
        alturaLinha: 1,
      }),
      criarTexto(l * 0.06, a * 0.62, {
        texto: 'ATÉ 70% OFF',
        tamanhoFonte: Math.round(l * 0.07),
        negrito: true,
        cor: '#facc15',
        largura: l * 0.88,
      }),
      criarForma('retangulo', l * 0.06, a * 0.76, {
        nome: 'Botão',
        largura: l * 0.5,
        altura: a * 0.1,
        preenchimento: '#ffffff',
        raioCanto: 999,
      }),
      criarTexto(l * 0.06, a * 0.785, {
        texto: 'COMPRAR AGORA',
        tamanhoFonte: Math.round(l * 0.032),
        negrito: true,
        cor: '#000000',
        alinhamento: 'center',
        largura: l * 0.5,
      }),
    ],
  },
  {
    id: 'lancamento-produto',
    nome: 'Lançamento de produto',
    categoria: 'Marketing',
    coresPreview: ['#0f172a', '#38bdf8', '#ffffff'],
    corFundo: '#0f172a',
    gerarElementos: (l, a) => [
      criarForma('elipse', l * 0.55, a * 0.1, {
        nome: 'Halo',
        largura: l * 0.6,
        altura: l * 0.6,
        preenchimento: '#38bdf8',
        opacidade: 0.25,
      }),
      criarTexto(l * 0.08, a * 0.12, {
        texto: 'NOVIDADE',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#38bdf8',
        largura: l * 0.84,
        espacamentoLetras: 4,
      }),
      criarTexto(l * 0.08, a * 0.2, {
        texto: 'O futuro\nchegou',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.11),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.84,
        alturaLinha: 1.05,
      }),
      criarTexto(l * 0.08, a * 0.5, {
        texto: 'Conheça a nova geração que vai transformar sua rotina.',
        tamanhoFonte: Math.round(l * 0.034),
        cor: '#cbd5e1',
        largura: l * 0.7,
        alturaLinha: 1.4,
      }),
      criarForma('retangulo', l * 0.08, a * 0.68, {
        nome: 'Botão',
        largura: l * 0.42,
        altura: a * 0.09,
        preenchimento: '#38bdf8',
        raioCanto: 10,
      }),
      criarTexto(l * 0.08, a * 0.702, {
        texto: 'SAIBA MAIS',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#0f172a',
        alinhamento: 'center',
        largura: l * 0.42,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Negócios
  // ---------------------------------------------------------------
  {
    id: 'vaga-emprego',
    nome: 'Estamos contratando',
    categoria: 'Negócios',
    coresPreview: ['#1e1b4b', '#a78bfa', '#ffffff'],
    corFundo: '#1e1b4b',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, 0, {
        nome: 'Cabeçalho',
        largura: l,
        altura: a * 0.4,
        preenchimento: '#4c1d95',
      }),
      criarForma('elipse', l * 0.72, a * 0.06, {
        nome: 'Bolha',
        largura: l * 0.4,
        altura: l * 0.4,
        preenchimento: '#a78bfa',
        opacidade: 0.4,
      }),
      criarTexto(l * 0.08, a * 0.13, {
        texto: 'ESTAMOS\nCONTRATANDO',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.075),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.84,
        alturaLinha: 1.1,
      }),
      criarTexto(l * 0.08, a * 0.5, {
        texto: 'Pessoa Desenvolvedora',
        tamanhoFonte: Math.round(l * 0.05),
        negrito: true,
        cor: '#a78bfa',
        largura: l * 0.84,
      }),
      criarTexto(l * 0.08, a * 0.6, {
        texto: '• Remoto  • CLT ou PJ  • Horário flexível',
        tamanhoFonte: Math.round(l * 0.032),
        cor: '#e9d5ff',
        largura: l * 0.84,
        alturaLinha: 1.6,
      }),
      criarForma('retangulo', l * 0.08, a * 0.78, {
        nome: 'Botão',
        largura: l * 0.56,
        altura: a * 0.09,
        preenchimento: '#a78bfa',
        raioCanto: 999,
      }),
      criarTexto(l * 0.08, a * 0.803, {
        texto: 'CANDIDATE-SE JÁ',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#1e1b4b',
        alinhamento: 'center',
        largura: l * 0.56,
      }),
    ],
  },
  {
    id: 'depoimento-cliente',
    nome: 'Depoimento de cliente',
    categoria: 'Negócios',
    coresPreview: ['#f8fafc', '#0f766e', '#111827'],
    corFundo: '#f8fafc',
    gerarElementos: (l, a) => [
      criarTexto(l * 0.08, a * 0.1, {
        texto: '“',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.2),
        negrito: true,
        cor: '#0f766e',
        largura: l * 0.3,
      }),
      criarTexto(l * 0.08, a * 0.32, {
        texto: 'Superou todas as\nnossas expectativas.\nRecomendo demais!',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.06),
        cor: '#111827',
        largura: l * 0.84,
        alturaLinha: 1.3,
      }),
      criarForma('elipse', l * 0.08, a * 0.68, {
        nome: 'Avatar',
        largura: l * 0.14,
        altura: l * 0.14,
        preenchimento: '#0f766e',
      }),
      criarTexto(l * 0.26, a * 0.7, {
        texto: 'Marina Alves',
        tamanhoFonte: Math.round(l * 0.036),
        negrito: true,
        cor: '#111827',
        largura: l * 0.6,
      }),
      criarTexto(l * 0.26, a * 0.75, {
        texto: 'CEO · Studio Norte',
        tamanhoFonte: Math.round(l * 0.028),
        cor: '#0f766e',
        largura: l * 0.6,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Educação
  // ---------------------------------------------------------------
  {
    id: 'webinar-online',
    nome: 'Webinar gratuito',
    categoria: 'Educação',
    coresPreview: ['#082f49', '#22d3ee', '#fde68a'],
    corFundo: '#082f49',
    gerarElementos: (l, a) => [
      criarForma('retangulo', l * 0.06, a * 0.06, {
        nome: 'Moldura',
        largura: l * 0.88,
        altura: a * 0.88,
        preenchimento: '#00000000',
        corBorda: '#22d3ee',
        espessuraBorda: Math.max(2, l * 0.004),
        raioCanto: Math.round(l * 0.02),
      }),
      criarTexto(l * 0.1, a * 0.14, {
        texto: 'WEBINAR AO VIVO',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#fde68a',
        largura: l * 0.8,
        espacamentoLetras: 3,
      }),
      criarTexto(l * 0.1, a * 0.24, {
        texto: 'Como crescer no\nInstagram em 2025',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.075),
        negrito: true,
        cor: '#ffffff',
        largura: l * 0.8,
        alturaLinha: 1.1,
      }),
      criarLinha(l * 0.1, a * 0.52, {
        pontos: [0, 0, l * 0.8, 0],
        cor: '#22d3ee',
        espessura: 2,
        tracejada: true,
      }),
      criarTexto(l * 0.1, a * 0.58, {
        texto: '📅 12 de Março · 19h\n🎁 Gratuito com certificado',
        tamanhoFonte: Math.round(l * 0.036),
        cor: '#e0f2fe',
        largura: l * 0.8,
        alturaLinha: 1.6,
      }),
      criarForma('retangulo', l * 0.1, a * 0.76, {
        nome: 'Botão',
        largura: l * 0.5,
        altura: a * 0.09,
        preenchimento: '#22d3ee',
        raioCanto: 8,
      }),
      criarTexto(l * 0.1, a * 0.782, {
        texto: 'GARANTIR VAGA',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#082f49',
        alinhamento: 'center',
        largura: l * 0.5,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------
  {
    id: 'aniversario-festa',
    nome: 'Feliz aniversário',
    categoria: 'Eventos',
    coresPreview: ['#ffe5ec', '#ff5d8f', '#ffbe0b'],
    corFundo: '#ffe5ec',
    gerarElementos: (l, a) => [
      criarForma('elipse', -l * 0.15, -l * 0.15, {
        nome: 'Confete 1',
        largura: l * 0.4,
        altura: l * 0.4,
        preenchimento: '#ffbe0b',
        opacidade: 0.5,
      }),
      criarForma('estrela', l * 0.72, a * 0.05, {
        nome: 'Estrela',
        largura: l * 0.2,
        altura: l * 0.2,
        preenchimento: '#ff5d8f',
      }),
      criarForma('elipse', l * 0.78, a * 0.8, {
        nome: 'Confete 2',
        largura: l * 0.3,
        altura: l * 0.3,
        preenchimento: '#ff5d8f',
        opacidade: 0.4,
      }),
      criarTexto(l * 0.1, a * 0.3, {
        texto: 'Feliz\nAniversário!',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.11),
        negrito: true,
        cor: '#b5179e',
        alinhamento: 'center',
        largura: l * 0.8,
        alturaLinha: 1.1,
      }),
      criarTexto(l * 0.1, a * 0.62, {
        texto: 'Que seu dia seja tão especial quanto você. 🎉',
        tamanhoFonte: Math.round(l * 0.036),
        cor: '#7a2048',
        alinhamento: 'center',
        largura: l * 0.8,
        alturaLinha: 1.4,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Comida
  // ---------------------------------------------------------------
  {
    id: 'cardapio-dia',
    nome: 'Prato do dia',
    categoria: 'Comida',
    coresPreview: ['#1b1b1b', '#e63946', '#ffd166'],
    corFundo: '#1b1b1b',
    gerarElementos: (l, a) => [
      criarForma('elipse', l * 0.25, a * 0.08, {
        nome: 'Prato',
        largura: l * 0.5,
        altura: l * 0.5,
        preenchimento: '#e63946',
      }),
      criarForma('elipse', l * 0.31, a * 0.11, {
        nome: 'Prato interno',
        largura: l * 0.38,
        altura: l * 0.38,
        preenchimento: '#ffd166',
      }),
      criarTexto(l * 0.08, a * 0.56, {
        texto: 'PRATO DO DIA',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#ffd166',
        alinhamento: 'center',
        largura: l * 0.84,
        espacamentoLetras: 4,
      }),
      criarTexto(l * 0.08, a * 0.63, {
        texto: 'Massa Artesanal',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.075),
        negrito: true,
        cor: '#ffffff',
        alinhamento: 'center',
        largura: l * 0.84,
      }),
      criarTexto(l * 0.08, a * 0.75, {
        texto: 'Molho da casa, manjericão fresco e parmesão',
        tamanhoFonte: Math.round(l * 0.03),
        cor: '#e5e5e5',
        alinhamento: 'center',
        largura: l * 0.84,
        alturaLinha: 1.4,
      }),
      criarTexto(l * 0.08, a * 0.86, {
        texto: 'R$ 39,90',
        fonte: 'Poppins',
        tamanhoFonte: Math.round(l * 0.06),
        negrito: true,
        cor: '#e63946',
        alinhamento: 'center',
        largura: l * 0.84,
      }),
    ],
  },
  {
    id: 'cafe-promo',
    nome: 'Café especial',
    categoria: 'Comida',
    coresPreview: ['#f6f1ea', '#6f4e37', '#c8a27c'],
    corFundo: '#f6f1ea',
    gerarElementos: (l, a) => [
      criarForma('retangulo', 0, 0, {
        nome: 'Faixa topo',
        largura: l,
        altura: a * 0.22,
        preenchimento: '#6f4e37',
      }),
      criarTexto(l * 0.08, a * 0.07, {
        texto: 'CAFETERIA AROMA',
        tamanhoFonte: Math.round(l * 0.035),
        negrito: true,
        cor: '#f6f1ea',
        largura: l * 0.84,
        espacamentoLetras: 3,
      }),
      criarTexto(l * 0.08, a * 0.32, {
        texto: 'Comece o dia\ncom aroma',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.08),
        negrito: true,
        cor: '#6f4e37',
        largura: l * 0.84,
        alturaLinha: 1.15,
      }),
      criarLinha(l * 0.08, a * 0.58, {
        pontos: [0, 0, l * 0.24, 0],
        cor: '#c8a27c',
        espessura: Math.max(3, l * 0.006),
      }),
      criarTexto(l * 0.08, a * 0.63, {
        texto: 'Espresso, cappuccino e métodos coados feitos na hora.',
        tamanhoFonte: Math.round(l * 0.032),
        cor: '#8a6d52',
        largura: l * 0.8,
        alturaLinha: 1.5,
      }),
      criarForma('retangulo', l * 0.08, a * 0.8, {
        nome: 'Selo',
        largura: l * 0.44,
        altura: a * 0.1,
        preenchimento: '#6f4e37',
        raioCanto: 999,
      }),
      criarTexto(l * 0.08, a * 0.825, {
        texto: '2ª XÍCARA GRÁTIS',
        tamanhoFonte: Math.round(l * 0.028),
        negrito: true,
        cor: '#f6f1ea',
        alinhamento: 'center',
        largura: l * 0.44,
      }),
    ],
  },

  // ---------------------------------------------------------------
  // Moda
  // ---------------------------------------------------------------
  {
    id: 'colecao-moda',
    nome: 'Nova coleção',
    categoria: 'Moda',
    coresPreview: ['#efe9e1', '#1b1b1b', '#b08968'],
    corFundo: '#efe9e1',
    gerarElementos: (l, a) => [
      criarForma('retangulo', l * 0.5, 0, {
        nome: 'Bloco',
        largura: l * 0.5,
        altura: a,
        preenchimento: '#1b1b1b',
      }),
      criarTexto(l * 0.08, a * 0.16, {
        texto: 'NEW IN',
        tamanhoFonte: Math.round(l * 0.03),
        negrito: true,
        cor: '#b08968',
        largura: l * 0.36,
        espacamentoLetras: 6,
      }),
      criarTexto(l * 0.08, a * 0.26, {
        texto: 'Coleção\nOutono',
        fonte: 'Playfair Display',
        tamanhoFonte: Math.round(l * 0.09),
        cor: '#1b1b1b',
        largura: l * 0.4,
        alturaLinha: 1.1,
      }),
      criarTexto(l * 0.08, a * 0.66, {
        texto: 'Peças atemporais em tons quentes.',
        tamanhoFonte: Math.round(l * 0.03),
        cor: '#5b5147',
        largura: l * 0.36,
        alturaLinha: 1.5,
      }),
      criarTexto(l * 0.58, a * 0.82, {
        texto: 'VER LOOKBOOK',
        tamanhoFonte: Math.round(l * 0.028),
        negrito: true,
        cor: '#efe9e1',
        largura: l * 0.36,
        espacamentoLetras: 2,
      }),
      criarLinha(l * 0.58, a * 0.8, {
        pontos: [0, 0, l * 0.34, 0],
        cor: '#b08968',
        espessura: 2,
      }),
    ],
  },
]
