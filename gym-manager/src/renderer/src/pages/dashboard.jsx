import { useState, useEffect } from 'react'
import AlertModal from '../components/Alert'

function Dashboard() {
  const [alert, setAlert] = useState({ open: false, message: '', title: '' })
  const [dadosDashboard, setDadosDashboard] = useState({
    contasVencer: [],
    mensalidadesReceber: [],
    alunos: [],
    totalContasVencer: 0,
    totalMensalidadesReceber: 0,
    totalAlunos: 0
  })
  const [treinosDoDia, setTreinosDoDia] = useState([])
  const [estatisticasSemana, setEstatisticasSemana] = useState({
    estatisticasPorDia: {},
    totalAulasSemana: 0,
    totalAlunosAtivos: 0,
    mediaAulasPorAluno: 0
  })
  const [loading, setLoading] = useState(true)

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const hoje = new Date()
      const diaSemanaAtual = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][
        hoje.getDay()
      ]

      // Carregar dados em paralelo
      const [dashboardData, treinosHoje, estatisticas] = await Promise.all([
        window.api.dashboard.getData(),
        window.api.dashboard.getTreinosDoDia(diaSemanaAtual),
        window.api.dashboard.getEstatisticasSemana()
      ])

      setDadosDashboard(dashboardData)
      setTreinosDoDia(treinosHoje)
      setEstatisticasSemana(estatisticas)
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      setAlert({
        open: true,
        title: 'Erro ao carregar dados do dashboard',
        message: 'Ocorreu um erro ao carregar os dados do dashboard. Por favor, tente novamente mais tarde.'
      })
    } finally {
      setLoading(false)
    }
  }

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
    return new Date(dataString + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const calcularDiasRestantes = (dataVencimento) => {
    const vencimento = new Date(dataVencimento + 'T00:00:00')
    const hojeData = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

    const diferenca = vencimento.getTime() - hojeData.getTime()
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
    if (dias <= 3) return tipo === 'conta' ? 'bg-yellow-600 text-white' : 'bg-yellow-600 text-white'
    if (dias <= 7) return tipo === 'conta' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
    return 'bg-green-600 text-white'
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

  const totalContasVencer = contasVencerProximos15Dias.reduce(
    (total, conta) => total + conta.valor,
    0
  )
  const totalMensalidadesReceber = mensalidadesProximos7Dias.reduce(
    (total, mensalidade) => total + mensalidade.valor,
    0
  )

  const handleBackup = async () => {
    try {
      await window.api.utils.backupDatabase()
      setAlert({
        open: true,
        title: 'Backup realizado com sucesso',
        message: 'O backup do banco de dados foi realizado com sucesso!'
      })
    } catch (error) {
      console.error('Erro ao fazer backup:', error)
      setAlert({
        open: true,
        title: 'Erro ao fazer backup',
        message: 'Ocorreu um erro ao fazer o backup do banco de dados. Por favor, tente novamente mais tarde.'
      })
    }
  }

  const handleImport = async () => {
    try {
      const result = await window.api.utils.importDatabase()
      if (result === true) {
        setAlert({
          open: true,
          title: 'Importação concluída',
          message: 'O banco de dados foi importado com sucesso! Por favor, atualize a página.'
        })
        loadDashboardData() // Recarregar os dados após a importação
      } else if (result === false) {
        setAlert({
          open: true,
          title: 'Importação cancelada',
          message: 'A importação do banco de dados foi cancelada pelo usuário.'
        })
      }
    } catch (error) {
      console.error('Erro ao importar banco:', error)
      setAlert({
        open: true,
        title: 'Erro ao importar banco',
        message: 'Ocorreu um erro ao importar o banco de dados. Por favor, tente novamente mais tarde.'
      })
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full p-6 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-lg">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold opacity-35">Dashboard</h1>
        <div className="text-right">
          <p className="text-lg font-semibold">
            {hoje.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <button
            onClick={loadDashboardData}
            className="mt-2 px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors text-sm"
          >
            Atualizar Dados
          </button>
          <button
            onClick={handleBackup}
            className="mt-2 ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Fazer Backup
          </button>
          <button
            onClick={handleImport}
            className="mt-2 ml-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            Importar Banco
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total de Alunos Ativos */}
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg border-l-4 border-lime-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Alunos Ativos</p>
              <p className="text-3xl font-bold text-lime-400">{dadosDashboard.totalAlunos}</p>
            </div>
            <div className="bg-lime-500 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            Total de aulas na semana: {estatisticasSemana.totalAulasSemana}
          </p>
        </div>

        {/* Contas a Vencer */}
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Contas a Vencer</p>
              <p className="text-3xl font-bold text-red-400">
                {formatarMoeda(dadosDashboard.totalContasVencer)}
              </p>
            </div>
            <div className="bg-red-500 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            {dadosDashboard.contasVencer.length} conta(s) nos próximos 15 dias
          </p>
        </div>

        {/* Mensalidades a Receber */}
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Mensalidades a Receber</p>
              <p className="text-3xl font-bold text-yellow-400">
                {formatarMoeda(dadosDashboard.totalMensalidadesReceber)}
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            {dadosDashboard.mensalidadesReceber.length} mensalidade(s) nos próximos 7 dias
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Treinos de Hoje */}
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-lime-400">
            Treinos de Hoje ({diaSemanaAtual.charAt(0).toUpperCase() + diaSemanaAtual.slice(1)})
          </h2>

          {treinosDoDia.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {treinosDoDia
                .sort((a, b) => {
                  const horarioA = a.horarioHoje || '00:00'
                  const horarioB = b.horarioHoje || '00:00'
                  return horarioA.localeCompare(horarioB)
                })
                .map((aluno) => (
                  <div
                    key={aluno.id}
                    className="flex items-center justify-between p-3 bg-stone-600 rounded-lg hover:bg-stone-500 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: aluno.corPadrao || '#4CAF50' }}
                      ></div>
                      <div>
                        <p className="font-semibold text-white">{aluno.nome}</p>
                        <p className="text-sm text-gray-300">{aluno.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lime-400 font-bold">{aluno.horarioHoje}</p>
                      <p className="text-xs text-gray-400">
                        {formatarMoeda(aluno.mensalidade || 0)}/mês
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhum treino agendado para hoje</p>
            </div>
          )}
        </div>

        {/* Contas a Vencer */}
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-red-400">Contas a Vencer</h2>

          {dadosDashboard.contasVencer.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dadosDashboard.contasVencer
                .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))
                .map((conta) => (
                  <div
                    key={conta.id}
                    className={`p-3 rounded-lg ${getStatusClass(conta.dataVencimento, 'conta')}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{conta.descricao}</p>
                        <p className="text-sm opacity-90">
                          {conta.aluno_nome && `Aluno: ${conta.aluno_nome}`}
                        </p>
                        <p className="text-xs opacity-75">
                          Vencimento: {formatarData(conta.dataVencimento)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatarMoeda(conta.valor)}</p>
                        <p className="text-xs font-medium">
                          {getTextoVencimento(conta.dataVencimento)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhuma conta a vencer nos próximos 15 dias</p>
            </div>
          )}
        </div>
      </div>

      {/* Mensalidades a Receber */}
      <div className="mt-8">
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">Mensalidades a Receber</h2>

          {dadosDashboard.mensalidadesReceber.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dadosDashboard.mensalidadesReceber
                .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))
                .map((mensalidade) => (
                  <div
                    key={mensalidade.id}
                    className={`p-4 rounded-lg ${getStatusClass(mensalidade.dataVencimento, 'mensalidade')}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{mensalidade.aluno_nome}</p>
                        <p className="text-sm opacity-90">Mensalidade</p>
                      </div>
                      <p className="font-bold text-lg">{formatarMoeda(mensalidade.valor)}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-75">
                        Venc: {formatarData(mensalidade.dataVencimento)}
                      </span>
                      <span className="font-medium">
                        {getTextoVencimento(mensalidade.dataVencimento)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Nenhuma mensalidade a receber nos próximos 7 dias</p>
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas da Semana */}
      <div className="mt-8">
        <div className="bg-stone-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-400">Estatísticas da Semana</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { key: 'segunda', label: 'SEG' },
              { key: 'terca', label: 'TER' },
              { key: 'quarta', label: 'QUA' },
              { key: 'quinta', label: 'QUI' },
              { key: 'sexta', label: 'SEX' },
              { key: 'sabado', label: 'SÁB' },
              { key: 'domingo', label: 'DOM' }
            ].map((dia) => {
              const quantidade = estatisticasSemana.estatisticasPorDia[dia.key] || 0
              const isHoje = dia.key === diaSemanaAtual

              return (
                <div
                  key={dia.key}
                  className={`text-center p-4 rounded-lg ${
                    isHoje
                      ? 'bg-lime-600 text-white border-2 border-lime-400'
                      : 'bg-stone-600 text-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{dia.label}</p>
                  <p className="text-2xl font-bold mt-1">{quantidade}</p>
                  <p className="text-xs opacity-75">{quantidade === 1 ? 'aluno' : 'alunos'}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-stone-600 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Total de Aulas/Semana</p>
              <p className="text-2xl font-bold text-blue-400">
                {estatisticasSemana.totalAulasSemana}
              </p>
            </div>
            <div className="bg-stone-600 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Alunos Ativos</p>
              <p className="text-2xl font-bold text-green-400">
                {estatisticasSemana.totalAlunosAtivos}
              </p>
            </div>
            <div className="bg-stone-600 p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Média Aulas/Aluno</p>
              <p className="text-2xl font-bold text-purple-400">
                {estatisticasSemana.mediaAulasPorAluno.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <AlertModal
        isOpen={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        title={alert.title}
        message={alert.message}
      />
    </div>
  )
}

export default Dashboard
