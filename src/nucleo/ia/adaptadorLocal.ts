// =============================================================
// Adaptador de IA LOCAL — implementa todos os recursos de IA rodando
// 100% no navegador, sem rede nem chaves de API:
//  - paleta automática: amostragem de pixels + quantização
//  - remoção de fundo: flood fill a partir das bordas (bom para fundos
//    sólidos/uniformes, como fotos de produto e logos)
//  - geração/reescrita de texto e "texto para design": modelos de
//    template modulados por tom
// É o adaptador padrão; um provedor real (ex.: Claude) pode substituí-lo
// via `definirAdaptadorIA` sem alterar a interface.
// =============================================================

import { criarForma, criarTexto } from '../elementos'
import { Elemento } from '../../tipos/projeto'
import { PARES_FONTES } from '../../dados/fontes'
import { quantizarCores } from './quantizarPaleta'
import {
  AdaptadorIA,
  OpcaoDesignIA,
  SugestaoEstilo,
  TipoTextoIA,
  TomTexto,
} from './tipos'

/** Primeira letra maiúscula, preservando o restante */
function capitalizar(texto: string): string {
  const t = texto.trim()
  return t.length === 0 ? '' : t.charAt(0).toUpperCase() + t.slice(1)
}

// ---- Geração de texto por template + tom ----

const TITULOS: Record<TomTexto, (a: string, A: string) => string[]> = {
  profissional: (a, A) => [A, `Soluções em ${a}`, `${A}: excelência e resultados`, `Conheça ${a}`, `${A} para o seu negócio`],
  descontraido: (a, A) => [`${A} que você vai amar`, `Bora de ${a}?`, `${A} sem complicação`, `O melhor de ${a}`, `${A} do seu jeito`],
  ousado: (a, A) => [`${A} como nunca`, `Chega de esperar: ${a}`, `${A} que impressiona`, `A revolução do ${a}`, `${A} sem limites`],
  amigavel: (a, A) => [`${A} pra você`, `Vem conhecer ${a}`, `${A} feito com carinho`, `Seu ${a} favorito`, `${A} simples e fácil`],
}

const CTAS: Record<TomTexto, string[]> = {
  profissional: ['Fale conosco', 'Solicite um orçamento', 'Saiba mais', 'Agende agora'],
  descontraido: ['Bora!', 'Quero também', 'Vem ver', 'Peça já'],
  ousado: ['Garanta o seu', 'Não perca', 'Aproveite agora', 'Eu quero'],
  amigavel: ['Saiba mais', 'Fale com a gente', 'Comece agora', 'Experimente'],
}

function gerarTextosSync(tipo: TipoTextoIA, assunto: string, tom: TomTexto): string[] {
  const a = (assunto.trim() || 'seu projeto').toLowerCase()
  const A = capitalizar(assunto.trim() || 'Seu projeto')
  switch (tipo) {
    case 'titulo':
      return TITULOS[tom](a, A)
    case 'subtitulo':
      return [
        `Tudo sobre ${a} em um só lugar`,
        `A escolha certa para ${a}`,
        `${A} com qualidade e cuidado`,
        `Feito para quem valoriza ${a}`,
      ]
    case 'cta':
      return CTAS[tom]
    case 'legenda':
      return [
        `Descubra tudo o que ${a} pode fazer por você. Qualidade, confiança e resultados de verdade.`,
        `${A} do jeito que você merece. Aproveite condições especiais e faça parte dessa novidade!`,
        `Chegou a hora de transformar ${a}. Simples, rápido e feito pensando em você.`,
      ]
  }
}

// ---- Paletas e fontes por palavra-chave (sugestão de estilo) ----

const PALETAS_ESTILO: { chaves: string[]; paleta: string[] }[] = [
  { chaves: ['escuro', 'noite', 'elegante', 'luxo', 'premium'], paleta: ['#0f172a', '#1e293b', '#facc15', '#e2e8f0'] },
  { chaves: ['moderno', 'tech', 'startup', 'digital'], paleta: ['#7c4dff', '#22d3ee', '#0f172a', '#f8fafc'] },
  { chaves: ['natureza', 'orgânico', 'verde', 'saúde', 'eco'], paleta: ['#14532d', '#65a30d', '#f0fdf4', '#fbbf24'] },
  { chaves: ['comida', 'restaurante', 'gastronomia', 'food'], paleta: ['#7c2d12', '#ea580c', '#fef3c7', '#111827'] },
  { chaves: ['festa', 'evento', 'diversão', 'infantil'], paleta: ['#db2777', '#8b5cf6', '#fbbf24', '#fdf4ff'] },
  { chaves: ['praia', 'verão', 'viagem', 'água'], paleta: ['#0ea5e9', '#22d3ee', '#fde68a', '#083344'] },
]

