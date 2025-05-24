import { useState } from 'react'
import Modal from '../components/Modal'

function Historico() {
  // Dados mockados dos alunos (mesmo da página alunos)
  const [alunos] = useState([
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao@email.com'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@email.com'
    },
    {
      id: 3,
      nome: 'Pedro Oliveira',
      email: 'pedro@email.com'
    },
    {
      id: 4,
      nome: 'Ana Costa',
      email: 'ana@email.com'
    },
    {
      id: 5,
      nome: 'Carlos Ferreira',
      email: 'carlos@email.com'
    },
    {
      id: 6,
      nome: 'Lucia Mendes',
      email: 'lucia@email.com'
    }
  ])

  // Histórico de desempenho mockado
  const [historicos, setHistoricos] = useState([
    {
      id: 1,
      alunoId: 1,
      data: '2024-01-15',
      peso: 75.5,
      treinoAtual: 'Treino A - Peito e Tríceps',
      fotoBalanca: null
    },
    {
      id: 2,
      alunoId: 1,
      data: '2024-01-22',
      peso: 74.8,
      treinoAtual: 'Treino B - Costas e Bíceps',
      fotoBalanca: null
    },
    {
      id: 3,
      alunoId: 1,
      data: '2024-01-29',
      peso: 74.2,
      treinoAtual: 'Treino C - Pernas',
      fotoBalanca: null
    },
    {
      id: 4,
      alunoId: 2,
      data: '2024-01-10',
      peso: 62.3,
      treinoAtual: 'Treino Funcional',
      fotoBalanca: null
    },
    {
      id: 5,
      alunoId: 2,
      data: '2024-01-17',
      peso: 61.9,
      treinoAtual: 'Treino Cardio + Força',
      fotoBalanca: null
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [alunoSelecionado, setAlunoSelecionado] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState(null)

  // Estado do formulário
  const [formData, setFormData] = useState({
    data: '',
    peso: '',
    treinoAtual: '',
    fotoBalanca: null
  })

  // Filtrar alunos baseado na busca
  const alunosFiltrados = alunos.filter(
    (aluno) =>
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obter histórico do aluno selecionado
  const historicoAluno = alunoSelecionado
    ? historicos
        .filter((h) => h.alunoId === alunoSelecionado.id)
        .sort((a, b) => new Date(b.data) - new Date(a.data))
    : []

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          fotoBalanca: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSelecionarAluno = (aluno) => {
    setAlunoSelecionado(aluno)
    setSearchTerm('')
  }

  const handleNovoRegistro = () => {
    setEditingRegistro(null)
    setFormData({
      data: new Date().toISOString().split('T')[0],
      peso: '',
      treinoAtual: '',
      fotoBalanca: null
    })
    setIsModalOpen(true)
  }

  const handleEditarRegistro = (registro) => {
    setEditingRegistro(registro)
    setFormData({
      data: registro.data,
      peso: registro.peso.toString(),
      treinoAtual: registro.treinoAtual,
      fotoBalanca: registro.fotoBalanca
    })
    setIsModalOpen(true)
  }

  const handleSalvarRegistro = () => {
    if (!formData.data || !formData.peso || !formData.treinoAtual) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (!alunoSelecionado) {
      alert('Selecione um aluno primeiro')
      return
    }

    if (editingRegistro) {
      // Editando registro existente
      setHistoricos((prev) =>
        prev.map((h) =>
          h.id === editingRegistro.id
            ? {
                ...editingRegistro,
                ...formData,
                peso: parseFloat(formData.peso),
                alunoId: alunoSelecionado.id
              }
            : h
        )
      )
    } else {
      // Novo registro
      const novoRegistro = {
        id: Math.max(...historicos.map((h) => h.id), 0) + 1,
        alunoId: alunoSelecionado.id,
        ...formData,
        peso: parseFloat(formData.peso)
      }
      setHistoricos((prev) => [...prev, novoRegistro])
    }

    handleCancelar()
  }

  const handleCancelar = () => {
    setFormData({
      data: '',
      peso: '',
      treinoAtual: '',
      fotoBalanca: null
    })
    setEditingRegistro(null)
    setIsModalOpen(false)
  }

  const calcularVariacaoPeso = (pesoAtual, pesoAnterior) => {
    if (!pesoAnterior) return null
    const variacao = pesoAtual - pesoAnterior
    return variacao
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200">
      <h1 className="text-4xl font-bold mb-6 opacity-35">Histórico de Desempenho</h1>

      <div
        className="bg-stone-700 shadow-2xl w-full rounded-md border-2 p-6"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        {/* Busca de Alunos */}
        {!alunoSelecionado && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Selecionar Aluno</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar aluno por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-stone-600 text-white rounded-md border border-stone-500 focus:outline-none focus:border-lime-500"
              />

              {searchTerm && (
                <div className="absolute top-full left-0 right-0 bg-stone-600 border border-stone-500 rounded-md mt-1 max-h-60 overflow-y-auto z-10">
                  {alunosFiltrados.length > 0 ? (
                    alunosFiltrados.map((aluno) => (
                      <div
                        key={aluno.id}
                        onClick={() => handleSelecionarAluno(aluno)}
                        className="px-4 py-3 hover:bg-stone-500 cursor-pointer border-b border-stone-500 last:border-b-0"
                      >
                        <div className="font-semibold">{aluno.nome}</div>
                        <div className="text-sm text-gray-300">{aluno.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-400">Nenhum aluno encontrado</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aluno Selecionado e Timeline */}
        {alunoSelecionado && (
          <div>
            {/* Header do Aluno */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{alunoSelecionado.nome}</h2>
                <p className="text-gray-300">{alunoSelecionado.email}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleNovoRegistro}
                  className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
                >
                  + Novo Registro
                </button>
                <button
                  onClick={() => setAlunoSelecionado(null)}
                  className="px-4 py-2 bg-stone-600 text-white rounded-md hover:bg-stone-500 transition-colors"
                >
                  Trocar Aluno
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="max-h-96 overflow-y-auto">
              {historicoAluno.length > 0 ? (
                <div className="relative">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-lime-500"></div>

                  <div className="space-y-6">
                    {historicoAluno.map((registro, index) => {
                      const registroAnterior = historicoAluno[index + 1]
                      const variacao = registroAnterior
                        ? calcularVariacaoPeso(registro.peso, registroAnterior.peso)
                        : null

                      return (
                        <div key={registro.id} className="relative flex items-start">
                          {/* Ponto da timeline */}
                          <div className="absolute left-6 w-4 h-4 bg-lime-500 rounded-full border-2 border-stone-700"></div>

                          {/* Card do registro */}
                          <div className="ml-16 bg-stone-600 rounded-lg p-4 w-full shadow-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-white">
                                  {new Date(registro.data).toLocaleDateString('pt-BR')}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className="text-2xl font-bold text-lime-400">
                                    {registro.peso} kg
                                  </span>
                                  {variacao !== null && (
                                    <span
                                      className={`text-sm font-medium ${
                                        variacao > 0
                                          ? 'text-red-400'
                                          : variacao < 0
                                            ? 'text-green-400'
                                            : 'text-gray-400'
                                      }`}
                                    >
                                      {variacao > 0 ? '+' : ''}
                                      {variacao.toFixed(1)} kg
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleEditarRegistro(registro)}
                                className="text-blue-400 hover:text-blue-300 text-sm"
                              >
                                Editar
                              </button>
                            </div>

                            <div className="mb-3">
                              <p className="text-gray-300">
                                <span className="text-gray-400">Treino:</span>{' '}
                                {registro.treinoAtual}
                              </p>
                            </div>

                            {/* Foto da balança */}
                            {registro.fotoBalanca && (
                              <div className="mt-3">
                                <p className="text-gray-400 text-sm mb-2">Foto da balança:</p>
                                <img
                                  src={registro.fotoBalanca}
                                  alt="Foto da balança"
                                  className="max-w-xs max-h-40 rounded-md border border-stone-500 cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(registro.fotoBalanca, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg mb-4">
                    Nenhum registro encontrado para este aluno
                  </p>
                  <button
                    onClick={handleNovoRegistro}
                    className="px-6 py-3 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
                  >
                    Criar Primeiro Registro
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Novo/Editar Registro */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelar}
        title={editingRegistro ? 'Editar Registro' : 'Novo Registro de Desempenho'}
        size="md"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelar}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="primary" onClick={handleSalvarRegistro}>
              {editingRegistro ? 'Atualizar' : 'Salvar'}
            </Modal.Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Data *</label>
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Peso (kg) *</label>
              <input
                type="number"
                name="peso"
                value={formData.peso}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="Ex: 75.5"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Treino Atual *</label>
            <input
              type="text"
              name="treinoAtual"
              value={formData.treinoAtual}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Ex: Treino A - Peito e Tríceps"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Foto da Balança</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
            />

            {formData.fotoBalanca && (
              <div className="mt-3">
                <p className="text-sm text-stone-600 mb-2">Preview:</p>
                <img
                  src={formData.fotoBalanca}
                  alt="Preview da foto"
                  className="max-w-full max-h-40 rounded-md border border-stone-300"
                />
              </div>
            )}
          </div>

          <div className="text-sm text-stone-500">* Campos obrigatórios</div>
        </form>
      </Modal>
    </div>
  )
}

export default Historico
