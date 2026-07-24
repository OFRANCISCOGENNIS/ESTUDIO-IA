// Hook para carregar imagens (data URL ou remota) com cache em módulo,
// evitando recarregar a mesma imagem a cada re-render do canvas.

import { useEffect, useState } from 'react'

const cache = new Map<string, HTMLImageElement>()

export function useImagem(url: string): HTMLImageElement | null {
  const [imagem, setImagem] = useState<HTMLImageElement | null>(
    () => cache.get(url) ?? null,
  )

  useEffect(() => {
    if (!url) {
      setImagem(null)
      return
    }
    const emCache = cache.get(url)
    if (emCache) {
      setImagem(emCache)
      return
    }
    let ativo = true
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => {
      cache.set(url, el)
      if (ativo) setImagem(el)
    }
    el.src = url
    return () => {
      ativo = false
    }
  }, [url])

  return imagem
}