const PALETA_PADRAO = ['#7c4dff', '#ec4899', '#111827', '#f8fafc']

function paletaPara(descricao: string): string[] {
  const d = descricao.toLowerCase()
  return (PALETAS_ESTILO.find((p) => p.chaves.some((c) => d.includes(c)))?.paleta ?? PALETA_PADRAO).slice()
}

function parFontePara(descricao: string): SugestaoEstilo['parFonte'] {
  const d = descricao.toLowerCase()
  if (/(elegante|luxo|premium|clássic|moda)/.test(d)) return PARES_FONTES.find((p) => p.nome === 'Elegante') ?? PARES_FONTES[0]
  if (/(festa|evento|criativ|divertid|infantil)/.test(d)) return PARES_FONTES.find((p) => p.nome === 'Descontraído') ?? PARES_FONTES[0]
  if (/(promoç|oferta|impacto|ousad|urgente)/.test(d)) return PARES_FONTES.find((p) => p.nome === 'Impactante') ?? PARES_FONTES[0]
  return PARES_FONTES.find((p) => p.nome === 'Moderno') ?? PARES_FONTES[0]
}

// ---- "Texto para design": 4 variações de layout ----

interface EstiloDesign {
  id: string
  nome: string
  corFundo: string
  corTitulo: string
  corSub: string
  corAcento: string
  fonteTitulo: string
  fonteCorpo: string
  preview: [string, string, string]
}

function estilos(paleta: string[], parFonte: SugestaoEstilo['parFonte']): EstiloDesign[] {
  const [c1, c2, c3, c4] = [paleta[0] ?? '#111827', paleta[1] ?? '#7c4dff', paleta[2] ?? '#facc15', paleta[3] ?? '#f8fafc']
  return [
    { id: 'moderno-escuro', nome: 'Moderno escuro', corFundo: c1, corTitulo: c4, corSub: c3, corAcento: c2, fonteTitulo: parFonte.titulo, fonteCorpo: parFonte.corpo, preview: [c1, c2, c3] },
    { id: 'minimal-claro', nome: 'Minimalista claro', corFundo: '#f8f7f4', corTitulo: c1, corSub: '#6b7280', corAcento: c2, fonteTitulo: 'Playfair Display', fonteCorpo: 'Inter', preview: ['#f8f7f4', c1, c2] },
    { id: 'vibrante', nome: 'Vibrante', corFundo: c2, corTitulo: '#ffffff', corSub: '#ffffff', corAcento: c3, fonteTitulo: 'Poppins', fonteCorpo: 'Inter', preview: [c2, c3, '#ffffff'] },
    { id: 'elegante', nome: 'Elegante', corFundo: c4, corTitulo: c1, corSub: c1, corAcento: c2, fonteTitulo: 'Playfair Display', fonteCorpo: 'Montserrat', preview: [c4, c1, c2] },
  ]
}

function construirLayout(
  estilo: EstiloDesign,
  titulo: string,
  subtitulo: string,
  cta: string,
): (l: number, a: number) => Elemento[] {
  return (l, a) => {
    const elementos: Elemento[] = []
    // Acento geométrico
    elementos.push(
      criarForma('elipse', l * 0.62, a * 0.05, {
        nome: 'Acento',
        largura: l * 0.4,
        altura: l * 0.4,
        preenchimento: estilo.corAcento,
        opacidade: estilo.id === 'minimal-claro' ? 0.25 : 0.9,
      }),
    )
    // Título
    elementos.push(
      criarTexto(l * 0.08, a * 0.3, {
        texto: titulo,
        fonte: estilo.fonteTitulo,
        tamanhoFonte: Math.round(l * 0.09),
        negrito: true,
        cor: estilo.corTitulo,
        largura: l * 0.84,
        alturaLinha: 1.05,
      }),
    )
    // Subtítulo
    elementos.push(
      criarTexto(l * 0.08, a * 0.56, {
        texto: subtitulo,
        fonte: estilo.fonteCorpo,
        tamanhoFonte: Math.round(l * 0.036),
        cor: estilo.corSub,
        largura: l * 0.8,
        alturaLinha: 1.3,
      }),
    )
    // Botão / CTA
    elementos.push(
      criarForma('retangulo', l * 0.08, a * 0.76, {
        nome: 'Botão',
        largura: l * 0.42,
        altura: a * 0.09,
        preenchimento: estilo.corAcento,
        raioCanto: 999,
      }),
    )
    elementos.push(
      criarTexto(l * 0.08, a * 0.783, {
        texto: cta,
        fonte: estilo.fonteCorpo,
        tamanhoFonte: Math.round(l * 0.032),
        negrito: true,
        cor: estilo.corFundo,
        alinhamento: 'center',
        largura: l * 0.42,
      }),
    )
    return elementos
  }
}

