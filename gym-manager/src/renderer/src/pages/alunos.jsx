import { useState, useEffect, useCallback, useRef } from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import AlertModal from '../components/Alert'

function Alunos() {
  const [alert, setAlert] = useState({ open: false, message: '', title: '' })
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAluno, setEditingAluno] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [alunoToDelete, setAlunoToDelete] = useState(null)
  const nomeInputRef = useRef(null)

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    nascimento: '',
    telefone: '',
    email: '',
    diasTreino: [],
    horariosTreino: [],
    status: 'Ativo',
    corPadrao: '#5fffd2',
    mensalidade: '',
    dataMatricula: '' // <-- adicionar aqui
  })

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
        message: 'Erro ao carregar alunos. Tente novamente mais tarde.',
        title: 'Erro'
      })
    } finally {
      setLoading(false)
    }
  }

  // Carregar alunos ao montar o componente
  useEffect(() => {
    loadAlunos()
  }, [])

  // Horários disponíveis
  const horariosDisponiveis = []
  for (let hora = 6; hora <= 22; hora++) {
    horariosDisponiveis.push(`${hora.toString().padStart(2, '0')}:00`)
    if (hora < 22) {
      horariosDisponiveis.push(`${hora.toString().padStart(2, '0')}:30`)
    }
  }

  // Função para calcular a idade (corrigida)
  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 0

    const hoje = new Date()
    const [year, month, day] = dataNascimento.split('-')
    const nascimento = new Date(year, month - 1, day) // month - 1 porque Date usa 0-11 para meses

    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mesAtual = hoje.getMonth()
    const mesNascimento = nascimento.getMonth()

    if (
      mesAtual < mesNascimento ||
      (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
    ) {
      idade--
    }

    return idade
  }

  // Função para obter data atual no formato correto
  const getCurrentDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Filtrar alunos baseado na busca e status
  const alunosFiltrados = alunos.filter((aluno) => {
    const matchesSearch =
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'Todos' || aluno.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Função para lidar com mudanças no formulário
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }, [])

  // Função para lidar com mudanças nos checkboxes dos dias
  const handleDiaChange = useCallback((dia) => {
    setFormData((prev) => {
      const novosDiasTreino = prev.diasTreino.includes(dia)
        ? prev.diasTreino.filter((d) => d !== dia)
        : [...prev.diasTreino, dia]

      // Atualizar horários de treino - remover horários de dias desmarcados
      const novosHorariosTreino = prev.horariosTreino.filter((h) => novosDiasTreino.includes(h.dia))

      // Adicionar horário padrão para novos dias (08:00)
      const diasSemHorario = novosDiasTreino.filter(
        (d) => !novosHorariosTreino.some((h) => h.dia === d)
      )

      diasSemHorario.forEach((dia) => {
        novosHorariosTreino.push({ dia, horario: '08:00' })
      })

      return {
        ...prev,
        diasTreino: novosDiasTreino,
        horariosTreino: novosHorariosTreino
      }
    })
  }, [])

  // Função para alterar horário de um dia específico
  const handleHorarioChange = useCallback((dia, novoHorario) => {
    setFormData((prev) => ({
      ...prev,
      horariosTreino: prev.horariosTreino.map((h) =>
        h.dia === dia ? { ...h, horario: novoHorario } : h
      )
    }))
  }, [])

  // Função para abrir modal de novo aluno
  const handleNovoAluno = useCallback(() => {
    setEditingAluno(null)
    setFormData({
      nome: '',
      nascimento: '',
      telefone: '',
      email: '',
      diasTreino: [],
      horariosTreino: [],
      status: 'Ativo',
      corPadrao: '#4CAF50',
      mensalidade: '',
      dataMatricula: ''
    })
    setIsModalOpen(true)
  }, [])

  // Função para abrir modal de edição
  const handleEditarAluno = useCallback((aluno) => {
    setEditingAluno(aluno)
    setFormData({
      nome: aluno.nome,
      nascimento: aluno.nascimento || '',
      telefone: aluno.telefone,
      email: aluno.email,
      diasTreino: [...(aluno.diasTreino || [])],
      horariosTreino: [...(aluno.horariosTreino || [])],
      status: aluno.status,
      corPadrao: aluno.corPadrao || '#4CAF50',
      mensalidade: aluno.mensalidade || '',
      dataMatricula: aluno.dataMatricula || '' // <-- adicionar aqui
    })
    setIsModalOpen(true)
  }, [])

  // Função para salvar aluno (novo ou editado)
  const handleSaveAluno = async () => {
    if (
      !formData.nome ||
      !formData.email ||
      !formData.telefone ||
      !formData.nascimento ||
      !formData.mensalidade
    ) {
      setAlert({
        open: true,
        message: 'Por favor, preencha todos os campos obrigatórios.',
        title: 'Campos Obrigatórios'
      })
      return
    }

    const mensalidadeNum = parseFloat(formData.mensalidade)
    if (isNaN(mensalidadeNum) || mensalidadeNum <= 0) {
      setAlert({
        open: true,
        message: 'Por favor, insira um valor válido para a mensalidade.',
        title: 'Valor Inválido'
      })
      return
    }

    const dataMatriculaFinal = formData.dataMatricula ? formData.dataMatricula : getCurrentDate()
    console.log('Data de matrícula enviada:', dataMatriculaFinal)

    try {
      if (editingAluno) {
        // Atualizar aluno existente
        const alunoAtualizado = {
          ...formData,
          mensalidade: mensalidadeNum,
          dataMatricula: dataMatriculaFinal // <-- garantir que vai o valor correto
        }

        await window.api.alunos.update(editingAluno.id, alunoAtualizado)
        setAlert({
          open: true,
          message: 'Aluno atualizado com sucesso!',
          title: 'Sucesso'
        })
      } else {
        // Criar novo aluno
        const novoAluno = {
          ...formData,
          mensalidade: mensalidadeNum,
          dataMatricula: dataMatriculaFinal // <-- garantir que vai o valor correto
        }

        await window.api.alunos.create(novoAluno)
        setAlert({
          open: true,
          message: 'Aluno criado com sucesso!',
          title: 'Sucesso'
        })
      }

      // Recarregar lista de alunos
      await loadAlunos()
      handleCancel()
    } catch (error) {
      console.error('Erro ao salvar aluno:', error)
      if (error.message.includes('UNIQUE constraint failed')) {
        setAlert({
          open: true,
          message: 'Já existe um aluno com esse nome ou email.',
          title: 'Erro'
        })
      } else {
        setAlert({
          open: true,
          message: 'Erro ao salvar aluno. Tente novamente.',
          title: 'Erro'
        })
      }
    }
  }

  // Função para abrir modal de confirmação de exclusão
  const handleDeleteAluno = (aluno) => {
    setAlunoToDelete(aluno)
    setShowConfirmModal(true)
  }

  // Função para confirmar a exclusão
  const confirmDelete = async () => {
    if (!alunoToDelete) return

    try {
      await window.api.alunos.delete(alunoToDelete.id)
      setAlert({
        open: true,
        message: 'Aluno excluído com sucesso!',
        title: 'Sucesso'
      })
      await loadAlunos()
    } catch (error) {
      console.error('Erro ao excluir aluno:', error)
      setAlert({
        open: true,
        message: 'Erro ao excluir aluno. Tente novamente.',
        title: 'Erro'
      })
    } finally {
      setShowConfirmModal(false)
      setAlunoToDelete(null)
    }
  }

  // Função para cancelar a exclusão
  const cancelDelete = () => {
    setShowConfirmModal(false)
    setAlunoToDelete(null)
  }

  // Função para cancelar
  const handleCancel = useCallback(() => {
    setFormData({
      nome: '',
      nascimento: '',
      telefone: '',
      email: '',
      diasTreino: [],
      horariosTreino: [],
      status: 'Ativo',
      corPadrao: '#4CAF50',
      mensalidade: ''
    })
    setEditingAluno(null)
    setIsModalOpen(false)
  }, [])

  if (loading) {
    return (
      <div className="h-screen w-full p-6 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-lg">Carregando alunos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold opacity-35">Alunos</h1>
        <div className="flex gap-4">
          {/* Campo de busca */}
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-stone-600 text-white rounded-md border border-stone-500 focus:outline-none focus:border-lime-500"
          />

          {/* Filtro por status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-stone-600 text-white rounded-md border border-stone-500 focus:outline-none focus:border-lime-500"
          >
            <option value="Todos">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>

          {/* Botão adicionar aluno */}
          <button
            onClick={handleNovoAluno}
            className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
          >
            + Novo Aluno
          </button>
        </div>
      </div>

      <div
        className="bg-stone-700 shadow-2xl w-full rounded-md border-2 p-4 overflow-y-auto"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {alunosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {alunosFiltrados.map((aluno) => (
              <Card
                key={aluno.id}
                aluno={aluno}
                onEdit={handleEditarAluno}
                onDelete={handleDeleteAluno}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-lg">
              {searchTerm || filterStatus !== 'Todos'
                ? 'Nenhum aluno encontrado com os filtros aplicados.'
                : 'Nenhum aluno cadastrado.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal para cadastrar/editar aluno */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={editingAluno ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
        size="xl"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="primary" onClick={handleSaveAluno}>
              {editingAluno ? 'Atualizar Aluno' : 'Salvar Aluno'}
            </Modal.Button>
          </>
        }
      >
        <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-stone-700 mb-1">
                Nome Completo *
              </label>
              <input
                ref={nomeInputRef}
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                placeholder="Digite o nome completo"
                required
                autoComplete="off"
                style={{
                  pointerEvents: 'auto',
                  userSelect: 'auto',
                  WebkitUserSelect: 'auto'
                }}
              />
            </div>

            {/* nascimento */}
            <div>
              <label htmlFor="nascimento" className="block text-sm font-medium text-stone-700 mb-1">
                Data de Nascimento *
              </label>
              <input
                type="date"
                id="nascimento"
                name="nascimento"
                value={formData.nascimento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-stone-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 relative z-10"
                required
                autoComplete="off"
              />
              {formData.nascimento && (
                <p className="text-sm text-stone-600 mt-1">
                  Idade atual: {calcularIdade(formData.nascimento)} anos
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border text-stone-700 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 relative z-10"
                placeholder="Digite o email"
                required
                autoComplete="off"
              />
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-stone-700 mb-1">
                Telefone *
              </label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border text-stone-700 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 relative z-10"
                placeholder="(11) 99999-9999"
                required
                autoComplete="off"
              />
            </div>
          </div>

          {/* Dias e Horários de Treino */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Dias e Horários de Treino
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'segunda', label: 'Segunda-feira' },
                { key: 'terca', label: 'Terça-feira' },
                { key: 'quarta', label: 'Quarta-feira' },
                { key: 'quinta', label: 'Quinta-feira' },
                { key: 'sexta', label: 'Sexta-feira' },
                { key: 'sabado', label: 'Sábado' },
                { key: 'domingo', label: 'Domingo' }
              ].map((dia) => {
                const isSelected = formData.diasTreino.includes(dia.key)
                const horarioAtual =
                  formData.horariosTreino.find((h) => h.dia === dia.key)?.horario || '08:00'

                return (
                  <div
                    key={dia.key}
                    className="border border-stone-300 rounded-lg p-3 relative z-10"
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={dia.key}
                        checked={isSelected}
                        onChange={() => handleDiaChange(dia.key)}
                        className="mr-2 w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500 relative z-10"
                      />
                      <label htmlFor={dia.key} className="text-sm font-medium text-stone-700">
                        {dia.label}
                      </label>
                    </div>

                    {isSelected && (
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">Horário:</label>
                        <select
                          value={horarioAtual}
                          onChange={(e) => handleHorarioChange(dia.key, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-stone-300 text-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-lime-500 relative z-10"
                        >
                          {horariosDisponiveis.map((horario) => (
                            <option key={horario} value={horario}>
                              {horario}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-stone-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border text-stone-700 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 relative z-10"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            {/* Cor do Aluno */}
            <div>
              <label htmlFor="corPadrao" className="block text-sm font-medium text-stone-700 mb-1">
                Cor do Aluno
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="corPadrao"
                  name="corPadrao"
                  value={formData.corPadrao}
                  onChange={handleInputChange}
                  className="w-12 h-10 border border-stone-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-500 relative z-10"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-stone-300"
                    style={{ backgroundColor: formData.corPadrao }}
                  ></div>
                  <span className="text-sm text-stone-600">{formData.corPadrao}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensalidade */}
          <div>
            <label htmlFor="mensalidade" className="block text-sm font-medium text-stone-700 mb-1">
              Mensalidade (R$)*
            </label>
            <input
              type="number"
              id="mensalidade"
              name="mensalidade"
              value={formData.mensalidade}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 relative z-10"
              placeholder="Valor da mensalidade"
              step="0.01"
              min="0"
              required
              autoComplete="off"
            />
          </div>

          {/* Data de Matrícula */}
          <div>
            <label
              htmlFor="dataMatricula"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Data de Matrícula
            </label>
            <input
              type="date"
              id="dataMatricula"
              name="dataMatricula"
              value={formData.dataMatricula}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-stone-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 relative z-10"
            />
          </div>

          <div className="text-sm text-stone-500 mt-4">* Campos obrigatórios</div>
        </div>
      </Modal>

      {/* Modal de Confirmação usando o componente Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={cancelDelete}
        title="Confirmar Exclusão"
        size="sm"
        footer={
          <>
            <Modal.Button variant="outline" onClick={cancelDelete}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="danger" onClick={confirmDelete}>
              Sim, Excluir
            </Modal.Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">Excluir Aluno</h3>

          <p className="text-sm text-gray-500 mb-4">
            Tem certeza que deseja excluir o aluno{' '}
            <span className="font-semibold text-gray-900">{alunoToDelete?.nome}</span>?
          </p>

          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ⚠️ Esta ação não pode ser desfeita.
          </p>
        </div>
      </Modal>

      <AlertModal
        isOpen={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        title={alert.title}
        message={alert.message}
      />
    </div>
  )
}

export default Alunos
