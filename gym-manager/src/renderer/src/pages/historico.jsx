import { useState, useEffect } from 'react'
import Modal from '../components/Modal'

function Historico() {
  const [alunos, setAlunos] = useState([])
  const [historicos, setHistoricos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [alunoSelecionado, setAlunoSelecionado] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  // Estado do formulário
  const [formData, setFormData] = useState({
    data: '',
    peso: '',
    treinoAtual: '',
    fotoBalanca: null
  })

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [alunosData, historicosData] = await Promise.all([
        window.api.alunos.getAll(),
        window.api.historicos.getAll()
      ])
      setAlunos(alunosData)
      setHistoricos(historicosData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar alunos baseado na busca
  const alunosFiltrados = alunos.filter(
    (aluno) =>
      aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obter histórico do aluno selecionado
  const historicoAluno = alunoSelecionado
    ? historicos
        .filter((h) => h.aluno_id === alunoSelecionado.id)
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

  // Nova função para remover a foto
  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      fotoBalanca: null
    }))
    // Limpar o input file
    const fileInput = document.getElementById('fotoBalanca')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSelecionarAluno = (aluno) => {
    setAlunoSelecionado(aluno)
    setSearchTerm('')
  }

  const handleNovoRegistro = async () => {
    setEditingRegistro(null)
    const dataAtual = await window.api.utils.getCurrentDateBrazil()
    setFormData({
      data: dataAtual,
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

  const handleSalvarRegistro = async () => {
    if (!formData.data || !formData.peso || !formData.treinoAtual) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (!alunoSelecionado) {
      alert('Selecione um aluno primeiro')
      return
    }

    try {
      const historicoData = {
        aluno_id: alunoSelecionado.id,
        data: formData.data,
        peso: parseFloat(formData.peso),
        treinoAtual: formData.treinoAtual,
        fotoBalanca: formData.fotoBalanca
      }

      if (editingRegistro) {
        // Editando registro existente
        await window.api.historicos.update(editingRegistro.id, historicoData)
        alert('Registro atualizado com sucesso!')
      } else {
        // Novo registro
        await window.api.historicos.create(historicoData)
        alert('Registro criado com sucesso!')
      }

      // Recarregar dados
      await loadData()
      handleCancelar()
    } catch (error) {
      console.error('Erro ao salvar registro:', error)
      alert('Erro ao salvar registro. Tente novamente.')
    }
  }

  const handleDeletarRegistro = async (registro) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await window.api.historicos.delete(registro.id)
        alert('Registro excluído com sucesso!')
        await loadData()
      } catch (error) {
        console.error('Erro ao excluir registro:', error)
        alert('Erro ao excluir registro. Tente novamente.')
      }
    }
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

  // Nova função para abrir imagem em modal
  const handleOpenImage = (imageSrc) => {
    setSelectedImage(imageSrc)
    setIsImageModalOpen(true)
  }

  // Nova função para fechar modal de imagem
  const handleCloseImageModal = () => {
    setSelectedImage(null)
    setIsImageModalOpen(false)
  }

  if (loading) {
    return (
      <div className="h-screen w-full p-6 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lime-500 mx-auto mb-4"></div>
          <p className="text-lg">Carregando históricos...</p>
        </div>
      </div>
    )
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
                                  {new Date(registro.data + 'T00:00:00').toLocaleDateString('pt-BR')}
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
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditarRegistro(registro)}
                                  className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeletarRegistro(registro)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Excluir
                                </button>
                              </div>
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
                                  className="max-w-xs max-h-40 rounded-md border border-stone-500 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleOpenImage(registro.fotoBalanca)}
                                  title="Clique para ampliar"
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
              id="fotoBalanca"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
            />

            {formData.fotoBalanca && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-stone-600">Preview:</p>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    Remover Foto
                  </button>
                </div>
                <div className="relative">
                  <img
                    src={formData.fotoBalanca}
                    alt="Preview da foto"
                    className="max-w-full max-h-40 rounded-md border border-stone-300 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleOpenImage(formData.fotoBalanca)}
                    title="Clique para ampliar"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                    title="Remover foto"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-stone-500">* Campos obrigatórios</div>
        </form>
      </Modal>

      {/* Modal para visualizar imagem ampliada */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all z-10"
              title="Fechar"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Foto da balança ampliada"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Historico
