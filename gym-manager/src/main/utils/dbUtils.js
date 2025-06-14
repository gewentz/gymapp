// Utilitários para operações do banco de dados

export const formatDateForDB = (date) => {
  if (!date) return null
  // Se já é uma string no formato correto, retorna como está
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date
  }
  // Se é um objeto Date, converte para string local
  return new Date(date).toISOString().split('T')[0]
}

export const formatDateFromDB = (dateString) => {
  if (!dateString) return null
  // Cria a data sem conversão de fuso horário
  const [year, month, day] = dateString.split('-')
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

export const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  // Retorna no formato YYYY-MM-DD para inputs do tipo date
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }
  // Se for uma data em outro formato, converte
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

export const calculateAge = (birthDate) => {
  if (!birthDate) return 0

  // Cria as datas sem conversão de fuso horário
  const today = new Date()
  const [year, month, day] = birthDate.split('-')
  const birth = new Date(year, month - 1, day)

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export const getCurrentDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getCurrentDateBrazil = () => {
  // Criar data atual no fuso horário do Brasil
  const now = new Date()
  const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}))

  const year = brazilTime.getFullYear()
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0')
  const day = String(brazilTime.getDate()).padStart(2, '0')

  console.log(`Data atual Brasil: ${day}/${month}/${year}`) // Para debug
  return `${year}-${month}-${day}`
}

export const getDateBrazil = (date = new Date()) => {
  // Converter qualquer data para horário do Brasil
  const brazilTime = new Date(date.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}))
  return brazilTime
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone) => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  return phoneRegex.test(phone)
}

// Utilitários para valores monetários (evitar problemas de ponto flutuante)
export const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export const parseCurrency = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d,.-]/g, '')
    // Substitui vírgula por ponto
    const normalizedValue = cleanValue.replace(',', '.')
    return parseFloat(normalizedValue) || 0
  }
  return 0
}

// Remover ou comentar essas funções que não estão sendo usadas:
/*
export const centavosParaReais = (centavos) => {
  return centavos / 100
}

export const reaisParaCentavos = (reais) => {
  return Math.round(reais * 100)
}
*/

// Função para obter o dia da semana em português
export const getDiaSemanaPortugues = (date = new Date()) => {
  const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  return diasSemana[date.getDay()]
}

// Função para calcular diferença em dias
export const calcularDiferencaDias = (dataFutura, dataAtual = new Date()) => {
  const futuro = new Date(dataFutura + 'T00:00:00')
  const atual = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dataAtual.getDate())

  const diferenca = futuro.getTime() - atual.getTime()
  return Math.ceil(diferenca / (1000 * 3600 * 24))
}

// Função para verificar se uma data está dentro de um intervalo
export const isDataNoIntervalo = (dataVerificar, diasAntes = 0, diasDepois = 7) => {
  const hoje = new Date()
  const dataInicio = new Date(hoje.getTime() - (diasAntes * 24 * 60 * 60 * 1000))
  const dataFim = new Date(hoje.getTime() + (diasDepois * 24 * 60 * 60 * 1000))
  const dataCheck = new Date(dataVerificar + 'T00:00:00')

  return dataCheck >= dataInicio && dataCheck <= dataFim
}

// Função para agrupar dados por período
export const agruparPorPeriodo = (dados, campoData, periodo = 'dia') => {
  const grupos = {}

  dados.forEach(item => {
    const data = new Date(item[campoData] + 'T00:00:00')
    let chave

    switch (periodo) {
      case 'dia':
        chave = data.toISOString().split('T')[0]
        break
      case 'semana':
        const inicioSemana = new Date(data)
        inicioSemana.setDate(data.getDate() - data.getDay())
        chave = inicioSemana.toISOString().split('T')[0]
        break
      case 'mes':
        chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        chave = data.toISOString().split('T')[0]
    }

    if (!grupos[chave]) {
      grupos[chave] = []
    }
    grupos[chave].push(item)
  })

  return grupos
}
