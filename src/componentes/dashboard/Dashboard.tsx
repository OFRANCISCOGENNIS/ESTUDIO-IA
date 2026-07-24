// =============================================================
// Dashboard — tela inicial: criar design (tamanhos predefinidos
// ou personalizado), buscar e abrir projetos recentes.
// =============================================================

import { useMemo, useState } from 'react'
import { PREDEFINICOES } from '../../dados/predefinicoes'
import { useEditorStore } from '../../estado/useEditorStore'
import { ResumoProjeto, useProjetosStore } from '../../estado/useProjetosStore'
import { tempoRelativo } from '../../utilitarios/tempo'

interface Props {
  temaEscuro: boolean
  aoAlternarTema: () => void
}

export function Dashboard({ temaEscuro, aoAlternarTema }: Props) {
  const resumos = useProjetosStore((s) => s.resumos)
  const criarProjeto = useProjetosStore((s) => s.criarProjeto)
  const carregarProjeto = useProjetosStore((s) => s.carregarProjeto)
  const excluirProjeto = useProjetosStore((s) => s.excluirProjeto)
  const abrirProjeto = useEditorStore((s) => s.abrirProjeto)

  const [busca, setBusca] = useState('')
  const [dialogoPersonalizado, setDialogoPersonalizado] = useState(false)
  const [larguraCustom, setLarguraCustom] = useState('1080')
  const [alturaCustom, setAlturaCustom] = useState('1080')

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return resumos
    return resumos.filter((resumo) => resumo.nome.toLowerCase().includes(termo))
  }, [resumos, busca])

  const criarComTamanho = (nome: string, largura: number, altura: number) => {
    const projeto = criarProjeto(nome, largura, altura)
    abrirProjeto(projeto)
  }

  const abrirExistente = (resumo: ResumoProjeto) => {
    const projeto = carregarProjeto(resumo.id)
    if (projeto) abrirProjeto(projeto)
  }

  const confirmarPersonalizado = () => {
    const largura = Math.min(8000, Math.max(50, Number(larguraCustom) || 1080))
    const altura = Math.min(8000, Math.max(50, Number(alturaCustom) || 1080))
    setDialogoPersonalizado(false)
    criarComTamanho('Design personalizado', largura, altura)
  }

  return (
    <div className="min-h-full bg-superficie-50 dark:bg-superficie-950">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-10 border-b border-superficie-200 bg-white/90 backdrop-blur dark:border-superficie-800 dark:bg-superficie-900/90">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primaria-500 text-lg font-bold text-white">
              D
            </span>
            <h1 className="text-lg font-bold text-superficie-900 dark:text-white">
              DesignStudio <span className="text-primaria-500">Pro</span>
            </h1>
          </div>
          <div className="mx-auto w-full max-w-md">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar seus projetos..."
              className="campo-texto"
              aria-label="Buscar projetos"
            />
          </div>
          <button
            onClick={aoAlternarTema}
            className="botao-icone"
            title={temaEscuro ? 'Tema claro' : 'Tema escuro'}
          >
            {temaEscuro ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Criar design */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-superficie-900 dark:text-white">
              Criar design
            </h2>
            <button
              onClick={() => setDialogoPersonalizado(true)}
              className="botao-secundario"
            >
              ✚ Tamanho personalizado
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {PREDEFINICOES.map((predefinicao) => (
              <button
                key={predefinicao.id}
                onClick={() =>
                  criarComTamanho(
                    predefinicao.nome,
                    predefinicao.largura,
                    predefinicao.altura,
                  )
                }
                className="group flex flex-col items-center gap-2 rounded-xl border border-superficie-200 bg-white p-4 text-center shadow-suave transition hover:-translate-y-0.5 hover:border-primaria-300 hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
              >
                <span className="text-2xl">{predefinicao.icone}</span>
                <span className="text-xs font-semibold text-superficie-900 dark:text-superficie-100">
                  {predefinicao.nome}
                </span>
                <span className="text-[10px] text-superficie-700 dark:text-superficie-200">
                  {predefinicao.largura} × {predefinicao.altura}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Projetos recentes */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-superficie-900 dark:text-white">
            Seus projetos
          </h2>
          {projetosFiltrados.length === 0 ? (
            <div className="rounded-xl border border-dashed border-superficie-200 bg-white p-12 text-center text-sm text-superficie-700 dark:border-superficie-800 dark:bg-superficie-900 dark:text-superficie-200">
              {resumos.length === 0
                ? 'Nenhum projeto ainda. Escolha um tamanho acima para começar! 🎨'
                : 'Nenhum projeto corresponde à busca.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {projetosFiltrados.map((resumo) => (
                <div
                  key={resumo.id}
                  className="group relative overflow-hidden rounded-xl border border-superficie-200 bg-white shadow-suave transition hover:shadow-painel dark:border-superficie-800 dark:bg-superficie-900"
                >
                  <button
                    onClick={() => abrirExistente(resumo)}
                    className="block w-full text-left"
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-superficie-100 dark:bg-superficie-850">
                      {resumo.miniatura ? (
                        <img
                          src={resumo.miniatura}
                          alt={`Miniatura de ${resumo.nome}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl opacity-40">🎨</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-superficie-900 dark:text-superficie-100">
                        {resumo.nome}
                      </p>
                      <p className="text-xs text-superficie-700 dark:text-superficie-200">
                        {resumo.larguraCanvas} × {resumo.alturaCanvas} ·{' '}
                        {tempoRelativo(resumo.atualizadoEm)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${resumo.nome}"? Esta ação não pode ser desfeita.`)) {
                        excluirProjeto(resumo.id)
                      }
                    }}
                    className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-sm shadow-suave hover:bg-red-50 group-hover:flex dark:bg-superficie-800/90 dark:hover:bg-red-900/40"
                    title="Excluir projeto"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Diálogo de tamanho personalizado */}
      {dialogoPersonalizado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDialogoPersonalizado(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-painel dark:bg-superficie-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-superficie-900 dark:text-white">
              Tamanho personalizado
            </h3>
            <div className="mb-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="rotulo-campo" htmlFor="largura-custom">
                  Largura (px)
                </label>
                <input
                  id="largura-custom"
                  type="number"
                  min={50}
                  max={8000}
                  value={larguraCustom}
                  onChange={(e) => setLarguraCustom(e.target.value)}
                  className="campo-texto"
                />
              </div>
              <span className="pb-2 text-superficie-700 dark:text-superficie-200">×</span>
              <div className="flex-1">
                <label className="rotulo-campo" htmlFor="altura-custom">
                  Altura (px)
                </label>
                <input
                  id="altura-custom"
                  type="number"
                  min={50}
                  max={8000}
                  value={alturaCustom}
                  onChange={(e) => setAlturaCustom(e.target.value)}
                  className="campo-texto"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDialogoPersonalizado(false)}
                className="botao-secundario"
              >
                Cancelar
              </button>
              <button onClick={confirmarPersonalizado} className="botao-primario">
                Criar design
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
