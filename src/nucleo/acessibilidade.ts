// =============================================================
// Verificador de acessibilidade — analisa o contraste dos textos da
// página contra o fundo real atrás deles (WCAG 2.1). Função pura.
// Texto grande (≥24px equivalente) exige 3:1; texto normal, 4.5:1.
// =============================================================

import { Elemento, Pagina } from '../tipos/projeto'
import { corRecolorivel, luminancia } from './recolorir'

/** Razão de contraste WCAG entre duas cores (1 a 21) */
export function razaoContraste(corA: string, corB: string): number {
  const la = luminancia(corA)
  const lb = luminancia(corB)
  const claro = Math.max(la, lb)
  const escuro = Math.min(la, lb)
  return (claro + 0.05) / (escuro + 0.05)
}

export interface AvisoContraste {
  elementoId: string
  nome: string
  texto: string
  corTexto: string
  corFundo: string
  razao: number
  minimo: number
}

/** Cor de fundo efetiva atrás do centro de um texto */
function fundoAtras(pagina: Pagina, indiceTexto: number, cx: number, cy: number): string {
  // Percorre da camada imediatamente abaixo do texto para o fundo
  for (let i = indiceTexto - 1; i >= 0; i--) {
    const el = pagina.elementos[i]
    if (!el.visivel || el.opacidade < 0.5) continue
    if (el.tipo !== 'retangulo' && el.tipo !== 'elipse') continue
    if (!corRecolorivel(el.preenchimento)) continue
    const dentro =
      cx >= el.x && cx <= el.x + el.largura && cy >= el.y && cy <= el.y + el.altura
    if (dentro) return el.gradiente?.paradas[0]?.cor ?? el.preenchimento
  }
  return pagina.corFundo
}

/** Analisa todos os textos visíveis da página e lista contrastes insuficientes */
export function verificarContraste(pagina: Pagina): AvisoContraste[] {
  const avisos: AvisoContraste[] = []
  pagina.elementos.forEach((el: Elemento, indice) => {
    if (el.tipo !== 'texto' || !el.visivel || el.opacidade < 0.5) return
    if (!corRecolorivel(el.cor)) return
    // Texturas/efeitos alteram a cor renderizada — fora do escopo do check
    if (el.textura !== 'nenhuma') return
    const cx = el.x + el.largura / 2
    const cy = el.y + (el.tamanhoFonte * el.alturaLinha) / 2
    const fundo = fundoAtras(pagina, indice, cx, cy)
    if (!corRecolorivel(fundo)) return
    const razao = razaoContraste(el.cor, fundo)
    // Grande: ≥24px, ou ≥18.7px em negrito (aprox. WCAG em px)
    const grande = el.tamanhoFonte >= 24 || (el.negrito && el.tamanhoFonte >= 18.7)
    const minimo = grande ? 3 : 4.5
    if (razao < minimo) {
      avisos.push({
        elementoId: el.id,
        nome: el.nome,
        texto: el.texto.slice(0, 40),
        corTexto: el.cor,
        corFundo: fundo,
        razao: Math.round(razao * 100) / 100,
        minimo,
      })
    }
  })
  return avisos
}
