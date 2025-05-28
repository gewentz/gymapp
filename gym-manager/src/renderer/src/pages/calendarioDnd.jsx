import { useState, useRef } from 'react'

function CalendarioDnd() {
  // Dados mockados dos alunos com horários
  const [agendamentos, setAgendamentos] = useState([
    {
      id: 1,
      alunoId: 1,
      nomeAluno: 'João Silva',
      dia: 'segunda',
      horario: '08:00',
      duracao: 60 // em minutos
    },
    {
      id: 2,
      alunoId: 2,
      nomeAluno: 'Maria Santos',
      dia: 'segunda',
      horario: '08:00', // Mesmo horário que João
      duracao: 60
    },
    {
      id: 3,
      alunoId: 1,
      nomeAluno: 'João Silva',
      dia: 'quarta',
      horario: '08:00',
      duracao: 60
    },
    {
      id: 4,
      alunoId: 3,
      nomeAluno: 'Pedro Oliveira',
      dia: 'terca',
      horario: '10:00',
      duracao: 60
    },
    {
      id: 5,
      alunoId: 4,
      nomeAluno: 'Ana Costa',
      dia: 'quinta',
      horario: '14:00',
      duracao: 60
    },
    {
      id: 6,
      alunoId: 5,
      nomeAluno: 'Carlos Ferreira',
      dia: 'sexta',
      horario: '16:00',
      duracao: 60
    },
    {
      id: 7,
      alunoId: 2,
      nomeAluno: 'Maria Santos',
      dia: 'quinta',
      horario: '14:00', // Mesmo horário que Ana
      duracao: 60
    },
    {
      id: 8,
      alunoId: 6,
      nomeAluno: 'Lucia Mendes',
      dia: 'segunda',
      horario: '08:00', // Terceiro aluno no mesmo horário
      duracao: 60
    }
  ])

  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverCell, setDragOverCell] = useState(null)

  // Configurações do calendário
  const diasSemana = [
    { key: 'segunda', label: 'Segunda-feira' },
    { key: 'terca', label: 'Terça-feira' },
    { key: 'quarta', label: 'Quarta-feira' },
    { key: 'quinta', label: 'Quinta-feira' },
    { key: 'sexta', label: 'Sexta-feira' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ]

  // Horários disponíveis (6h às 22h)
  const horarios = []
  for (let hora = 6; hora <= 22; hora++) {
    horarios.push(`${hora.toString().padStart(2, '0')}:00`)
    if (hora < 22) {
      horarios.push(`${hora.toString().padStart(2, '0')}:30`)
    }
  }

  // Função para obter agendamentos de um dia e horário específico
  const getAgendamentosPorSlot = (dia, horario) => {
    return agendamentos.filter((ag) => ag.dia === dia && ag.horario === horario)
  }

  // Handlers do Drag and Drop
  const handleDragStart = (e, agendamento) => {
    setDraggedItem(agendamento)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, dia, horario) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCell(`${dia}-${horario}`)
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
  }

  const handleDrop = (e, novoDia, novoHorario) => {
    e.preventDefault()
    setDragOverCell(null)

    if (!draggedItem) return

    // Verificar se o aluno já tem agendamento neste horário/dia (evitar duplicatas do mesmo aluno)
    const agendamentoExistente = agendamentos.find(
      (ag) =>
        ag.dia === novoDia &&
        ag.horario === novoHorario &&
        ag.alunoId === draggedItem.alunoId &&
        ag.id !== draggedItem.id
    )

    if (agendamentoExistente) {
      alert('Este aluno já possui agendamento neste horário!')
      setDraggedItem(null)
      return
    }

    // Atualizar o agendamento (permite múltiplos alunos no mesmo horário)
    setAgendamentos((prev) =>
      prev.map((ag) =>
        ag.id === draggedItem.id ? { ...ag, dia: novoDia, horario: novoHorario } : ag
      )
    )

    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverCell(null)
  }

  // Função para obter cor do aluno (baseada no ID)
  const getCorAluno = (alunoId) => {
    const cores = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-orange-500'
    ]
    return cores[alunoId % cores.length]
  }

  // Função para calcular altura da célula baseada no número de agendamentos
  const getAlturaCell = (numeroAgendamentos) => {
    if (numeroAgendamentos === 0) return 'min-h-[60px]'
    if (numeroAgendamentos === 1) return 'min-h-[60px]'
    if (numeroAgendamentos === 2) return 'min-h-[80px]'
    if (numeroAgendamentos === 3) return 'min-h-[100px]'
    return 'min-h-[120px]'
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold opacity-35">Calendário de Treinos</h1>
      </div>

      <div
        className="bg-stone-700 shadow-2xl w-full rounded-md border-2 p-4 overflow-auto"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {/* Legenda */}
        <div className="mb-4 p-3 bg-stone-600 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">
            <strong>Instruções:</strong> Arraste e solte os agendamentos para reorganizar os
            horários. Múltiplos alunos podem treinar no mesmo horário.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-500 rounded">João Silva</span>
            <span className="px-2 py-1 bg-green-500 rounded">Maria Santos</span>
            <span className="px-2 py-1 bg-purple-500 rounded">Pedro Oliveira</span>
            <span className="px-2 py-1 bg-pink-500 rounded">Ana Costa</span>
            <span className="px-2 py-1 bg-yellow-500 rounded text-black">Carlos Ferreira</span>
            <span className="px-2 py-1 bg-red-500 rounded">Lucia Mendes</span>
          </div>
        </div>

        {/* Grid do Calendário */}
        <div className="min-w-full">
          <div className="grid grid-cols-8 gap-1">
            {/* Header - Horários */}
            <div className="bg-stone-600 p-2 text-center font-bold border border-stone-500 rounded">
              Horário
            </div>

            {/* Header - Dias da Semana */}
            {diasSemana.map((dia) => (
              <div
                key={dia.key}
                className="bg-stone-600 p-2 text-center font-bold border border-stone-500 rounded"
              >
                {dia.label}
              </div>
            ))}

            {/* Linhas de Horários */}
            {horarios.map((horario) => (
              <div key={horario} className="contents">
                {/* Coluna do Horário */}
                <div className="bg-stone-600 p-2 text-center font-medium border border-stone-500 text-sm">
                  {horario}
                </div>

                {/* Células dos Dias */}
                {diasSemana.map((dia) => {
                  const agendamentosSlot = getAgendamentosPorSlot(dia.key, horario)
                  const cellKey = `${dia.key}-${horario}`
                  const isDragOver = dragOverCell === cellKey

                  return (
                    <div
                      key={cellKey}
                      className={`${getAlturaCell(agendamentosSlot.length)} p-1 border border-stone-500 transition-colors ${
                        isDragOver ? 'bg-lime-600 bg-opacity-30' : 'bg-stone-800'
                      }`}
                      onDragOver={(e) => handleDragOver(e, dia.key, horario)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dia.key, horario)}
                    >
                      {/* Indicador de quantidade quando há muitos agendamentos */}
                      {agendamentosSlot.length > 0 && (
                        <div className="text-xs text-gray-400 mb-1 text-center">
                          {agendamentosSlot.length} aluno{agendamentosSlot.length > 1 ? 's' : ''}
                        </div>
                      )}

                      <div className="space-y-1">
                        {agendamentosSlot.map((agendamento) => (
                          <div
                            key={agendamento.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, agendamento)}
                            onDragEnd={handleDragEnd}
                            className={`
                              ${getCorAluno(agendamento.alunoId)}
                              text-white text-xs p-1 rounded cursor-move
                              hover:opacity-80 transition-opacity
                              ${draggedItem?.id === agendamento.id ? 'opacity-50' : ''}
                            `}
                            title={`${agendamento.nomeAluno} - ${agendamento.horario} (${agendamento.duracao}min)`}
                          >
                            <div className="font-semibold truncate text-center">
                              {agendamento.nomeAluno.split(' ')[0]}{' '}
                              {/* Só o primeiro nome para economizar espaço */}
                            </div>
                            <div className="text-xs opacity-90 text-center">
                              {agendamento.duracao}min
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Resumo do Dia */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {diasSemana.map((dia) => {
            const agendamentosDia = agendamentos.filter((ag) => ag.dia === dia.key)
            const horariosOcupados = [...new Set(agendamentosDia.map((ag) => ag.horario))].length

            return (
              <div key={dia.key} className="bg-stone-600 rounded-lg p-3">
                <h3 className="font-bold text-sm mb-2">{dia.label.split('-')[0]}</h3>
                <div className="text-xs text-gray-300 mb-2">
                  <div>{agendamentosDia.length} agendamento(s)</div>
                  <div>{horariosOcupados} horário(s) ocupado(s)</div>
                </div>
                <div className="space-y-1">
                  {agendamentosDia
                    .sort((a, b) => a.horario.localeCompare(b.horario))
                    .slice(0, 4)
                    .map((ag) => (
                      <div key={ag.id} className="text-xs text-gray-300">
                        {ag.horario} - {ag.nomeAluno.split(' ')[0]}
                      </div>
                    ))}
                  {agendamentosDia.length > 4 && (
                    <div className="text-xs text-gray-400">
                      +{agendamentosDia.length - 4} mais...
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CalendarioDnd
