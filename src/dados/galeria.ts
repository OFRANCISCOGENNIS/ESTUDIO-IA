// =============================================================
// Galeria de elementos e fotos de demonstração.
// Ícones/stickers são SVGs embutidos como data URI (funcionam
// offline e não sujam o canvas na exportação). As fotos usam a
// CDN da Unsplash com CORS habilitado.
// =============================================================

/** Constrói um data URI a partir de uma string SVG */
function svg(conteudo: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(conteudo)}`
}

export interface ItemGaleria {
  id: string
  nome: string
  url: string
  /** Proporção largura/altura para inserir no canvas */
  proporcao: number
}

const cor = '#7c4dff'

/** Ícones vetoriais simples (linha) */
export const ICONES: ItemGaleria[] = [
  {
    id: 'coracao',
    nome: 'Coração',
    proporcao: 1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${cor}"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z"/></svg>`,
    ),
  },
  {
    id: 'estrela',
    nome: 'Estrela',
    proporcao: 1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${cor}"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>`,
    ),
  },
  {
    id: 'raio',
    nome: 'Raio',
    proporcao: 0.62,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${cor}"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>`,
    ),
  },
  {
    id: 'check',
    nome: 'Confirmação',
    proporcao: 1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    ),
  },
  {
    id: 'seta',
    nome: 'Seta',
    proporcao: 1.4,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 20" fill="none" stroke="${cor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10h22M17 3l7 7-7 7"/></svg>`,
    ),
  },
  {
    id: 'balao',
    nome: 'Balão de fala',
    proporcao: 1.1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 22" fill="${cor}"><path d="M3 3h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4v-4H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/></svg>`,
    ),
  },
  {
    id: 'coroa',
    nome: 'Coroa',
    proporcao: 1.3,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 20" fill="${cor}"><path d="M2 6l5 4 6-8 6 8 5-4-2 12H4z"/></svg>`,
    ),
  },
  {
    id: 'balao-coracao',
    nome: 'Curtida',
    proporcao: 1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path fill="${cor}" stroke="none" d="M12 17s-4-2.7-4-5.5A2.3 2.3 0 0 1 12 10a2.3 2.3 0 0 1 4 1.5C16 14.3 12 17 12 17z"/></svg>`,
    ),
  },
]

/** Stickers coloridos (formas divertidas) */
export const STICKERS: ItemGaleria[] = [
  {
    id: 'explosao',
    nome: 'Explosão',
    proporcao: 1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#ffd166"><path d="M50 2l10 22 23-10-10 23 22 10-22 10 10 23-23-10-10 22-10-22-23 10 10-23-22-10 22-10-10-23 23 10z"/></svg>`,
    ),
  },
  {
    id: 'flor',
    nome: 'Flor',
    proporcao: 1,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#f472b6"><circle cx="50" cy="24" r="18"/><circle cx="76" cy="50" r="18"/><circle cx="50" cy="76" r="18"/><circle cx="24" cy="50" r="18"/></g><circle cx="50" cy="50" r="16" fill="#fbbf24"/></svg>`,
    ),
  },
  {
    id: 'nuvem',
    nome: 'Nuvem',
    proporcao: 1.5,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="#93c5fd"><path d="M30 66a22 22 0 0 1 3-44 26 26 0 0 1 50 6 18 18 0 0 1-3 38z"/></svg>`,
    ),
  },
  {
    id: 'arcoiris',
    nome: 'Arco-íris',
    proporcao: 1.6,
    url: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" fill="none" stroke-width="8"><path d="M12 66a48 48 0 0 1 96 0" stroke="#ef4444"/><path d="M24 66a36 36 0 0 1 72 0" stroke="#f59e0b"/><path d="M36 66a24 24 0 0 1 48 0" stroke="#22c55e"/><path d="M48 66a12 12 0 0 1 24 0" stroke="#3b82f6"/></svg>`,
    ),
  },
]

/** Fotos de demonstração (Unsplash com CORS) */
export const FOTOS: ItemGaleria[] = [
  {
    id: 'foto-montanha',
    nome: 'Montanha',
    proporcao: 1.5,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70',
  },
  {
    id: 'foto-cidade',
    nome: 'Cidade',
    proporcao: 1.5,
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=70',
  },
  {
    id: 'foto-comida',
    nome: 'Comida',
    proporcao: 1.5,
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=70',
  },
  {
    id: 'foto-praia',
    nome: 'Praia',
    proporcao: 1.5,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70',
  },
  {
    id: 'foto-flores',
    nome: 'Flores',
    proporcao: 1.5,
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=70',
  },
  {
    id: 'foto-textura',
    nome: 'Textura',
    proporcao: 1.5,
    url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=800&q=70',
  },
]
