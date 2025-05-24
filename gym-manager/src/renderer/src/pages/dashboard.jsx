import { useState, useEffect } from 'react'

function Dashboard() {
  // Dados mockados - em uma aplicação real, viriam de uma API
  const [dadosDashboard, setDadosDashboard] = useState({
    contasVencer: [
      {
        id: 1,
        descricao: 'Aluguel da Academia',
        valor: 3500.0,
        dataVencimento: '2025-05-24', // Hoje (ajuste conforme necessário)
        tipo: 'despesa',
        status: 'pendente'
      },
      {
        id: 2,
        descricao: 'Energia Elétrica',
        valor: 450.0,
        dataVencimento: '2024-12-22',
        tipo: 'despesa',
        status: 'pendente'
      },
      {
        id: 3,
        descricao: 'Internet',
        valor: 120.0,
        dataVencimento: '2024-12-25',
        tipo: 'despesa',
        status: 'pendente'
      },
      {
        id: 4,
        descricao: 'Equipamentos - Financiamento',
        valor: 850.0,
        dataVencimento: '2024-12-28',
        tipo: 'despesa',
        status: 'pendente'
      }
    ],
    mensalidadesReceber: [
      {
        id: 1,
        aluno: 'João Silva',
        valor: 150.0,
        dataVencimento: '2024-12-17', // Hoje (ajuste conforme necessário)
        status: 'pendente'
      },
      {
        id: 2,
        aluno: 'Maria Santos',
        valor: 150.0,
        dataVencimento: '2025-05-27',
        status: 'pendente'
      },
      {
        id: 3,
        aluno: 'Pedro Oliveira',
        valor: 180.0,
        dataVencimento: '2025-05-29',
        status: 'pendente'
      },
      {
        id: 4,
        aluno: 'Ana Costa',
        valor: 150.0,
        dataVencimento: '2025-05-25',
        status: 'pendente'
      },
      {
        id: 5,
        aluno: 'Carlos Ferreira',
        valor: 150.0,
        dataVencimento: '2024-12-22',
        status: 'pendente'
      }
    ],
    alunos: [
      {
        id: 1,
        nome: 'João Silva',
        diasTreino: ['segunda', 'quarta', 'sexta'],
        horariosTreino: [
          { dia: 'segunda', horario: '08:00' },
          { dia: 'quarta', horario: '08:00' },
          { dia: 'sexta', horario: '08:00' }
        ],
        status: 'Ativo'
      },
      {
        id: 2,
        nome: 'Maria Santos',
        diasTreino: ['terca', 'quinta'],
        horariosTreino: [
          { dia: 'terca', horario: '09:00' },
          { dia: 'quinta', horario: '09:00' }
        ],
        status: 'Ativo'
      },
      {
        id: 3,
        nome: 'Pedro Oliveira',
        diasTreino: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
        horariosTreino: [
          { dia: 'segunda', horario: '10:00' },
          { dia: 'terca', horario: '10:00' },
          { dia: 'quarta', horario: '10:00' },
          { dia: 'quinta', horario: '10:00' },
          { dia: 'sexta', horario: '10:00' }
        ],
        status: 'Ativo'
      },
      {
        id: 4,
        nome: 'Ana Costa',
        diasTreino: ['segunda', 'quarta', 'sexta', 'sabado'],
        horariosTreino: [
          { dia: 'segunda', horario: '14:00' },
          { dia: 'quarta', horario: '14:00' },
          { dia: 'sexta', horario: '14:00' },
          { dia: 'sabado', horario: '14:00' }
        ],
        status: 'Ativo'
      },
      {
        id: 5,
        nome: 'Carlos Ferreira',
        diasTreino: ['terca', 'quinta', 'sabado'],
        horariosTreino: [
          { dia: 'terca', horario: '16:00' },
          { dia: 'quinta', horario: '16:00' },
          { dia: 'sabado', horario: '16:00' }
        ],
        status: 'Ativo'
      },
      {
        id: 6,
        nome: 'Lucia Mendes',
        diasTreino: ['segunda', 'quarta', 'sexta', 'domingo'],
        horariosTreino: [
          { dia: 'segunda', horario: '18:00' },
          { dia: 'quarta', horario: '18:00' },
          { dia: 'sexta', horario: '18:00' },
          { dia: 'domingo', horario: '18:00' }
        ],
        status: 'Ativo'
      }
    ]
  })

  // Funções auxiliares
  const hoje = new Date()
  const diaSemanaAtual = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][
    hoje.getDay()
  ]

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (dataString) => {
    return new Date(dataString).toLocaleDateString('pt-BR')
  }

  const calcularDiasRestantes = (dataVencimento) => {
    const vencimento = new Date(dataVencimento)
    const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const vencimentoData = new Date(
      vencimento.getFullYear(),
      vencimento.getMonth(),
      vencimento.getDate()
    )

    const diferenca = vencimentoData.getTime() - hojeData.getTime()
    return Math.ceil(diferenca / (1000 * 3600 * 24))
  }

  // Função para verificar se é hoje
  const isHoje = (dataVencimento) => {
    return calcularDiasRestantes(dataVencimento) === 0
  }

  // Função para obter texto de vencimento
  const getTextoVencimento = (dataVencimento) => {
    const dias = calcularDiasRestantes(dataVencimento)

    if (dias === 0) return 'Vence HOJE'
    if (dias === 1) return 'Vence amanhã'
    if (dias === -1) return 'Venceu ontem'
    if (dias < 0) return `Venceu há ${Math.abs(dias)} dia(s)`
    return `Vence em ${dias} dia(s)`
  }

  // Função para obter classe de status baseada nos dias
  const getStatusClass = (dataVencimento, tipo = 'conta') => {
    const dias = calcularDiasRestantes(dataVencimento)

    if (dias === 0) {
      return tipo === 'conta'
        ? 'bg-red-700 text-white animate-pulse'
        : 'bg-orange-600 text-white animate-pulse'
    }
    if (dias < 0) return 'bg-red-800 text-white'
    if (dias <= 1) return tipo === 'conta' ? 'bg-red-600 text-white' : 'bg-red-600 text-white'
    if (dias <= 3) return 'bg-yellow-600 text-white'
    if (dias <= 7) return tipo === 'conta' ? 'bg-gray-600 text-gray-300' : 'bg-green-600 text-white'
    return 'bg-gray-600 text-gray-300'
  }

  // Função para obter texto do badge
  const getTextoBadge = (dataVencimento) => {
    const dias = calcularDiasRestantes(dataVencimento)

    if (dias === 0) return 'VENCE HOJE'
    if (dias < 0) return 'VENCIDO'
    if (dias <= 1) return 'URGENTE'
    if (dias <= 3) return 'ATENÇÃO'
    return 'NORMAL'
  }

  // Filtrar contas a vencer nos próximos 15 dias
  const contasVencerProximos15Dias = dadosDashboard.contasVencer
    .filter((conta) => {
      const diasRestantes = calcularDiasRestantes(conta.dataVencimento)
      return diasRestantes >= -1 && diasRestantes <= 15 // Incluir vencidas de ontem
    })
    .sort(
      (a, b) => calcularDiasRestantes(a.dataVencimento) - calcularDiasRestantes(b.dataVencimento)
    )

  // Filtrar mensalidades a receber nos próximos 7 dias
  const mensalidadesProximos7Dias = dadosDashboard.mensalidadesReceber
    .filter((mensalidade) => {
      const diasRestantes = calcularDiasRestantes(mensalidade.dataVencimento)
      return diasRestantes >= -1 && diasRestantes <= 7 // Incluir vencidas de ontem
    })
    .sort(
      (a, b) => calcularDiasRestantes(a.dataVencimento) - calcularDiasRestantes(b.dataVencimento)
    )

  // Calcular total de aulas da semana atual
  const calcularAulasSemana = () => {
    let totalAulas = 0
    dadosDashboard.alunos.forEach((aluno) => {
      if (aluno.status === 'Ativo') {
        totalAulas += aluno.diasTreino.length
      }
    })
    return totalAulas
  }

  // Obter treinos do dia atual
  const treinosDoDia = dadosDashboard.alunos
    .filter((aluno) => aluno.status === 'Ativo' && aluno.diasTreino.includes(diaSemanaAtual))
    .map((aluno) => ({
      ...aluno,
      horarioHoje:
        aluno.horariosTreino.find((h) => h.dia === diaSemanaAtual)?.horario || 'Não definido'
    }))
    .sort((a, b) => a.horarioHoje.localeCompare(b.horarioHoje))

  const totalContasVencer = contasVencerProximos15Dias.reduce(
    (total, conta) => total + conta.valor,
    0
  )
  const totalMensalidadesReceber = mensalidadesProximos7Dias.reduce(
    (total, mensalidade) => total + mensalidade.valor,
    0
  )

  return (
    <div className="h-screen w-full p-6 text-gray-200 overflow-x-auto">
      <div className="mb-6">
        <h1 className="text-4xl font-bold opacity-35 mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Bem-vindo! Hoje é{' '}
          {hoje.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* Card - Contas a Vencer */}
        <div className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-red-400">Contas a Vencer</h3>
            <span className="text-2xl">💳</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatarMoeda(totalContasVencer)}
          </div>
          <p className="text-sm text-red-300">
            {contasVencerProximos15Dias.length} conta(s) nos próximos 15 dias
          </p>
          {contasVencerProximos15Dias.some((conta) => isHoje(conta.dataVencimento)) && (
            <div className="mt-2 text-xs bg-red-700 text-white px-2 py-1 rounded animate-pulse">
              ⚠️ Há contas vencendo HOJE!
            </div>
          )}
        </div>

        {/* Card - Mensalidades a Receber */}
        <div className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-green-400">A Receber</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatarMoeda(totalMensalidadesReceber)}
          </div>
          <p className="text-sm text-green-300">
            {mensalidadesProximos7Dias.length} mensalidade(s) nos próximos 7 dias
          </p>
          {mensalidadesProximos7Dias.some((mensalidade) => isHoje(mensalidade.dataVencimento)) && (
            <div className="mt-2 text-xs bg-orange-600 text-white px-2 py-1 rounded animate-pulse">
              💰 Há mensalidades vencendo HOJE!
            </div>
          )}
        </div>

        {/* Card - Total de Aulas da Semana */}
        <div className="bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-400">Aulas da Semana</h3>
            <span className="text-2xl">📅</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{calcularAulasSemana()}</div>
          <p className="text-sm text-blue-300">Total de aulas agendadas</p>
        </div>

        {/* Card - Treinos Hoje */}
        <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-yellow-400">Treinos Hoje</h3>
            <span className="text-2xl">🏋️</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{treinosDoDia.length}</div>
          <p className="text-sm text-yellow-300">Alunos agendados para hoje</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Seção - Contas a Vencer */}
        <div className="bg-stone-700 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-red-400">💳 Contas a Vencer (15 dias)</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {contasVencerProximos15Dias.length > 0 ? (
              contasVencerProximos15Dias.map((conta) => {
                const diasRestantes = calcularDiasRestantes(conta.dataVencimento)
                const eHoje = isHoje(conta.dataVencimento)

                return (
                  <div
                    key={conta.id}
                    className={`bg-stone-600 rounded p-3 border-l-4 ${
                      eHoje ? 'border-red-400 bg-red-900 bg-opacity-30' : 'border-red-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{conta.descricao}</h4>
                        <p
                          className={`text-sm ${eHoje ? 'text-red-300 font-medium' : 'text-gray-300'}`}
                        >
                          {getTextoVencimento(conta.dataVencimento)} -{' '}
                          {formatarData(conta.dataVencimento)}
                          {eHoje && <span className="ml-2">🚨</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-400">{formatarMoeda(conta.valor)}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusClass(conta.dataVencimento, 'conta')}`}
                        >
                          {getTextoBadge(conta.dataVencimento)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-400 text-center py-4">
                Nenhuma conta a vencer nos próximos 15 dias
              </p>
            )}
          </div>
        </div>

        {/* Seção - Mensalidades a Receber */}
        <div className="bg-stone-700 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-green-400">
            💰 Mensalidades a Receber (7 dias)
          </h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {mensalidadesProximos7Dias.length > 0 ? (
              mensalidadesProximos7Dias.map((mensalidade) => {
                const diasRestantes = calcularDiasRestantes(mensalidade.dataVencimento)
                const eHoje = isHoje(mensalidade.dataVencimento)

                return (
                  <div
                    key={mensalidade.id}
                    className={`bg-stone-600 rounded p-3 border-l-4 ${
                      eHoje ? 'border-orange-400 bg-orange-900 bg-opacity-30' : 'border-green-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{mensalidade.aluno}</h4>
                        <p
                          className={`text-sm ${eHoje ? 'text-orange-300 font-medium' : 'text-gray-300'}`}
                        >
                          {getTextoVencimento(mensalidade.dataVencimento)} -{' '}
                          {formatarData(mensalidade.dataVencimento)}
                          {eHoje && <span className="ml-2">💰</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">
                          {formatarMoeda(mensalidade.valor)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusClass(mensalidade.dataVencimento, 'mensalidade')}`}
                        >
                          {eHoje ? 'VENCE HOJE' : getTextoBadge(mensalidade.dataVencimento)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-400 text-center py-4">
                Nenhuma mensalidade a receber nos próximos 7 dias
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Seção - Treinos do Dia */}
      <div className="mt-6">
        <div className="bg-stone-700 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">
            🏋️ Treinos de Hoje ({diaSemanaAtual.charAt(0).toUpperCase() + diaSemanaAtual.slice(1)})
          </h2>

          {treinosDoDia.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {treinosDoDia.map((aluno) => (
                <div key={aluno.id} className="bg-stone-600 rounded-lg p-3 border border-stone-500">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white truncate">{aluno.nome}</h4>
                    <span className="text-xs bg-lime-600 text-white px-2 py-1 rounded">Ativo</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Horário:</span>
                      <span className="text-sm font-bold text-lime-400">{aluno.horarioHoje}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Treinos/semana:</span>
                      <span className="text-sm text-gray-300">{aluno.diasTreino.length}x</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-500">
                    <div className="flex gap-1">
                      {aluno.diasTreino.map((dia) => {
                        const diasAbrev = {
                          segunda: 'S',
                          terca: 'T',
                          quarta: 'Q',
                          quinta: 'Q',
                          sexta: 'S',
                          sabado: 'S',
                          domingo: 'D'
                        }
                        const isHoje = dia === diaSemanaAtual

                        return (
                          <span
                            key={dia}
                            className={`w-6 h-6 text-xs rounded-full flex items-center justify-center font-medium ${
                              isHoje ? 'bg-yellow-500 text-black' : 'bg-stone-500 text-white'
                            }`}
                            title={dia}
                          >
                            {diasAbrev[dia]}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-6xl mb-4 block">😴</span>
              <p className="text-gray-400 text-lg">Nenhum treino agendado para hoje</p>
              <p className="text-gray-500 text-sm mt-2">
                Aproveite para descansar ou planejar as próximas aulas!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seção - Resumo Semanal */}
      <div className="mt-6">
        <div className="bg-stone-700 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-blue-400">📊 Resumo da Semana</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map((dia) => {
              const treinosDia = dadosDashboard.alunos.filter(
                (aluno) => aluno.status === 'Ativo' && aluno.diasTreino.includes(dia)
              ).length

              const isHoje = dia === diaSemanaAtual
              const diaNome = {
                segunda: 'Seg',
                terca: 'Ter',
                quarta: 'Qua',
                quinta: 'Qui',
                sexta: 'Sex',
                sabado: 'Sáb',
                domingo: 'Dom'
              }

              return (
                <div
                  key={dia}
                  className={`text-center p-3 rounded-lg border-2 ${
                    isHoje
                      ? 'border-yellow-500 bg-yellow-600 bg-opacity-20'
                      : 'border-stone-500 bg-stone-600'
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isHoje ? 'text-stone-800' : 'text-gray-300'
                    }`}
                  >
                    {diaNome[dia]}
                  </div>
                  <div className={`text-2xl font-bold ${isHoje ? 'text-stone-800' : 'text-white'}`}>
                    {treinosDia}
                  </div>
                  <div className={`text-xs ${isHoje ? 'text-stone-800' : 'text-gray-400'}`}>
                    {treinosDia === 1 ? 'treino' : 'treinos'}
                  </div>
                  {isHoje && <div className="text-xs text-stone-800 font-medium mt-1">HOJE</div>}
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-600 rounded p-3 text-center">
              <div className="text-lg font-bold text-white">{calcularAulasSemana()}</div>
              <div className="text-sm text-gray-300">Total de Aulas</div>
            </div>

            <div className="bg-stone-600 rounded p-3 text-center">
              <div className="text-lg font-bold text-white">
                {dadosDashboard.alunos.filter((a) => a.status === 'Ativo').length}
              </div>
              <div className="text-sm text-gray-300">Alunos Ativos</div>
            </div>

            <div className="bg-stone-600 rounded p-3 text-center">
              <div className="text-lg font-bold text-white">
                {Math.round(
                  (calcularAulasSemana() /
                    dadosDashboard.alunos.filter((a) => a.status === 'Ativo').length) *
                    10
                ) / 10}
              </div>
              <div className="text-sm text-gray-300">Média Aulas/Aluno</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
