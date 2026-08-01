// =============================================================
// Fábrica de elementos — cria elementos novos com padrões sensatos.
// Centraliza a criação para manter consistência entre ferramentas,
// templates e colagem.
// =============================================================

import { nanoid } from 'nanoid'
import {
  AJUSTES_NEUTROS,
  ANIMACAO_PADRAO,
  Elemento,
  ElementoCaminho,
  ElementoForma,
  ElementoGrafico,
  ElementoImagem,
  ElementoLinha,
  ElementoTabela,
  ElementoTexto,
} from '../tipos/projeto'

let contadorNomes: Record<string, number> = {}

/** Reinicia o contador de nomes (usado ao trocar de projeto) */
export function reiniciarContadorNomes(): void {
  contadorNomes = {}
}

/** Snapshot do contador de nomes (para restaurar após gerações efêmeras) */
export function instantaneoContadorNomes(): Record<string, number> {
  return { ...contadorNomes }
}

/** Restaura o contador de nomes a partir de um snapshot */
export function restaurarContadorNomes(snap: Record<string, number>): void {
  contadorNomes = { ...snap }
}

function proximoNome(prefixo: string): string {
  contadorNomes[prefixo] = (contadorNomes[prefixo] ?? 0) + 1
  return `${prefixo} ${contadorNomes[prefixo]}`
}

const basePadrao = () => ({
  id: nanoid(10),
  rotacao: 0,
  opacidade: 1,
  visivel: true,
  bloqueado: false,
  mistura: 'normal' as const,
  animacao: { ...ANIMACAO_PADRAO },
})

export function criarForma(
  tipo: ElementoForma['tipo'],
  x: number,
  y: number,
  extras: Partial<ElementoForma> = {},
): ElementoForma {
  const nomes: Record<ElementoForma['tipo'], string> = {
    retangulo: 'Retângulo',
    elipse: 'Elipse',
    triangulo: 'Triângulo',
    estrela: 'Estrela',
  }
  return {
    ...basePadrao(),
    tipo,
    nome: proximoNome(nomes[tipo]),
    x,
    y,
    largura: 200,
    altura: tipo === 'estrela' ? 200 : 150,
    preenchimento: '#7c4dff',
    corBorda: '#00000000',
    espessuraBorda: 0,
    raioCanto: 0,
    pontas: 5,
    ...extras,
  }
}

export function criarTexto(
  x: number,
  y: number,
  extras: Partial<ElementoTexto> = {},
): ElementoTexto {
  return {
    ...basePadrao(),
    tipo: 'texto',
    nome: proximoNome('Texto'),
    x,
    y,
    texto: 'Clique duas vezes para editar',
    fonte: 'Inter',
    tamanhoFonte: 40,
    negrito: false,
    italico: false,
    sublinhado: false,
    cor: '#1f2937',
    alinhamento: 'left',
    largura: 480,
    alturaLinha: 1.2,
    espacamentoLetras: 0,
    efeito: 'nenhum',
    textura: 'nenhuma',
    ...extras,
  }
}

export function criarImagem(
  url: string,
  x: number,
  y: number,
  largura: number,
  altura: number,
  extras: Partial<ElementoImagem> = {},
): ElementoImagem {
  return {
    ...basePadrao(),
    tipo: 'imagem',
    nome: proximoNome('Imagem'),
    x,
    y,
    url,
    largura,
    altura,
    raioCanto: 0,
    ajustes: { ...AJUSTES_NEUTROS },
    filtro: 'nenhum',
    intensidadeFiltro: 1,
    mascara: 'nenhuma',
    // Imagem nova já nasce preenchendo: no momento da inserção o quadro
    // tem a proporção da foto, então nada muda na tela — a diferença
    // aparece quando alguém arrasta uma alça lateral, e aí ela recorta
    // em vez de achatar.
    enquadramento: 'preencher',
    foco: { x: 0.5, y: 0.5 },
    zoom: 1,
    proporcaoFonte: altura > 0 ? largura / altura : 0,
    ...extras,
  }
}

