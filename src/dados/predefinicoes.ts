// Tamanhos predefinidos do botão "Criar design" no dashboard,
// agrupados por CONTEXTO de uso (§9.1) — os chips filtram a grade.

import { Predefinicao } from '../tipos/projeto'

/** Contextos de criação, na ordem exibida nos chips */
export const CONTEXTOS = ['Social', 'Impressão', 'Apresentação', 'Web'] as const
export type Contexto = (typeof CONTEXTOS)[number]

export const PREDEFINICOES: Predefinicao[] = [
  // ---- Social ----
  { id: 'post-instagram', nome: 'Post Instagram', largura: 1080, altura: 1080, icone: '📷', contexto: 'Social' },
  { id: 'story', nome: 'Story', largura: 1080, altura: 1920, icone: '📱', contexto: 'Social' },
  { id: 'thumbnail-youtube', nome: 'Thumbnail YouTube', largura: 1280, altura: 720, icone: '▶️', contexto: 'Social' },
  { id: 'post-linkedin', nome: 'Post LinkedIn', largura: 1200, altura: 627, icone: '💬', contexto: 'Social' },
  // ---- Impressão ----
  { id: 'cartao-visita', nome: 'Cartão de visita', largura: 1050, altura: 600, icone: '💼', contexto: 'Impressão' },
  { id: 'a4', nome: 'Documento A4', largura: 2480, altura: 3508, icone: '📄', contexto: 'Impressão' },
  { id: 'flyer-a5', nome: 'Flyer A5', largura: 1748, altura: 2480, icone: '📰', contexto: 'Impressão' },
  { id: 'capa-ebook', nome: 'Capa de e-book', largura: 1600, altura: 2560, icone: '📚', contexto: 'Impressão' },
  // ---- Apresentação ----
  { id: 'apresentacao', nome: 'Apresentação', largura: 1920, altura: 1080, icone: '📊', contexto: 'Apresentação' },
  { id: 'apresentacao-43', nome: 'Slide 4:3', largura: 1024, altura: 768, icone: '🖥️', contexto: 'Apresentação' },
  // ---- Web ----
  { id: 'logo', nome: 'Logo', largura: 500, altura: 500, icone: '💠', contexto: 'Web' },
  { id: 'banner-web', nome: 'Banner web', largura: 1920, altura: 600, icone: '🖼️', contexto: 'Web' },
]
