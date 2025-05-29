import { useState, useEffect } from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'

function Alunos() {
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAluno, setEditingAluno] = useState(null)

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
    mensalidade: ''
  })

  // Carregar alunos do banco de dados
  const loadAlunos = async () => {
    try {
      setLoading(true)
      const alunosData = await window.api.alunos.getAll()
      setAlunos(alunosData)
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      alert('Erro ao carregar dados dos alunos')
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
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Função para lidar com mudanças nos checkboxes dos dias
  const handleDiaChange = (dia) => {
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
  }

  // Função para alterar horário de um dia específico
  const handleHorarioChange = (dia, novoHorario) => {
    setFormData((prev) => ({
      ...prev,
      horariosTreino: prev.horariosTreino.map((h) =>
        h.dia === dia ? { ...h, horario: novoHorario } : h
      )
    }))
  }

  // Função para abrir modal de novo aluno
  const handleNovoAluno = () => {
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
      mensalidade: ''
    })
    setIsModalOpen(true)
  }

  // Função para abrir modal de edição
  const handleEditarAluno = (aluno) => {
    setEditingAluno(aluno)
    setFormData({
      nome: aluno.nome,
      nascimento: aluno.nascimento || '',
      telefone: aluno.telefone,
      email: aluno.email,
      diasTreino: [...aluno.diasTreino],
      horariosTreino: [...(aluno.horariosTreino || [])],
      status: aluno.status,
      corPadrao: aluno.corPadrao || '#4CAF50',
      mensalidade: aluno.mensalidade || ''
    })
    setIsModalOpen(true)
  }

  // Função para salvar aluno (novo ou editado)
  const handleSaveAluno = async () => {
    if (
      !formData.nome ||
      !formData.email ||
      !formData.telefone ||
      !formData.nascimento ||
      !formData.mensalidade
    ) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const mensalidadeNum = parseFloat(formData.mensalidade)
    if (isNaN(mensalidadeNum) || mensalidadeNum <= 0) {
      alert('Por favor, insira um valor válido para a mensalidade.')
      return
    }

    try {
      if (editingAluno) {
        // Atualizar aluno existente
        const alunoAtualizado = {
          ...formData,
          mensalidade: mensalidadeNum
        }

        await window.api.alunos.update(editingAluno.id, alunoAtualizado)
        alert('Aluno atualizado com sucesso!')
      } else {
        // Criar novo aluno
        const novoAluno = {
          ...formData,
          mensalidade: mensalidadeNum,
          dataMatricula: getCurrentDate()
        }

        await window.api.alunos.create(novoAluno)
        alert('Aluno cadastrado com sucesso!')
      }

      // Recarregar lista de alunos
      await loadAlunos()
      handleCancel()
    } catch (error) {
      console.error('Erro ao salvar aluno:', error)
      if (error.message.includes('UNIQUE constraint failed')) {
        alert('Este email já está cadastrado para outro aluno.')
      } else {
        alert('Erro ao salvar aluno. Tente novamente.')
      }
    }
  }

  // Função para deletar aluno
  const handleDeleteAluno = async (aluno) => {
    if (window.confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?`)) {
      try {
        await window.api.alunos.delete(aluno.id)
        alert('Aluno excluído com sucesso!')
        await loadAlunos()
      } catch (error) {
        console.error('Erro ao excluir aluno:', error)
        alert('Erro ao excluir aluno. Tente novamente.')
      }
    }
  }

  // Função para cancelar
  const handleCancel = () => {
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
  }

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
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-stone-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                placeholder="Digite o nome completo"
                required
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
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-stone-700 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                required
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
                className="w-full px-3 py-2 border text-stone-700 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                placeholder="Digite o email"
                required
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
                className="w-full px-3 py-2 border text-stone-700 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                placeholder="(11) 99999-9999"
                required
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
                  <div key={dia.key} className="border border-stone-300 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={dia.key}
                        checked={isSelected}
                        onChange={() => handleDiaChange(dia.key)}
                        className="mr-2 w-4 h-4 text-lime-600 bg-gray-100 border-gray-300 rounded focus:ring-lime-500"
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
                          className="w-full px-2 py-1 text-xs border border-stone-300 text-stone-700 rounded focus:outline-none focus:ring-1 focus:ring-lime-500"
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
                className="w-full px-3 py-2 border text-stone-700 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
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
                  className="w-12 h-10 border border-stone-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-500"
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
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
              placeholder="Valor da mensalidade"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="text-sm text-stone-500 mt-4">* Campos obrigatórios</div>
        </form>
      </Modal>
    </div>
  )
}

export default Alunos