// ---- Operações de imagem (canvas) ----

function contextoDaImagem(imagem: HTMLImageElement, maxLado = 1600): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  largura: number
  altura: number
} | null {
  const escala = Math.min(1, maxLado / Math.max(imagem.naturalWidth || imagem.width, imagem.naturalHeight || imagem.height))
  const largura = Math.max(1, Math.round((imagem.naturalWidth || imagem.width) * escala))
  const altura = Math.max(1, Math.round((imagem.naturalHeight || imagem.height) * escala))
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(imagem, 0, 0, largura, altura)
  return { canvas, ctx, largura, altura }
}

/** Remoção de fundo por flood fill a partir das bordas */
function removerFundoLocal(imagem: HTMLImageElement): string {
  const info = contextoDaImagem(imagem)
  if (!info) return imagem.src
  const { canvas, ctx, largura, altura } = info
  const dados = ctx.getImageData(0, 0, largura, altura)
  const px = dados.data
  const visitado = new Uint8Array(largura * altura)
  const TOL = 38 * 38 * 3

  const corEm = (i: number) => ({ r: px[i * 4], g: px[i * 4 + 1], b: px[i * 4 + 2] })
  const refs = [
    corEm(0),
    corEm(largura - 1),
    corEm((altura - 1) * largura),
    corEm(altura * largura - 1),
  ]
  const ehFundo = (i: number) => {
    const c = corEm(i)
    return refs.some((r) => {
      const dr = c.r - r.r
      const dg = c.g - r.g
      const db = c.b - r.b
      return dr * dr + dg * dg + db * db <= TOL
    })
  }

  // Semeia a pilha com todos os pixels de borda
  const pilha: number[] = []
  for (let x = 0; x < largura; x++) {
    pilha.push(x, (altura - 1) * largura + x)
  }
  for (let y = 0; y < altura; y++) {
    pilha.push(y * largura, y * largura + largura - 1)
  }

  while (pilha.length > 0) {
    const i = pilha.pop() as number
    if (visitado[i]) continue
    visitado[i] = 1
    if (!ehFundo(i)) continue
    px[i * 4 + 3] = 0 // torna transparente
    const x = i % largura
    const y = (i - x) / largura
    if (x > 0) pilha.push(i - 1)
    if (x < largura - 1) pilha.push(i + 1)
    if (y > 0) pilha.push(i - largura)
    if (y < altura - 1) pilha.push(i + largura)
  }

  ctx.putImageData(dados, 0, 0)
  return canvas.toDataURL('image/png')
}

/** Amostra pixels e extrai a paleta dominante */
function extrairPaletaLocal(imagem: HTMLImageElement, quantidade: number): string[] {
  const canvas = document.createElement('canvas')
  const lado = 90
  canvas.width = lado
  canvas.height = lado
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(imagem, 0, 0, lado, lado)
  const px = ctx.getImageData(0, 0, lado, lado).data
  const pixels: number[] = []
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] > 200) pixels.push(px[i], px[i + 1], px[i + 2])
  }
  return quantizarCores(pixels, quantidade)
}

// ---- Adaptador exportado ----

/** Pequena espera para simular latência e permitir spinner na UI */
const aguardar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const adaptadorLocal: AdaptadorIA = {
  id: 'local',
  nome: 'IA local (offline)',

  async gerarTextos(tipo, assunto, tom) {
    await aguardar(250)
    return gerarTextosSync(tipo, assunto, tom)
  },

  async gerarDesign(descricao) {
    await aguardar(400)
    const titulo = capitalizar(descricao.trim() || 'Seu título aqui')
    const subtitulo = gerarTextosSync('subtitulo', descricao, 'profissional')[0]
    const cta = gerarTextosSync('cta', descricao, 'profissional')[0]
    const paleta = paletaPara(descricao)
    const parFonte = parFontePara(descricao)
    return estilos(paleta, parFonte).map<OpcaoDesignIA>((estilo) => ({
      id: estilo.id,
      nome: estilo.nome,
      corFundo: estilo.corFundo,
      coresPreview: estilo.preview,
      gerarElementos: construirLayout(estilo, titulo, subtitulo, cta),
    }))
  },

  async sugerirEstilo(descricao) {
    await aguardar(200)
    return { parFonte: parFontePara(descricao), paleta: paletaPara(descricao) }
  },

  async removerFundo(imagem) {
    await aguardar(50)
    return removerFundoLocal(imagem)
  },

  async extrairPaleta(imagem, quantidade) {
    await aguardar(50)
    return extrairPaletaLocal(imagem, quantidade)
  },
}
