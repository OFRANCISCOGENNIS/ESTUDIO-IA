// =============================================================
// Contrato dos provedores de IA (adapter pattern).
// A interface `AdaptadorIA` isola o editor de QUALQUER provedor: hoje
// usamos um adaptador local (no navegador); amanhã basta registrar um
// adaptador que chame uma API real (ex.: Claude) sem tocar na UI.
// =============================================================

import { Elemento } from '../../tipos/projeto'

/** Tom de voz para geração/reescrita de texto */
export type TomTexto = 'profissional' | 'descontraido' | 'ousado' | 'amigavel'

/** Tipos de texto que a IA sabe gerar */
export type TipoTextoIA = 'titulo' | 'subtitulo' | 'legenda' | 'cta'

/** Uma opção de layout gerada por "texto para design" */
export interface OpcaoDesignIA {
  id: string
  nome: string
  corFundo: string
  /** Cores para o cartão de pré-visualização */
  coresPreview: [string, string, string]
  /** Constrói os elementos no tamanho do canvas alvo */
  gerarElementos: (largura: number, altura: number) => Elemento[]
}

/** Sugestão de estilo (fontes + paleta) para um projeto */
export interface SugestaoEstilo {
  parFonte: { nome: string; titulo: string; corpo: string }
  paleta: string[]
}

/** Provedor de recursos de IA — implementável por qualquer backend */
export interface AdaptadorIA {
  id: string
  nome: string
  /** Gera variações de texto (títulos, legendas, CTAs) com um tom */
  gerarTextos: (tipo: TipoTextoIA, assunto: string, tom: TomTexto) => Promise<string[]>
  /** "Texto para design": 4 layouts completos e editáveis */
  gerarDesign: (descricao: string) => Promise<OpcaoDesignIA[]>
  /** Sugere fontes e paleta a partir de uma descrição/estilo */
  sugerirEstilo: (descricao: string) => Promise<SugestaoEstilo>
  /** Remove o fundo de uma imagem; devolve um data URL PNG com alfa */
  removerFundo: (imagem: HTMLImageElement) => Promise<string>
  /** Extrai uma paleta de cores dominantes da imagem */
  extrairPaleta: (imagem: HTMLImageElement, quantidade: number) => Promise<string[]>
}
