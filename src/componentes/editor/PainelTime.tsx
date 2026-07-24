// =============================================================
// PainelTime — workspaces/times com biblioteca de assets compartilhada.
// Cria times, adiciona membros (mock) e assets reutilizáveis, e insere
// assets no canvas com um clique.
// =============================================================

import { useState, type ChangeEvent } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { useWorkspaceStore } from '../../estado/useWorkspaceStore'
import { criarImagem } from '../../nucleo/elementos'
import { carregarArquivoImagem } from '../../utilitarios/imagem'

const classeSecao = 'mb-2 text-xs font-bold uppercase tracking-wide text-superficie-700 dark:text-superficie-300'

export function PainelTime() {
  const projeto = useEditorStore((s) => s.projeto)
  const adicionarElemento = useEditorStore((s) => s.adicionarElemento)

  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const criar = useWorkspaceStore((s) => s.criar)
  const remover = useWorkspaceStore((s) => s.remover)
  const adicionarMembro = useWorkspaceStore((s) => s.adicionarMembro)
  const adicionarAsset = useWorkspaceStore((s) => s.adicionarAsset)
  const removerAsset = useWorkspaceStore((s) => s.removerAsset)

  const [nomeNovo, setNomeNovo] = useState('')
  const [nomeMembro, setNomeMembro] = useState('')
  const [ativoId, setAtivoId] = useState<string | null>(workspaces[0]?.id ?? null)

  if (!projeto) return null
  const ws = workspaces.find((w) => w.id === ativoId) ?? workspaces[0] ?? null

  const enviarAsset = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !ws) return
    try {
      const img = await carregarArquivoImagem(arquivo)
      adicionarAsset(ws.id, { nome: arquivo.name, url: img.url, proporcao: img.largura / img.altura })
    } catch (erro) {
      console.error('Falha ao enviar asset', erro)
    }
    e.target.value = ''
  }

  const inserirAsset = (url: string, proporcao: number) => {
    const largura = 300
    const altura = largura / (proporcao || 1)
    adicionarElemento(
      criarImagem(url, projeto.larguraCanvas / 2 - largura / 2, projeto.alturaCanvas / 2 - altura / 2, largura, altura),
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className={classeSecao}>🏢 Time / Workspace</h3>
        <div className="flex gap-2">
          <input
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Nome do time"
            className="campo-texto"
          />
          <button
            onClick={() => { const w = criar(nomeNovo); setAtivoId(w.id); setNomeNovo('') }}
            className="botao-primario shrink-0"
          >
            Criar
          </button>
        </div>
      </div>

      {workspaces.length > 1 && (
        <select value={ws?.id ?? ''} onChange={(e) => setAtivoId(e.target.value)} className="campo-texto" aria-label="Selecionar time">
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>{w.nome}</option>
          ))}
        </select>
      )}

      {!ws ? (
        <p className="text-sm text-superficie-600 dark:text-superficie-400">Crie um time para compartilhar assets.</p>
      ) : (
        <>
          {/* Membros */}
          <section>
            <h4 className={classeSecao}>Membros ({ws.membros.length})</h4>
            <div className="mb-2 flex flex-wrap gap-2">
              {ws.membros.map((m, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-superficie-100 px-2 py-1 text-xs dark:bg-superficie-800">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.cor }} />
                  {m.nome}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={nomeMembro}
                onChange={(e) => setNomeMembro(e.target.value)}
                placeholder="Convidar por nome"
                className="campo-texto"
              />
              <button
                onClick={() => { adicionarMembro(ws.id, nomeMembro); setNomeMembro('') }}
                className="botao-secundario shrink-0"
              >
                Convidar
              </button>
            </div>
          </section>

          {/* Biblioteca de assets */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h4 className={classeSecao + ' mb-0'}>Assets compartilhados</h4>
              <label className="cursor-pointer text-xs font-medium text-primaria-600 dark:text-primaria-300">
                + Enviar
                <input type="file" accept="image/*" hidden onChange={enviarAsset} />
              </label>
            </div>
            {ws.assets.length === 0 ? (
              <p className="text-xs text-superficie-500">Nenhum asset ainda.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {ws.assets.map((a) => (
                  <div key={a.id} className="group relative">
                    <button
                      onClick={() => inserirAsset(a.url, a.proporcao)}
                      className="flex aspect-square w-full items-center justify-center rounded-lg border border-superficie-200 bg-white p-1 transition hover:border-primaria-300 dark:border-superficie-800 dark:bg-superficie-900"
                      title={`Inserir ${a.nome}`}
                    >
                      <img src={a.url} alt={a.nome} className="max-h-full max-w-full object-contain" />
                    </button>
                    <button
                      onClick={() => removerAsset(ws.id, a.id)}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.6rem] text-white group-hover:flex"
                      title="Remover asset"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            onClick={() => { if (confirm(`Remover o time "${ws.nome}"?`)) { remover(ws.id); setAtivoId(null) } }}
            className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
          >
            Remover time
          </button>
        </>
      )}
    </div>
  )
}
