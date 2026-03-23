export const formatarMoeda = (valor?: number): string => {
  if (valor === undefined || valor === null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export const formatarPercentual = (valor?: number): string => {
  if (valor === undefined || valor === null) return '—'
  const sinal = valor >= 0 ? '+' : ''
  return `${sinal}${valor.toFixed(2)}%`
}

export const formatarData = (data?: string): string => {
  if (!data) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

export const classeVariacao = (valor?: number): string => {
  if (valor === undefined || valor === null) return 'text-gray-500'
  return valor >= 0 ? 'text-green-500' : 'text-red-500'
}