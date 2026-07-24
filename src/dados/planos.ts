// =============================================================
// Planos e feature flags. Controla quais recursos ficam liberados por
// plano. A checagem central é `recursoLiberado`; a UI usa isso para
// exibir cadeados/upsell sem espalhar regras de negócio pelos componentes.
// =============================================================

export type Plano = 'gratuito' | 'pro' | 'time'

export type Recurso =
  | 'remover-fundo'
  | 'redimensionar-magico'
  | 'brand-kit'
  | 'texto-para-design'
  | 'magic-write'
  | 'export-svg'

/** Ordem hierárquica dos planos (índice maior = mais recursos) */
const ORDEM: Plano[] = ['gratuito', 'pro', 'time']

/** Plano mínimo necessário para cada recurso */
const RECURSO_MINIMO: Record<Recurso, Plano> = {
  'texto-para-design': 'gratuito',
  'magic-write': 'gratuito',
  'remover-fundo': 'pro',
  'redimensionar-magico': 'pro',
  'brand-kit': 'pro',
  'export-svg': 'pro',
}

export interface InfoPlano {
  id: Plano
  nome: string
  descricao: string
}

export const PLANOS: InfoPlano[] = [
  { id: 'gratuito', nome: 'Gratuito', descricao: 'Editor completo, com limites' },
  { id: 'pro', nome: 'Pro', descricao: 'IA ilimitada, Brand Kit e export SVG' },
  { id: 'time', nome: 'Time', descricao: 'Tudo do Pro + colaboração e workspaces' },
]

/** Indica se um recurso está liberado para o plano atual */
export function recursoLiberado(recurso: Recurso, plano: Plano): boolean {
  return ORDEM.indexOf(plano) >= ORDEM.indexOf(RECURSO_MINIMO[recurso])
}

/** Plano mínimo que libera um recurso (para mensagens de upsell) */
export function planoMinimo(recurso: Recurso): Plano {
  return RECURSO_MINIMO[recurso]
}
