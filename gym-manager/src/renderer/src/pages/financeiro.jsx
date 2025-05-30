import { useState, useEffect } from 'react'
import Modal from '../components/Modal'

function Financeiro() {
  const [transacoes, setTransacoes] = useState([])
  const [faturas, setFaturas] = useState([])
  const [alunos, setAlunos] = useState([])
  const [loading, setLoading] = useState(true)

  const [isModalTransacaoOpen, setIsModalTransacaoOpen] = useState(false)
  const [isModalFaturaOpen, setIsModalFaturaOpen] = useState(false)
  const [isModalZerarOpen, setIsModalZerarOpen] = useState(false)
  const [isModalConfirmDeleteOpen, setIsModalConfirmDeleteOpen] = useState(false)
  const [editingTransacao, setEditingTransacao] = useState(null)
  const [editingFatura, setEditingFatura] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null) // { type: 'transacao' | 'fatura', item: object }

  // Estados para confirmação de zerar dados
  const [confirmacaoZerar, setConfirmacaoZerar] = useState({
    etapa: 1, // 1 = primeira confirmação, 2 = segunda confirmação
    tipo: '', // 'tudo', 'transacoes', 'faturas'
    textoConfirmacao: ''
  })

  // Estados dos formulários
  const [formTransacao, setFormTransacao] = useState({
    data: '',
    descricao: '',
    valor: '',
    tipo: 'entrada',
    categoria: '',
    aluno_id: ''
  })

  const [formFatura, setFormFatura] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    tipo: 'receber',
    status: 'pendente',
    categoria: '',
    aluno_id: '',
    numeroParcelas: 1,
    temParcelas: false
  })

  const formatDateBR = (dateString) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
  }

  // Carregar dados iniciais
  useEffect(() => {
    // Verificar se as APIs estão disponíveis
    if (!window.api || !window.api.transacoes || !window.api.faturas) {
      console.error('APIs não disponíveis. Reinicie o aplicativo.')
      setLoading(false)
      return
    }

    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Verificar novamente se as APIs estão disponíveis
      if (
        !window.api?.transacoes?.getAll ||
        !window.api?.faturas?.getAll ||
        !window.api?.alunos?.getAll
      ) {
        throw new Error('APIs não estão disponíveis')
      }

      const [transacoesData, faturasData, alunosData] = await Promise.all([
        window.api.transacoes.getAll(),
        window.api.faturas.getAll(),
        window.api.alunos.getAll()
      ])

      setTransacoes(transacoesData || [])
      setFaturas(faturasData || [])
      setAlunos(alunosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)

      alert(
        'Erro ao carregar dados financeiros. Verifique se o aplicativo foi reiniciado após as alterações.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Calcular saldo total
  const calcularSaldo = () => {
    return transacoes.reduce((saldo, transacao) => {
      return transacao.tipo === 'entrada' ? saldo + transacao.valor : saldo - transacao.valor
    }, 0)
  }

  // Calcular totais de entrada e saída
  const calcularTotais = () => {
    const entradas = transacoes
      .filter((t) => t.tipo === 'entrada')
      .reduce((total, t) => total + t.valor, 0)

    const saidas = transacoes
      .filter((t) => t.tipo === 'saida')
      .reduce((total, t) => total + t.valor, 0)

    return { entradas, saidas }
  }

  // Handlers para exclusão de itens específicos
  const handleDeleteItem = (type, item) => {
    setItemToDelete({ type, item })
    setIsModalConfirmDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const { type, item } = itemToDelete

      if (type === 'transacao') {
        await window.api.transacoes.delete(item.id)
      } else if (type === 'fatura') {
        await window.api.faturas.delete(item.id)
      }

      await loadData()
      setIsModalConfirmDeleteOpen(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      alert('Erro ao excluir item')
    }
  }

  const handleCancelDelete = () => {
    setIsModalConfirmDeleteOpen(false)
    setItemToDelete(null)
  }

  // Handlers para edição
  const handleEditTransacao = (transacao) => {
    setFormTransacao({
      data: transacao.data,
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      categoria: transacao.categoria || '',
      aluno_id: transacao.aluno_id || ''
    })
    setEditingTransacao(transacao)
    setIsModalTransacaoOpen(true)
  }

  const handleEditFatura = (fatura) => {
    setFormFatura({
      descricao: fatura.descricao,
      valor: fatura.valor.toString(),
      dataVencimento: fatura.dataVencimento,
      tipo: fatura.tipo,
      status: fatura.status,
      categoria: fatura.categoria || '',
      aluno_id: fatura.aluno_id || '',
      numeroParcelas: 1,
      temParcelas: false
    })
    setEditingFatura(fatura)
    setIsModalFaturaOpen(true)
  }

  // Handlers para transações
  const handleInputTransacao = (e) => {
    const { name, value } = e.target
    setFormTransacao((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveTransacao = async () => {
    if (!formTransacao.data || !formTransacao.descricao || !formTransacao.valor) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const transacaoData = {
        ...formTransacao,
        valor: parseFloat(formTransacao.valor) || 0,
        aluno_id: formTransacao.aluno_id || null
      }

      if (editingTransacao) {
        await window.api.transacoes.update(editingTransacao.id, transacaoData)
      } else {
        await window.api.transacoes.create(transacaoData)
      }

      await loadData()
      handleCancelTransacao()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação')
    }
  }

  const handleCancelTransacao = () => {
    setFormTransacao({
      data: '',
      descricao: '',
      valor: '',
      tipo: 'entrada',
      categoria: '',
      aluno_id: ''
    })
    setEditingTransacao(null)
    setIsModalTransacaoOpen(false)
  }

  // Handlers para faturas
  const handleInputFatura = (e) => {
    const { name, value } = e.target
    setFormFatura((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveFatura = async () => {
    if (!formFatura.descricao || !formFatura.valor || !formFatura.dataVencimento) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const valor = parseFloat(formFatura.valor) || 0

      if (editingFatura) {
        const faturaData = {
          ...formFatura,
          valor,
          aluno_id: formFatura.aluno_id || null
        }
        await window.api.faturas.update(editingFatura.id, faturaData)
      } else {
        if (formFatura.temParcelas && formFatura.numeroParcelas > 1) {
          // Criar múltiplas faturas (parcelas)
          const valorParcela = valor / formFatura.numeroParcelas

          for (let i = 0; i < formFatura.numeroParcelas; i++) {
            const dataVencimento = new Date(formFatura.dataVencimento)
            dataVencimento.setMonth(dataVencimento.getMonth() + i)

            const faturaData = {
              descricao: `${formFatura.descricao} (${i + 1}/${formFatura.numeroParcelas})`,
              valor: valorParcela,
              dataVencimento: dataVencimento.toISOString().split('T')[0],
              tipo: formFatura.tipo,
              status: formFatura.status,
              categoria: formFatura.categoria,
              aluno_id: formFatura.aluno_id || null,
              parcela: i + 1,
              totalParcelas: formFatura.numeroParcelas
            }

            await window.api.faturas.create(faturaData)
          }
        } else {
          // Criar fatura única
          const faturaData = {
            ...formFatura,
            valor,
            aluno_id: formFatura.aluno_id || null
          }
          await window.api.faturas.create(faturaData)
        }
      }

      await loadData()
      handleCancelFatura()
    } catch (error) {
      console.error('Erro ao salvar fatura:', error)
      alert('Erro ao salvar fatura')
    }
  }

  const handleCancelFatura = () => {
    setFormFatura({
      descricao: '',
      valor: '',
      dataVencimento: '',
      tipo: 'receber',
      status: 'pendente',
      categoria: '',
      aluno_id: '',
      numeroParcelas: 1,
      temParcelas: false
    })
    setEditingFatura(null)
    setIsModalFaturaOpen(false)
  }

  const handleMarcarContaPaga = async (fatura) => {
    try {
      await window.api.faturas.marcarPaga(fatura.id)
      await loadData()
    } catch (error) {
      console.error('Erro ao marcar conta como paga:', error)
      alert('Erro ao marcar conta como paga')
    }
  }

  const handleGerarMensalidades = async () => {
    try {
      const faturasCriadas = await window.api.faturas.gerarMensalidades()
      if (faturasCriadas.length > 0) {
        alert(`${faturasCriadas.length} faturas de mensalidade geradas com sucesso!`)
        await loadData()
      } else {
        alert('Nenhuma nova fatura de mensalidade foi gerada.')
      }
    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error)
      alert('Erro ao gerar faturas de mensalidade')
    }
  }

  // Handlers para zerar dados
  const handleIniciarZerar = (tipo) => {
    let titulo = ''
    let textoConfirmacao = ''

    switch (tipo) {
      case 'tudo':
        titulo = 'ZERAR TODOS OS DADOS FINANCEIROS'
        textoConfirmacao = 'ZERAR TUDO'
        break
      case 'transacoes':
        titulo = 'ZERAR FLUXO DE CAIXA'
        textoConfirmacao = 'ZERAR CAIXA'
        break
      case 'faturas':
        titulo = 'ZERAR FATURAS'
        textoConfirmacao = 'ZERAR FATURAS'
        break
    }

    setConfirmacaoZerar({
      etapa: 1,
      tipo,
      titulo,
      textoConfirmacao: textoConfirmacao,
      textoDigitado: ''
    })
    setIsModalZerarOpen(true)
  }

  const handleConfirmarZerar = async () => {
    if (confirmacaoZerar.etapa === 1) {
      // Primeira confirmação - avançar para segunda etapa
      setConfirmacaoZerar((prev) => ({
        ...prev,
        etapa: 2,
        textoDigitado: ''
      }))
    } else {
      // Segunda confirmação - verificar texto e executar
      if (confirmacaoZerar.textoDigitado !== confirmacaoZerar.textoConfirmacao) {
        alert('Texto de confirmação incorreto!')
        return
      }

      try {
        switch (confirmacaoZerar.tipo) {
          case 'tudo':
            await Promise.all([window.api.transacoes.deleteAll(), window.api.faturas.deleteAll()])
            alert('Todos os dados financeiros foram zerados!')
            break
          case 'transacoes':
            await window.api.transacoes.deleteAll()
            alert('Fluxo de caixa zerado!')
            break
          case 'faturas':
            await window.api.faturas.deleteAll()
            alert('Faturas zeradas!')
            break
        }

        await loadData()
        handleCancelZerar()
      } catch (error) {
        console.error('Erro ao zerar dados:', error)
        alert('Erro ao zerar dados!')
      }
    }
  }

  const handleCancelZerar = () => {
    setConfirmacaoZerar({
      etapa: 1,
      tipo: '',
      titulo: '',
      textoConfirmacao: '',
      textoDigitado: ''
    })
    setIsModalZerarOpen(false)
  }

  const { entradas, saidas } = calcularTotais()

  if (loading) {
    return (
      <div className="h-screen w-full p-6 text-gray-200 flex items-center justify-center">
        <div className="text-xl">Carregando dados financeiros...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold opacity-35">Financeiro</h1>

        <div className="flex gap-3">
          <button
            onClick={handleGerarMensalidades}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Gerar Mensalidades
          </button>

          {/* Dropdown para zerar dados */}
          <div className="relative group">
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              ⚠️ Zerar Dados
            </button>

            {/* Menu dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-stone-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => handleIniciarZerar('transacoes')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-stone-700 transition-colors"
                >
                  🗑️ Zerar Fluxo de Caixa
                </button>
                <button
                  onClick={() => handleIniciarZerar('faturas')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-stone-700 transition-colors"
                >
                  🗑️ Zerar Faturas
                </button>
                <hr className="border-stone-600 my-1" />
                <button
                  onClick={() => handleIniciarZerar('tudo')}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-stone-700 transition-colors font-semibold"
                >
                  💥 Zerar Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cards de resumo */}
        <div className="bg-green-600 rounded-lg p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Entradas</h3>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(entradas)}
          </p>
        </div>

        <div className="bg-red-600 rounded-lg p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Saídas</h3>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(saidas)}
          </p>
        </div>

        <div
          className={`rounded-lg p-4 shadow-lg ${calcularSaldo() >= 0 ? 'bg-blue-600' : 'bg-orange-600'}`}
        >
          <h3 className="text-lg font-semibold mb-2">Saldo Atual</h3>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(calcularSaldo())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fluxo de Caixa */}
        <div className="bg-stone-700 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Fluxo de Caixa</h2>
            <button
              onClick={() => setIsModalTransacaoOpen(true)}
              className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
            >
              + Nova Transação
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {transacoes.length > 0 ? (
              <div className="space-y-2">
                {transacoes
                  .sort((a, b) => new Date(b.data) - new Date(a.data))
                  .map((transacao) => (
                    <div
                      key={transacao.id}
                      className="bg-stone-600 rounded-lg p-3 flex justify-between items-center group hover:bg-stone-500 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-white">{transacao.descricao}</h4>
                          <span
                            className={`font-bold ${transacao.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {transacao.tipo === 'entrada' ? '+' : '-'}{' '}
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(transacao.valor)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-300">
                          <span>{formatDateBR(transacao.data)}</span>
                          <div className="flex gap-2">
                            {transacao.categoria && (
                              <span className="bg-stone-500 px-2 py-1 rounded text-xs">
                                {transacao.categoria}
                              </span>
                            )}
                            {transacao.aluno_nome && (
                              <span className="bg-blue-500 px-2 py-1 rounded text-xs">
                                {transacao.aluno_nome}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditTransacao(transacao)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteItem('transacao', transacao)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma transação registrada</p>
            )}
          </div>
        </div>

        {/* Faturas e Contas */}
        <div className="bg-stone-700 rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Faturas e Contas</h2>
            <button
              onClick={() => setIsModalFaturaOpen(true)}
              className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors"
            >
              + Nova Fatura
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {faturas.length > 0 ? (
              <div className="space-y-2">
                {faturas
                  .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))
                  .map((fatura) => (
                    <div key={fatura.id} className="bg-stone-600 rounded-lg p-3 group hover:bg-stone-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{fatura.descricao}</h4>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${fatura.tipo === 'receber' ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(fatura.valor)}
                          </span>

                          {/* Botões de ação */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditFatura(fatura)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="Editar"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteItem('fatura', fatura)}
                              className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              title="Excluir"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-3">
                        <span className="text-gray-300">
                          Vence: {formatDateBR(fatura.dataVencimento)}
                        </span>
                        <div className="flex gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              fatura.tipo === 'receber' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          >
                            {fatura.tipo === 'receber' ? 'A Receber' : 'A Pagar'}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              fatura.status === 'pendente' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}
                          >
                            {fatura.status === 'pendente' ? 'Pendente' : 'Pago'}
                          </span>
                          {fatura.categoria && (
                            <span className="bg-stone-500 px-2 py-1 rounded text-xs">
                              {fatura.categoria}
                            </span>
                          )}
                        </div>
                      </div>

                      {fatura.aluno_nome && (
                        <div className="mb-2">
                          <span className="bg-blue-500 px-2 py-1 rounded text-xs">
                            {fatura.aluno_nome}
                          </span>
                        </div>
                      )}

                      {/* Botão para marcar como pago/recebido */}
                      {fatura.status === 'pendente' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleMarcarContaPaga(fatura)}
                            className={`px-3 py-1 hover:cursor-pointer rounded text-sm font-medium transition-colors ${
                              fatura.tipo === 'receber'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {fatura.tipo === 'receber' ? 'Marcar Recebido' : 'Marcar Pago'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma fatura cadastrada</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Transação */}
      <Modal
        isOpen={isModalTransacaoOpen}
        onClose={handleCancelTransacao}
        title={editingTransacao ? "Editar Transação" : "Nova Transação"}
        size="md"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelTransacao}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="primary" onClick={handleSaveTransacao}>
              {editingTransacao ? "Atualizar" : "Salvar"}
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
                value={formTransacao.data}
                onChange={handleInputTransacao}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Valor *</label>
              <input
                type="number"
                name="valor"
                value={formTransacao.valor}
                onChange={handleInputTransacao}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição *</label>
            <input
              type="text"
              name="descricao"
              value={formTransacao.descricao}
              onChange={handleInputTransacao}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Descrição da transação"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tipo *</label>
              <select
                name="tipo"
                value={formTransacao.tipo}
                onChange={handleInputTransacao}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
              <input
                type="text"
                name="categoria"
                value={formTransacao.categoria}
                onChange={handleInputTransacao}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="Ex: Mensalidade, Despesas..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Aluno (opcional)
            </label>
            <select
              name="aluno_id"
              value={formTransacao.aluno_id}
              onChange={handleInputTransacao}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="">Selecione um aluno (opcional)</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Modal Nova Fatura */}
      <Modal
        isOpen={isModalFaturaOpen}
        onClose={handleCancelFatura}
        title={editingFatura ? "Editar Fatura" : "Nova Fatura"}
        size="lg"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelFatura}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="primary" onClick={handleSaveFatura}>
              {editingFatura ? "Atualizar" : "Salvar"}
            </Modal.Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Descrição *</label>
            <input
              type="text"
              name="descricao"
              value={formFatura.descricao}
              onChange={handleInputFatura}
              className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Descrição da fatura"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Valor Total *</label>
              <input
                type="number"
                name="valor"
                value={formFatura.valor}
                onChange={handleInputFatura}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Data do {editingFatura ? "Vencimento" : "Primeiro Vencimento"} *
              </label>
              <input
                type="date"
                name="dataVencimento"
                value={formFatura.dataVencimento}
                onChange={handleInputFatura}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Tipo *</label>
              <select
                name="tipo"
                value={formFatura.tipo}
                onChange={handleInputFatura}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="receber">A Receber</option>
                <option value="pagar">A Pagar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Status</label>
              <select
                name="status"
                value={formFatura.status}
                onChange={handleInputFatura}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Categoria</label>
              <input
                type="text"
                name="categoria"
                value={formFatura.categoria}
                onChange={handleInputFatura}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                placeholder="Ex: Mensalidade, Aluguel..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Aluno (opcional)
              </label>
              <select
                name="aluno_id"
                value={formFatura.aluno_id}
                onChange={handleInputFatura}
                className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="">Selecione um aluno (opcional)</option>
                {alunos.map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seção de Parcelas - apenas para novas faturas */}
          {!editingFatura && (
            <div className="border-t border-stone-300 pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="temParcelas"
                  name="temParcelas"
                  checked={formFatura.temParcelas}
                  onChange={(e) =>
                    setFormFatura((prev) => ({
                      ...prev,
                      temParcelas: e.target.checked,
                      numeroParcelas: e.target.checked ? prev.numeroParcelas : 1
                    }))
                  }
                  className="mr-2 h-4 w-4 text-lime-600 focus:ring-lime-500 border-stone-300 rounded"
                />
                <label htmlFor="temParcelas" className="text-sm font-medium text-stone-700">
                  Dividir em parcelas
                </label>
              </div>

              {formFatura.temParcelas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Número de Parcelas
                    </label>
                    <input
                      type="number"
                      name="numeroParcelas"
                      value={formFatura.numeroParcelas}
                      onChange={handleInputFatura}
                      min="2"
                      max="60"
                      className="w-full px-3 py-2 border border-stone-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="bg-stone-100 p-3 rounded-md">
                      <p className="text-sm text-stone-600">
                        <strong>Valor por parcela:</strong>{' '}
                        {formFatura.valor && formFatura.numeroParcelas
                          ? new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(parseFloat(formFatura.valor) / formFatura.numeroParcelas)
                          : 'R$ 0,00'}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Vencimentos mensais a partir da data informada
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal
        isOpen={isModalConfirmDeleteOpen}
        onClose={handleCancelDelete}
        title="Confirmar Exclusão"
        size="md"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelDelete}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="danger" onClick={handleConfirmDelete}>
              Excluir
            </Modal.Button>
          </>
        }
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🗑️</div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4">
            Tem certeza que deseja excluir este item?
          </h3>

          {itemToDelete && (
            <div className="bg-stone-100 border border-stone-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-stone-800">
                {itemToDelete.type === 'transacao' ? 'Transação:' : 'Fatura:'}
              </p>
              <p className="text-stone-600">{itemToDelete.item.descricao}</p>
              <p className="text-stone-600">
                Valor: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(itemToDelete.item.valor)}
              </p>
              {itemToDelete.type === 'transacao' && (
                <p className="text-stone-600">
                  Data: {formatDateBR(itemToDelete.item.data)}
                </p>
              )}
              {itemToDelete.type === 'fatura' && (
                <p className="text-stone-600">
                  Vencimento: {formatDateBR(itemToDelete.item.dataVencimento)}
                </p>
              )}
            </div>
          )}

          <p className="text-stone-600 text-sm">
            Esta ação não pode ser desfeita.
          </p>
        </div>
      </Modal>

      {/* Modal Zerar Dados */}
      <Modal
        isOpen={isModalZerarOpen}
        onClose={handleCancelZerar}
        title={`⚠️ ${confirmacaoZerar.titulo}`}
        size="md"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelZerar}>
              Cancelar
            </Modal.Button>
            <Modal.Button
              variant="danger"
              onClick={handleConfirmarZerar}
              disabled={
                confirmacaoZerar.etapa === 2 &&
                confirmacaoZerar.textoDigitado !== confirmacaoZerar.textoConfirmacao
              }
            >
              {confirmacaoZerar.etapa === 1 ? 'Continuar' : 'CONFIRMAR EXCLUSÃO'}
            </Modal.Button>
          </>
        }
      >
        <div className="space-y-4">
          {confirmacaoZerar.etapa === 1 ? (
            // Primeira confirmação
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-600 mb-4">ATENÇÃO: AÇÃO IRREVERSÍVEL!</h3>

              {confirmacaoZerar.tipo === 'tudo' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">
                    Você está prestes a ZERAR TODOS os dados financeiros:
                  </p>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Todas as transações do fluxo de caixa</li>
                    <li>• Todas as faturas e contas</li>
                    <li>• Todo o histórico financeiro</li>
                  </ul>
                </div>
              )}

              {confirmacaoZerar.tipo === 'transacoes' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">
                    Você está prestes a ZERAR o fluxo de caixa:
                  </p>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Todas as transações de entrada</li>
                    <li>• Todas as transações de saída</li>
                    <li>• Todo o histórico do fluxo de caixa</li>
                  </ul>
                </div>
              )}

              {confirmacaoZerar.tipo === 'faturas' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold mb-2">
                    Você está prestes a ZERAR todas as faturas:
                  </p>
                  <ul className="text-red-700 text-sm space-y-1">
                    <li>• Todas as faturas a receber</li>
                    <li>• Todas as faturas a pagar</li>
                    <li>• Todo o histórico de faturas</li>
                  </ul>
                </div>
              )}

              <p className="text-stone-600 text-sm">
                Esta ação NÃO PODE ser desfeita. Tem certeza que deseja continuar?
              </p>
            </div>
          ) : (
            // Segunda confirmação
            <div className="text-center">
              <div className="text-6xl mb-4">🔥</div>
              <h3 className="text-xl font-bold text-red-600 mb-4">CONFIRMAÇÃO FINAL</h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-semibold mb-3">
                  Para confirmar a exclusão, digite exatamente:
                </p>
                <div className="bg-red-100 border border-red-300 rounded px-3 py-2 mb-3">
                  <code className="text-red-800 font-bold text-lg">
                    {confirmacaoZerar.textoConfirmacao}
                  </code>
                </div>
              </div>

              <input
                type="text"
                value={confirmacaoZerar.textoDigitado}
                onChange={(e) =>
                  setConfirmacaoZerar((prev) => ({
                    ...prev,
                    textoDigitado: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border border-red-300 text-stone-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-mono"
                placeholder="Digite o texto de confirmação..."
                autoFocus
              />

              {confirmacaoZerar.textoDigitado &&
                confirmacaoZerar.textoDigitado !== confirmacaoZerar.textoConfirmacao && (
                  <p className="text-red-500 text-sm mt-2">❌ Texto incorreto</p>
                )}

              {confirmacaoZerar.textoDigitado === confirmacaoZerar.textoConfirmacao && (
                <p className="text-green-600 text-sm mt-2">✅ Texto correto - Pode prosseguir</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Financeiro
