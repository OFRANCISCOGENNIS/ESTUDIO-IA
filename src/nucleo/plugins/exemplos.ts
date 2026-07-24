// =============================================================
// Plugins de exemplo — demonstram a arquitetura de extensões.
// Importar este módulo registra os plugins (efeito colateral).
// =============================================================

import { registrarPlugin } from './registro'
import { criarForma } from '../elementos'
import { useEditorStore } from '../../estado/useEditorStore'

const CORES_CONFETE = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

registrarPlugin({
  id: 'confete',
  nome: 'Confete',
  icone: '🎉',
  descricao: 'Espalha formas coloridas pelo canvas',
  executar: () => {
    const estado = useEditorStore.getState()
    const projeto = estado.projeto
    if (!projeto) return
    for (let i = 0; i < 14; i++) {
      const tamanho = 20 + Math.random() * 30
      const x = Math.random() * (projeto.larguraCanvas - tamanho)
      const y = Math.random() * (projeto.alturaCanvas - tamanho)
      const tipo = Math.random() > 0.5 ? 'elipse' : 'estrela'
      estado.adicionarElemento(
        criarForma(tipo, x, y, {
          largura: tamanho,
          altura: tamanho,
          preenchimento: CORES_CONFETE[i % CORES_CONFETE.length],
          rotacao: Math.random() * 90,
        }),
        false,
      )
    }
  },
})

registrarPlugin({
  id: 'grade',
  nome: 'Grade de guias',
  icone: '𝍖',
  descricao: 'Insere uma grade de linhas de referência',
  executar: () => {
    const estado = useEditorStore.getState()
    const projeto = estado.projeto
    if (!projeto) return
    const { larguraCanvas: L, alturaCanvas: A } = projeto
    const passos = 4
    for (let i = 1; i < passos; i++) {
      estado.adicionarElemento(
        criarForma('retangulo', (L / passos) * i - 1, 0, {
          nome: 'Guia',
          largura: 2,
          altura: A,
          preenchimento: '#94a3b8',
          opacidade: 0.4,
        }),
        false,
      )
      estado.adicionarElemento(
        criarForma('retangulo', 0, (A / passos) * i - 1, {
          nome: 'Guia',
          largura: L,
          altura: 2,
          preenchimento: '#94a3b8',
          opacidade: 0.4,
        }),
        false,
      )
    }
  },
})
