// =============================================================
// PainelColab — colaboração: identidade, sessão ao vivo (presença),
// compartilhamento por link com permissões, comentários e histórico
// de versões. A sessão usa BroadcastChannel (abas do mesmo navegador).
// =============================================================

import { useState } from 'react'
import { useEditorStore } from '../../estado/useEditorStore'
import { usePaginaAtiva } from '../../estado/usePaginaAtiva'
import { useColabStore } from '../../estado/useColabStore'
import { useProjetosStore } from '../../estado/useProjetosStore'
import { useVersoesStore } from '../../estado/useVersoesStore'
import { Papel } from '../../nucleo/colab/tipos'
import { tempoRelativo } from '../../utilitarios/tempo'

const PAPEIS: { valor: Papel; nome: string }[] = [
  { valor: 'editor', nome: 'Editar' },
  { valor: 'commenter', nome: 'Comentar' },
  { valor: 'viewer', nome: 'Visualizar' },
]

const classeSecao = 'mb-2 text-xs font-bold uppercase tracking-wide text-superficie-700 dark:text-superficie-300'

export function PainelColab() {
  const projeto = useEditorStore((s) => s.projeto)
  const abrirProjeto = useEditorStore((s) => s.abrirProjeto)
  const resolverComentario = useEditorStore((s) => s.resolverComentario)
  const removerComentario = useEditorStore((s) => s.removerComentario)
  const pagina = usePaginaAtiva()

  const usuario = useColabStore((s) => s.usuario)
  const papel = useColabStore((s) => s.papel)
  const conectado = useColabStore((s) => s.conectado)
  const participantes = useColabStore((s) => s.participantes)
  const modoComentario = useColabStore((s) => s.modoComentario)
  const definirNome = useColabStore((s) => s.definirNome)
  const definirPapel = useColabStore((s) => s.definirPapel)
  const conectar = useColabStore((s) => s.conectar)
  const desconectar = useColabStore((s) => s.desconectar)
  const alternarModoComentario = useColabStore((s) => s.alternarModoComentario)

  const versoes = useVersoesStore((s) => s.versoes)
  const salvarVersao = useVersoesStore((s) => s.salvar)
  const carregarVersoes = useVersoesStore((s) => s.carregar)
  const restaurarVersao = useVersoesStore((s) => s.restaurar)
  const removerVersao = useVersoesStore((s) => s.remover)
  const salvarProjeto = useProjetosStore((s) => s.salvarProjeto)

  const [papelLink, setPapelLink] = useState<Papel>('editor')
  const [copiado, setCopiado] = useState(false)
  const [nomeVersao, setNomeVersao] = useState('')

  if (!projeto || !pagina) return null

  // Carrega versões do projeto atual (uma vez por projeto)
  if (useVersoesStore.getState().projetoId !== projeto.id) carregarVersoes(projeto.id)

  const lista = Object.values(participantes)
  const link = `${location.origin}${location.pathname}#p=${projeto.id}&papel=${papelLink}`

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      // Clipboard bloqueado — o usuário pode copiar do campo
    }
  }

  const restaurar = (id: string) => {
    const p = restaurarVersao(id)
    if (p && confirm('Restaurar esta versão? O estado atual será substituído.')) {
      salvarProjeto(p)
      abrirProjeto(p)
    }
  }

  const comentarios = pagina.comentarios

  return (
    <div className="space-y-6">
      {/* Identidade */}
      <section>
        <h3 className={classeSecao}>Você</h3>
        <div className="flex items-center gap-2">
          <span
            className="h-6 w-6 shrink-0 rounded-full border-2 border-white shadow-suave"
            style={{ backgroundColor: usuario.cor }}
          />
          <input
            value={usuario.nome}
            onChange={(e) => definirNome(e.target.value)}
            className="campo-texto"
            aria-label="Seu nome"
          />
        </div>
      </section>

      {/* Sessão ao vivo */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>Sessão em tempo real</h3>
        {conectado ? (
          <>
            <div className="mb-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Ao vivo
            </div>
            <div className="mb-3 space-y-1">
              <p className="text-xs text-superficie-500">
                {lista.length === 0 ? 'Aguardando participantes…' : `${lista.length} participante(s):`}
              </p>
              {lista.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.cor }} />
                  {p.nome}
                </div>
              ))}
            </div>
            <button onClick={desconectar} className="botao-secundario w-full">
              Encerrar sessão
            </button>
          </>
        ) : (
          <>
            <p className="mb-2 text-xs text-superficie-600 dark:text-superficie-400">
              Inicie e abra o link compartilhado em outra aba para colaborar ao vivo (cursores,
              comentários e edições sincronizados).
            </p>
            <button onClick={() => conectar(projeto.id)} className="botao-primario w-full">
              🟢 Iniciar colaboração
            </button>
          </>
        )}
      </section>

      {/* Compartilhar por link */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>Compartilhar</h3>
        <p className="rotulo-campo">Permissão do link</p>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {PAPEIS.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPapelLink(p.valor)}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                papelLink === p.valor
                  ? 'bg-primaria-500 text-white'
                  : 'bg-superficie-100 text-superficie-700 hover:bg-superficie-200 dark:bg-superficie-800 dark:text-superficie-200'
              }`}
            >
              {p.nome}
            </button>
          ))}
        </div>
        <input readOnly value={link} className="campo-texto mb-2 text-xs" aria-label="Link de compartilhamento" />
        <button onClick={copiarLink} className="botao-secundario w-full">
          {copiado ? '✓ Copiado!' : '🔗 Copiar link'}
        </button>
      </section>

      {/* Seu acesso (simula o papel para testar permissões) */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>Seu acesso</h3>
        <select
          value={papel}
          onChange={(e) => definirPapel(e.target.value as Papel)}
          className="campo-texto"
          aria-label="Seu papel"
        >
          {PAPEIS.map((p) => (
            <option key={p.valor} value={p.valor}>{p.nome}</option>
          ))}
        </select>
        {papel !== 'editor' && (
          <p className="mt-1 text-xs text-superficie-500">
            {papel === 'viewer' ? 'Somente leitura.' : 'Você pode comentar, mas não editar.'}
          </p>
        )}
      </section>

      {/* Comentários */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <div className="mb-2 flex items-center justify-between">
          <h3 className={classeSecao + ' mb-0'}>Comentários</h3>
          {papel !== 'viewer' && (
            <button
              onClick={alternarModoComentario}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                modoComentario ? 'bg-primaria-500 text-white' : 'bg-superficie-100 dark:bg-superficie-800'
              }`}
              title="Clique no canvas para posicionar"
            >
              {modoComentario ? 'Clique no canvas…' : '+ Comentar'}
            </button>
          )}
        </div>
        {comentarios.length === 0 ? (
          <p className="text-xs text-superficie-500">Nenhum comentário nesta página.</p>
        ) : (
          <ul className="space-y-2">
            {comentarios.map((c) => (
              <li
                key={c.id}
                className={`rounded-lg border border-superficie-200 p-2 dark:border-superficie-800 ${c.resolvido ? 'opacity-60' : ''}`}
              >
                <p className="text-xs font-bold" style={{ color: c.cor }}>{c.autor}</p>
                <p className="text-sm text-superficie-800 dark:text-superficie-100">{c.texto}</p>
                <div className="mt-1 flex gap-3">
                  <button onClick={() => resolverComentario(c.id)} className="text-xs text-primaria-600 hover:underline dark:text-primaria-300">
                    {c.resolvido ? 'Reabrir' : 'Resolver'}
                  </button>
                  <button onClick={() => removerComentario(c.id)} className="text-xs text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Histórico de versões */}
      <section className="border-t border-superficie-200 pt-4 dark:border-superficie-800">
        <h3 className={classeSecao}>Histórico de versões</h3>
        <div className="mb-2 flex gap-2">
          <input
            value={nomeVersao}
            onChange={(e) => setNomeVersao(e.target.value)}
            placeholder="Nome da versão"
            className="campo-texto"
          />
          <button
            onClick={() => { salvarVersao(projeto, nomeVersao); setNomeVersao('') }}
            className="botao-primario shrink-0"
          >
            Salvar
          </button>
        </div>
        {versoes.length === 0 ? (
          <p className="text-xs text-superficie-500">Nenhuma versão salva.</p>
        ) : (
          <ul className="space-y-1.5">
            {versoes.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-lg border border-superficie-200 px-2 py-1.5 text-sm dark:border-superficie-800">
                <div className="min-w-0">
                  <p className="truncate font-medium text-superficie-900 dark:text-superficie-100">{v.nome}</p>
                  <p className="text-xs text-superficie-500">{tempoRelativo(v.criadoEm)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => restaurar(v.id)} className="text-xs text-primaria-600 hover:underline dark:text-primaria-300">Restaurar</button>
                  <button onClick={() => removerVersao(v.id)} className="text-xs text-red-600 hover:underline">✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
