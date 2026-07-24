// Utilitários de tempo (debounce e formatação de datas)

/** Debounce simples: adia a execução até `espera` ms após a última chamada */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  espera: number,
): (...args: A) => void {
  let temporizador: ReturnType<typeof setTimeout> | undefined
  return (...args: A) => {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => fn(...args), espera)
  }
}

/** Formata uma data ISO como texto relativo em português ("há 5 min") */
export function tempoRelativo(iso: string): string {
  const diferencaMs = Date.now() - new Date(iso).getTime()
  const minutos = Math.floor(diferencaMs / 60000)
  if (minutos < 1) return 'agora mesmo'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  return new Date(iso).toLocaleDateString('pt-BR')
}
