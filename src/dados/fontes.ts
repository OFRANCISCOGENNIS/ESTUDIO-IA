// Fontes disponíveis no painel de Texto (carregadas via Google Fonts
// no index.html). Em fases futuras aceitará upload de fontes próprias.

export interface OpcaoFonte {
  nome: string
  /** family CSS aplicada */
  familia: string
  /** Amostra para o seletor */
  categoria: 'Sans' | 'Serif' | 'Display' | 'Manuscrita'
}

export const FONTES: OpcaoFonte[] = [
  { nome: 'Inter', familia: 'Inter', categoria: 'Sans' },
  { nome: 'Poppins', familia: 'Poppins', categoria: 'Sans' },
  { nome: 'Montserrat', familia: 'Montserrat', categoria: 'Sans' },
  { nome: 'Roboto', familia: 'Roboto', categoria: 'Sans' },
  { nome: 'Playfair Display', familia: 'Playfair Display', categoria: 'Serif' },
  { nome: 'Bebas Neue', familia: 'Bebas Neue', categoria: 'Display' },
  { nome: 'Lobster', familia: 'Lobster', categoria: 'Display' },
  { nome: 'Caveat', familia: 'Caveat', categoria: 'Manuscrita' },
]

/** Combinações tipográficas prontas (título + corpo) */
export interface ParFonte {
  nome: string
  titulo: string
  corpo: string
}

export const PARES_FONTES: ParFonte[] = [
  { nome: 'Elegante', titulo: 'Playfair Display', corpo: 'Inter' },
  { nome: 'Moderno', titulo: 'Poppins', corpo: 'Roboto' },
  { nome: 'Impactante', titulo: 'Bebas Neue', corpo: 'Montserrat' },
  { nome: 'Descontraído', titulo: 'Lobster', corpo: 'Inter' },
]
