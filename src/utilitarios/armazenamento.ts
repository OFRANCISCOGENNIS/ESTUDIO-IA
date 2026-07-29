// =============================================================
// Acesso ao localStorage que nunca derruba a interface.
//
// `setItem` lança QuotaExceededError quando o armazenamento enche, e
// também falha quando o navegador bloqueia armazenamento de terceiros
// ou está em modo restrito. Uma preferência de tema que não coube não
// é motivo para a tela inteira cair — quem chama decide o que fazer
// com o `false`, e a maioria dos casos pode simplesmente seguir.
//
// Quem precisa avisar o usuário (o auto-save de projetos) trata a
// falha explicitamente; os demais só não querem quebrar.
// =============================================================

/** Grava e devolve se conseguiu. Nunca lança. */
export function gravarLocal(chave: string, valor: string): boolean {
  try {
    localStorage.setItem(chave, valor)
    return true
  } catch (erro) {
    console.warn(`Não foi possível guardar "${chave}" neste dispositivo`, erro)
    return false
  }
}

/** Lê uma chave. Devolve null se não existir ou o acesso falhar. */
export function lerLocal(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

/** Remove uma chave, ignorando falhas de acesso. */
export function removerLocal(chave: string): void {
  try {
    localStorage.removeItem(chave)
  } catch {
    /* nada a fazer — a chave segue lá, mas a interface não cai */
  }
}