export function criarLinha(
  x: number,
  y: number,
  extras: Partial<ElementoLinha> = {},
): ElementoLinha {
  return {
    ...basePadrao(),
    tipo: 'linha',
    nome: proximoNome('Linha'),
    x,
    y,
    pontos: [0, 0, 240, 0],
    cor: '#1f2937',
    espessura: 4,
    tracejada: false,
    ...extras,
  }
}

export function criarCaminho(
  x: number,
  y: number,
  pontos: number[],
  extras: Partial<ElementoCaminho> = {},
): ElementoCaminho {
  return {
    ...basePadrao(),
    tipo: 'caminho',
    nome: proximoNome('Caminho'),
    x,
    y,
    pontos,
    fechado: false,
    tensao: 0.5,
    preenchimento: 'transparent',
    corBorda: '#7c4dff',
    espessuraBorda: 4,
    ...extras,
  }
}

export function criarGrafico(
  x: number,
  y: number,
  extras: Partial<ElementoGrafico> = {},
): ElementoGrafico {
  return {
    ...basePadrao(),
    tipo: 'grafico',
    nome: proximoNome('Gráfico'),
    x,
    y,
    tipoGrafico: 'barras',
    dados: [
      { rotulo: 'Jan', valor: 40 },
      { rotulo: 'Fev', valor: 65 },
      { rotulo: 'Mar', valor: 50 },
      { rotulo: 'Abr', valor: 80 },
    ],
    cores: ['#7c4dff', '#ec4899', '#22d3ee', '#facc15', '#22c55e', '#f97316'],
    largura: 480,
    altura: 320,
    mostrarValores: true,
    corTexto: '#1f2937',
    ...extras,
  }
}

export function criarTabela(
  x: number,
  y: number,
  extras: Partial<ElementoTabela> = {},
): ElementoTabela {
  return {
    ...basePadrao(),
    tipo: 'tabela',
    nome: proximoNome('Tabela'),
    x,
    y,
    celulas: [
      ['Produto', 'Preço', 'Estoque'],
      ['Camiseta', 'R$ 49', '120'],
      ['Boné', 'R$ 29', '80'],
    ],
    largura: 520,
    altura: 180,
    corCabecalho: '#7c4dff',
    corCabecalhoTexto: '#ffffff',
    corTexto: '#1f2937',
    corLinha: '#e5e7eb',
    ...extras,
  }
}

/**
 * Clona uma seleção inteira preservando os grupos que existem DENTRO
 * dela: duas cópias que estavam juntas continuam juntas, mas num grupo
 * novo — antes entravam no grupo original, e mover o original passava
 * a arrastar as cópias junto.
 *
 * Copiar um elemento solto de um grupo tira o vínculo: grupo de um não
 * é grupo.
 */
export function clonarElementos(elementos: Elemento[], deslocamento = 16): Elemento[] {
  const porGrupo = new Map<string, number>()
  for (const el of elementos) {
    if (el.grupoId) porGrupo.set(el.grupoId, (porGrupo.get(el.grupoId) ?? 0) + 1)
  }
  const renomeados = new Map<string, string>()
  for (const [id, quantos] of porGrupo) {
    if (quantos >= 2) renomeados.set(id, nanoid(8))
  }

  return elementos.map((el) => ({
    ...clonarElemento(el, deslocamento),
    grupoId: el.grupoId ? renomeados.get(el.grupoId) : undefined,
  }))
}

/** Clona um elemento com novo id e deslocamento. Para duplicar uma
 *  seleção use `clonarElementos`, que também acerta os grupos. */
export function clonarElemento(elemento: Elemento, deslocamento = 16): Elemento {
  return {
    ...structuredClone(elemento),
    id: nanoid(10),
    x: elemento.x + deslocamento,
    y: elemento.y + deslocamento,
    nome: `${elemento.nome} (cópia)`,
  }
}
