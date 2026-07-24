// =============================================================
// Templates básicos (Fase 1) — cada template é uma função que
// recebe o tamanho do canvas e devolve elementos posicionados
// proporcionalmente, para funcionar em qualquer formato.
// =============================================================

import { criarForma, criarLinha, criarTexto } from '../nucleo/elementos'
import { Elemento } from '../tipos/projeto'

export interface Template {
  id: string
  nome: string
  categoria: 'Social Media' | 'Negócios' | 'Educação' | 'Eventos' | 'Marketing'
  /** Cores para o cartão de pré-visualização no painel */
  coresPreview: [string, string, string]
  corFundo: string
  gerarElementos: (largura: number, altura: number) => Elemento[]
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
]
