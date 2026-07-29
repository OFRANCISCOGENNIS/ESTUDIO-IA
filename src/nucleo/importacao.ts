// =============================================================
// Importação de um projeto a partir de arquivo .json.
//
// Contrapartida do download: o editor oferece baixar o projeto quando
// o armazenamento enche, e sem um caminho de volta esse arquivo seria
// um beco sem saída.
//
// A leitura reaproveita `desserializarProjeto` (que valida e migra
// esquemas antigos) e traduz as falhas para mensagens que dizem o que
// aconteceu e o que fazer. O projeto importado sempre recebe um id
// novo: abrir uma cópia nunca deve sobrescrever o original.
// =============================================================

import { nanoid } from 'nanoid'
import { desserializarProjeto } from './serializacao'
import { Projeto } from '../tipos/projeto'

export type ResultadoImportacao =
  | { ok: true; projeto: Projeto }
  | { ok: false; erro: string }

/** Tamanho acima do qual nem tentamos ler — evita travar a aba. */
const LIMITE_ARQUIVO = 40 * 1024 * 1024

export function importarProjeto(
  texto: string,
  gerarId: () => string = () => nanoid(12),
): ResultadoImportacao {
  if (texto.trim() === '') {
    return { ok: false, erro: 'O arquivo está vazio.' }
  }
  if (texto.length > LIMITE_ARQUIVO) {
    return { ok: false, erro: 'O arquivo é grande demais para ser aberto.' }
  }

  let projeto: Projeto
  try {
    projeto = desserializarProjeto(texto)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : ''
    // A checagem de esquema futuro já explica o que fazer; as demais
    // falhas viram uma mensagem única, porque a causa real (JSON
    // malformado, outro formato) não muda a ação de quem lê.
    if (mensagem.includes('versão mais recente')) {
      return { ok: false, erro: mensagem }
    }
    return { ok: false, erro: 'Este arquivo não é um projeto do DesignStudio.' }
  }

  if (!Array.isArray(projeto.paginas) || projeto.paginas.length === 0) {
    return { ok: false, erro: 'O projeto não tem nenhuma página.' }
  }

  const agora = new Date().toISOString()
  return {
    ok: true,
    projeto: {
      ...projeto,
      id: gerarId(),
      nome: projeto.nome?.trim() || 'Projeto importado',
      atualizadoEm: agora,
    },
  }
}

/** Lê um File do disco como texto, rejeitando com mensagem amigável. */
export function lerArquivoTexto(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onerror = () => rejeitar(new Error('Não foi possível ler o arquivo.'))
    leitor.onload = () => resolver(String(leitor.result ?? ''))
    leitor.readAsText(arquivo)
  })
}
