import { useState, useRef, useEffect } from 'react'
import AlertModal from '../components/Alert'

function CalendarioDnd() {
  const [alert, setAlert] = useState({ open: false, message: '', title: '' })
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverCell, setDragOverCell] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)

  // Carregar alunos do banco de dados
  const loadAlunos = async () => {
    try {
      setLoading(true)
      const alunosData = await window.api.alunos.getAll()
      setAlunos(alunosData)
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      setAlert({
        open: true,
        title: 'Erro ao Carregar Alunos',
        message: 'Ocorreu um erro ao carregar os alunos. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar alunos ao montar o componente
  useEffect(() => {
    loadAlunos()
  }, [])

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

  // Função para obter agendamentos de um dia e horário específico baseado nos dados dos alunos
  const getAgendamentosPorSlot = (dia, horario) => {
    const agendamentos = []

    alunos.forEach((aluno) => {
      if (aluno.status === 'Ativo' && aluno.diasTreino && aluno.horariosTreino) {
        // Verificar se o aluno treina neste dia
        if (aluno.diasTreino.includes(dia)) {
          // Encontrar o horário para este dia
          const horarioTreino = aluno.horariosTreino.find((h) => h.dia === dia)
          if (horarioTreino && horarioTreino.horario === horario) {
            agendamentos.push({
              id: `${aluno.id}-${dia}-${horario}`,
              alunoId: aluno.id,
              nomeAluno: aluno.nome,
              dia: dia,
              horario: horario,
              duracao: 60,
              corPadrao: aluno.corPadrao || '#4CAF50'
            })
          }
        }
      }
    })

    return agendamentos
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

  const handleDrop = async (e, novoDia, novoHorario) => {
    e.preventDefault()
    setDragOverCell(null)

    if (!draggedItem) return

    try {
      // Encontrar o aluno
      const aluno = alunos.find((a) => a.id === draggedItem.alunoId)
      if (!aluno) return

      // Verificar se o aluno já tem agendamento neste horário/dia
      const jaTemAgendamento = aluno.horariosTreino.some(
        (h) => h.dia === novoDia && h.horario === novoHorario
      )

      if (jaTemAgendamento) {
        setAlert({
          open: true,
          title: 'Horário Já Ocupado',
          message: `O aluno ${aluno.nome} já possui agendamento no dia ${novoDia} às ${novoHorario}.`
        })
        setDraggedItem(null)
        return
      }

      // Criar cópias dos arrays para manipulação
      let novosDiasTreino = [...aluno.diasTreino]
      let novosHorariosTreino = [...aluno.horariosTreino]

      // Encontrar o índice do horário que está sendo movido
      const indiceHorarioAntigo = novosHorariosTreino.findIndex(
        (h) => h.dia === draggedItem.dia && h.horario === draggedItem.horario
      )

      if (indiceHorarioAntigo !== -1) {
        // Remover o horário antigo
        novosHorariosTreino.splice(indiceHorarioAntigo, 1)

        // Verificar se ainda há outros horários para o dia antigo
        const temOutrosHorariosNoDiaAntigo = novosHorariosTreino.some(
          (h) => h.dia === draggedItem.dia
        )

        // Se não há mais horários no dia antigo, remover o dia da lista
        if (!temOutrosHorariosNoDiaAntigo) {
          novosDiasTreino = novosDiasTreino.filter((dia) => dia !== draggedItem.dia)
        }

        // Adicionar o novo horário
        novosHorariosTreino.push({
          dia: novoDia,
          horario: novoHorario
        })

        // Adicionar o novo dia se não existir
        if (!novosDiasTreino.includes(novoDia)) {
          novosDiasTreino.push(novoDia)
        }

        // Dados atualizados do aluno
        const alunoAtualizado = {
          ...aluno,
          diasTreino: novosDiasTreino,
          horariosTreino: novosHorariosTreino
        }

        // Atualizar no banco de dados
        await window.api.alunos.update(aluno.id, alunoAtualizado)

        // Atualizar o estado local imediatamente
        setAlunos((prevAlunos) => prevAlunos.map((a) => (a.id === aluno.id ? alunoAtualizado : a)))

        // Forçar recarregamento dos dados do banco para garantir sincronização
        setTimeout(async () => {
          await loadAlunos()
        }, 100)

        console.log(
          `Horário movido: ${draggedItem.dia} ${draggedItem.horario} -> ${novoDia} ${novoHorario}`
        )
        console.log('Dias de treino atualizados:', novosDiasTreino)
        console.log('Horários de treino atualizados:', novosHorariosTreino)
      }
    } catch (error) {
      console.error('Erro ao atualizar horário:', error)
      setAlert({
        open: true,
        title: 'Erro ao Atualizar Horário',
        message: 'Ocorreu um erro ao atualizar o horário. Tente novamente.'
      })
      // Em caso de erro, recarregar os dados originais
      await loadAlunos()
    }

    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverCell(null)
  }

  // Função para obter cor do aluno
  const getCorAluno = (agendamento) => {
    return agendamento.corPadrao || '#4CAF50'
  }

  // Função para calcular altura da célula baseada no número de agendamentos
  const getAlturaCell = (numeroAgendamentos) => {
    if (numeroAgendamentos === 0) return 'min-h-[60px]'
    if (numeroAgendamentos === 1) return 'min-h-[60px]'
    if (numeroAgendamentos === 2) return 'min-h-[80px]'
    if (numeroAgendamentos === 3) return 'min-h-[100px]'
    return 'min-h-[120px]'
  }

  // Nova função para abrir modal de adicionar horário
  const handleAddHorario = (dia, horario) => {
    setSelectedCell({ dia, horario })
    setShowAddModal(true)
  }

  // Nova função para adicionar horário ao aluno
  const handleConfirmAddHorario = async (alunoId) => {
    if (!selectedCell || !alunoId) return

    try {
      const aluno = alunos.find((a) => a.id === parseInt(alunoId))
      if (!aluno) return

      // Verificar se o aluno já tem agendamento neste horário/dia
      const jaTemAgendamento = aluno.horariosTreino.some(
        (h) => h.dia === selectedCell.dia && h.horario === selectedCell.horario
      )

      if (jaTemAgendamento) {
        setAlert({
          open: true,
          title: 'Horário Já Ocupado',
          message: `O aluno ${aluno.nome} já possui agendamento no dia ${selectedCell.dia} às ${selectedCell.horario}.`
        })
        return
      }

      // Criar cópias dos arrays para manipulação
      let novosDiasTreino = [...aluno.diasTreino]
      let novosHorariosTreino = [...aluno.horariosTreino]

      // Adicionar o novo horário
      novosHorariosTreino.push({
        dia: selectedCell.dia,
        horario: selectedCell.horario
      })

      // Adicionar o novo dia se não existir
      if (!novosDiasTreino.includes(selectedCell.dia)) {
        novosDiasTreino.push(selectedCell.dia)
      }

      // Dados atualizados do aluno
      const alunoAtualizado = {
        ...aluno,
        diasTreino: novosDiasTreino,
        horariosTreino: novosHorariosTreino
      }

      // Atualizar no banco de dados
      await window.api.alunos.update(aluno.id, alunoAtualizado)

      // Atualizar o estado local imediatamente
      setAlunos((prevAlunos) => prevAlunos.map((a) => (a.id === aluno.id ? alunoAtualizado : a)))

      // Fechar modal
      setShowAddModal(false)
      setSelectedCell(null)

      setAlert({
        open: true,
        title: 'Horário Adicionado',
        message: `Horário ${selectedCell.horario} no dia ${selectedCell.dia} adicionado para ${aluno.nome}.`
      })
      console.log(`Horário adicionado: ${aluno.nome} - ${selectedCell.dia} ${selectedCell.horario}`)
    } catch (error) {
      console.error('Erro ao adicionar horário:', error)
      setAlert({
        open: true,
        title: 'Erro ao Adicionar Horário',
        message: 'Ocorreu um erro ao adicionar o horário. Tente novamente.'
      })
    }
  }

  // Função para cancelar adição
  const handleCancelAdd = () => {
    setShowAddModal(false)
    setSelectedCell(null)
  }

  if (loading) {
    return (
      <div className="h-screen w-full p-6 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-lg">Carregando calendário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold opacity-35">Calendário de Treinos</h1>
        <div className="flex gap-2">
          <button
            onClick={loadAlunos}
            className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div
        className="bg-stone-700 shadow-2xl w-full rounded-md border-2 p-4 overflow-auto"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {/* Legenda */}
        <div className="mb-4 p-3 bg-stone-600 rounded-lg">
          <p className="text-sm text-gray-300 mb-2">
            <strong>Instruções:</strong> Arraste e solte os agendamentos para reorganizar os
            horários. Clique no botão "+" para adicionar novos horários. Os dados são salvos
            automaticamente no banco de dados.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {alunos
              .filter((a) => a.status === 'Ativo')
              .slice(0, 6)
              .map((aluno) => (
                <span
                  key={aluno.id}
                  className="px-2 py-1 rounded text-white"
                  style={{ backgroundColor: aluno.corPadrao || '#4CAF50' }}
                >
                  {aluno.nome}
                </span>
              ))}
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
                      className={`${getAlturaCell(agendamentosSlot.length)} p-1 border border-stone-500 transition-colors relative group ${
                        isDragOver ? 'bg-lime-600 bg-opacity-30' : 'bg-stone-800'
                      }`}
                      onDragOver={(e) => handleDragOver(e, dia.key, horario)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dia.key, horario)}
                    >
                      {/* Botão para adicionar horário */}
                      <button
                        onClick={() => handleAddHorario(dia.key, horario)}
                        className="absolute top-1 right-1 w-5 h-5 bg-lime-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-lime-700 flex items-center justify-center"
                        title="Adicionar aluno neste horário"
                      >
                        +
                      </button>

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
                              text-white text-xs p-1 rounded cursor-move
                              hover:opacity-80 transition-opacity
                              ${draggedItem?.id === agendamento.id ? 'opacity-50' : ''}
                            `}
                            style={{ backgroundColor: getCorAluno(agendamento) }}
                            title={`${agendamento.nomeAluno} - ${agendamento.horario} (${agendamento.duracao}min)`}
                          >
                            <div className="font-semibold truncate text-center">
                              {agendamento.nomeAluno.split(' ')[0]}
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
            const agendamentosDia = []
            alunos.forEach((aluno) => {
              if (aluno.status === 'Ativo' && aluno.diasTreino && aluno.horariosTreino) {
                if (aluno.diasTreino.includes(dia.key)) {
                  const horarioTreino = aluno.horariosTreino.find((h) => h.dia === dia.key)
                  if (horarioTreino) {
                    agendamentosDia.push({
                      nome: aluno.nome,
                      horario: horarioTreino.horario
                    })
                  }
                }
              }
            })

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
                    .map((ag, index) => (
                      <div key={index} className="text-xs text-gray-300">
                        {ag.horario} - {ag.nome.split(' ')[0]}
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

      {/* Modal para adicionar horário */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Adicionar Aluno ao Horário</h3>

            {selectedCell && (
              <p className="text-gray-600 mb-4">
                Dia: <strong>{diasSemana.find((d) => d.key === selectedCell.dia)?.label}</strong>
                <br />
                Horário: <strong>{selectedCell.horario}</strong>
              </p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o aluno:
              </label>
              <select
                id="alunoSelect"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 text-gray-700"
                defaultValue=""
              >
                <option value="">Selecione um aluno...</option>
                {alunos
                  .filter((aluno) => aluno.status === 'Ativo')
                  .map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelAdd}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const alunoId = document.getElementById('alunoSelect').value
                  if (alunoId) {
                    handleConfirmAddHorario(alunoId)
                  } else {
                    setAlert({
                      open: true,
                      title: 'Seleção Inválida',
                      message: 'Por favor, selecione um aluno para adicionar ao horário.'
                    })
                  }
                }}
                className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertModal
        isOpen={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        title={alert.title}
        message={alert.message}
      />
    </div>
  )
}

export default CalendarioDnd
