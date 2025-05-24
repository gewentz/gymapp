import { useState } from 'react'
import Card from '../components/Card'
import Modal from '../components/Modal'
import { data } from 'react-router-dom'

function Alunos() {
  // Dados mockados dos alunos
  const [alunos, setAlunos] = useState([
    {
      id: 1,
      nome: 'João Silva',
      nascimento: '1995-09-25', // String no formato YYYY-MM-DD
      telefone: '(11) 99999-9999',
      email: 'joao@email.com',
      diasTreino: ['segunda', 'quarta', 'sexta'],
      status: 'Ativo',
      dataMatricula: '2024-01-15'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      nascimento: '1990-05-30', // String no formato YYYY-MM-DD
      telefone: '(11) 88888-8888',
      email: 'maria@email.com',
      diasTreino: ['terca', 'quinta'],
      status: 'Ativo',
      dataMatricula: '2024-02-10'
    },
    {
      id: 3,
      nome: 'Pedro Oliveira',
      nascimento: '1998-11-15', // String no formato YYYY-MM-DD
      telefone: '(11) 77777-7777',
      email: 'pedro@email.com',
      diasTreino: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
      status: 'Inativo',
      dataMatricula: '2023-12-05'
    },
    {
      id: 4,
      nome: 'Ana Costa',
      nascimento: '1992-08-22', // Corrigir de 1993 para '1992-08-22'
      telefone: '(11) 66666-6666',
      email: 'ana@email.com',
      diasTreino: ['segunda', 'quarta', 'sexta', 'sabado'],
      status: 'Ativo',
      dataMatricula: '2024-03-01'
    },
    {
      id: 5,
      nome: 'Carlos Ferreira',
      nascimento: '1985-12-10', // String no formato YYYY-MM-DD
      telefone: '(11) 55555-5555',
      email: 'carlos@email.com',
      diasTreino: ['terca', 'quinta', 'sabado'],
      status: 'Ativo',
      dataMatricula: '2024-01-20'
    },
    {
      id: 6,
      nome: 'Lucia Mendes',
      nascimento: '1993-07-18', // String no formato YYYY-MM-DD
      telefone: '(11) 44444-4444',
      email: 'lucia@email.com',
      diasTreino: ['segunda', 'quarta', 'sexta', 'domingo'],
      status: 'Ativo',
      dataMatricula: '2024-02-28'
    }
  ])

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
    status: 'Ativo'
  })

  // Função para calcular a idade
  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 0

    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
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
    console.log(`Campo ${name} alterado para:`, value) // Debug
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Função para lidar com mudanças nos checkboxes dos dias
  const handleDiaChange = (dia) => {
    setFormData((prev) => ({
      ...prev,
      diasTreino: prev.diasTreino.includes(dia)
        ? prev.diasTreino.filter((d) => d !== dia)
        : [...prev.diasTreino, dia]
    }))
  }

  // Função para abrir modal de novo aluno
  const handleNovoAluno = () => {
    setEditingAluno(null)
    setFormData({
      nome: '',
      nascimento: Date(),
      telefone: '',
      email: '',
      diasTreino: [],
      status: 'Ativo'
    })
    setIsModalOpen(true)
  }

  // Função para abrir modal de edição
  const handleEditarAluno = (aluno) => {
    console.log('Aluno selecionado:', aluno) // Debug
    console.log('Data de nascimento:', aluno.nascimento) // Debug

    setEditingAluno(aluno)
    setFormData({
      nome: aluno.nome,
      nascimento: aluno.nascimento || '',
      telefone: aluno.telefone,
      email: aluno.email,
      diasTreino: [...aluno.diasTreino],
      status: aluno.status
    })
    setIsModalOpen(true)
  }

  // Função para salvar aluno (novo ou editado)
  const handleSaveAluno = () => {
    // Validação básica
    if (!formData.nome || !formData.email || !formData.telefone || !formData.nascimento) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    console.log('FormData antes de salvar:', formData) // Debug

    if (editingAluno) {
      // Editando aluno existente
      const alunoAtualizado = {
        ...editingAluno,
        ...formData
      }

      console.log('Aluno atualizado:', alunoAtualizado) // Debug

      setAlunos((prev) =>
        prev.map((aluno) => (aluno.id === editingAluno.id ? alunoAtualizado : aluno))
      )
    } else {
      // Criando novo aluno
      const novoAluno = {
        id: Math.max(...alunos.map((a) => a.id)) + 1,
        ...formData,
        dataMatricula: new Date().toISOString().split('T')[0]
      }

      setAlunos((prev) => [...prev, novoAluno])
    }

    // Limpar formulário e fechar modal
    handleCancel()
  }

  // Função para cancelar
  const handleCancel = () => {
    setFormData({
      nome: '',
      nascimento: '',
      telefone: '',
      email: '',
      diasTreino: [],
      status: 'Ativo'
    })
    setEditingAluno(null)
    setIsModalOpen(false)
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
              <Card key={aluno.id} aluno={aluno} onEdit={handleEditarAluno} />
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
        size="lg"
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
        <form className="space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dias de treino */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Dias de Treino
              </label>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { key: 'segunda', label: 'Seg', full: 'Segunda' },
                  { key: 'terca', label: 'Ter', full: 'Terça' },
                  { key: 'quarta', label: 'Qua', full: 'Quarta' },
                  { key: 'quinta', label: 'Qui', full: 'Quinta' },
                  { key: 'sexta', label: 'Sex', full: 'Sexta' },
                  { key: 'sabado', label: 'Sab', full: 'Sábado' },
                  { key: 'domingo', label: 'Dom', full: 'Domingo' }
                ].map((dia) => (
                  <div key={dia.key} className="flex flex-col items-center">
                    <label
                      htmlFor={dia.key}
                      className={`w-10 h-10 flex items-center justify-center rounded-md border-2 cursor-pointer transition-colors ${
                        formData.diasTreino.includes(dia.key)
                          ? 'bg-lime-500 border-lime-500 text-white'
                          : 'bg-white border-stone-300 text-stone-700 hover:border-lime-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={dia.key}
                        checked={formData.diasTreino.includes(dia.key)}
                        onChange={() => handleDiaChange(dia.key)}
                        className="sr-only"
                      />
                      {dia.label}
                    </label>
                    <span className="text-xs text-stone-600 mt-1">{dia.full}</span>
                  </div>
                ))}
              </div>
            </div>

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
          </div>

          <div className="text-sm text-stone-500 mt-4">* Campos obrigatórios</div>
        </form>
      </Modal>
    </div>
  )
}

export default Alunos
