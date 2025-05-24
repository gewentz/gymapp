import { useState } from 'react'
import Modal from '../components/Modal'

function Financeiro() {
  // Estado para transações do fluxo de caixa
  const [transacoes, setTransacoes] = useState([
    {
      id: 1,
      data: '2024-01-15',
      descricao: 'Mensalidade João Silva',
      valor: 150.0,
      tipo: 'entrada',
      categoria: 'Mensalidade'
    },
    {
      id: 2,
      data: '2024-01-16',
      descricao: 'Conta de luz',
      valor: 280.5,
      tipo: 'saida',
      categoria: 'Despesas'
    },
    {
      id: 3,
      data: '2024-01-17',
      descricao: 'Mensalidade Maria Santos',
      valor: 150.0,
      tipo: 'entrada',
      categoria: 'Mensalidade'
    },
    {
      id: 4,
      data: '2024-01-18',
      descricao: 'Compra equipamentos',
      valor: 500.0,
      tipo: 'saida',
      categoria: 'Equipamentos'
    }
  ])

  // Estado para faturas futuras
  const [faturas, setFaturas] = useState([
    {
      id: 1,
      descricao: 'Mensalidade Pedro Oliveira',
      valor: 150.0,
      dataVencimento: '2024-02-05',
      tipo: 'receber',
      status: 'pendente'
    },
    {
      id: 2,
      descricao: 'Aluguel do espaço',
      valor: 1200.0,
      dataVencimento: '2024-02-01',
      tipo: 'pagar',
      status: 'pendente'
    },
    {
      id: 3,
      descricao: 'Mensalidade Ana Costa',
      valor: 150.0,
      dataVencimento: '2024-02-10',
      tipo: 'receber',
      status: 'pendente'
    }
  ])

  const [isModalTransacaoOpen, setIsModalTransacaoOpen] = useState(false)
  const [isModalFaturaOpen, setIsModalFaturaOpen] = useState(false)
  const [editingTransacao, setEditingTransacao] = useState(null)
  const [editingFatura, setEditingFatura] = useState(null)

  // Estados dos formulários
  const [formTransacao, setFormTransacao] = useState({
    data: '',
    descricao: '',
    valor: '',
    tipo: 'entrada',
    categoria: ''
  })

  const [formFatura, setFormFatura] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    tipo: 'receber',
    status: 'pendente',
    numeroParcelas: 1,
    temParcelas: false
  })

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

  // Handlers para transações
  const handleInputTransacao = (e) => {
    const { name, value } = e.target
    setFormTransacao((prev) => ({
      ...prev,
      [name]: name === 'valor' ? parseFloat(value) || '' : value
    }))
  }

  const handleSaveTransacao = () => {
    if (!formTransacao.data || !formTransacao.descricao || !formTransacao.valor) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (editingTransacao) {
      setTransacoes((prev) =>
        prev.map((t) =>
          t.id === editingTransacao.id ? { ...editingTransacao, ...formTransacao } : t
        )
      )
    } else {
      const novaTransacao = {
        id: Math.max(...transacoes.map((t) => t.id)) + 1,
        ...formTransacao
      }
      setTransacoes((prev) => [...prev, novaTransacao])
    }

    handleCancelTransacao()
  }

  const handleCancelTransacao = () => {
    setFormTransacao({
      data: '',
      descricao: '',
      valor: '',
      tipo: 'entrada',
      categoria: ''
    })
    setEditingTransacao(null)
    setIsModalTransacaoOpen(false)
  }

  // Handlers para faturas
  const handleInputFatura = (e) => {
    const { name, value } = e.target
    setFormFatura((prev) => ({
      ...prev,
      [name]: name === 'valor' ? parseFloat(value) || '' : value
    }))
  }

  const handleSaveFatura = () => {
    if (!formFatura.descricao || !formFatura.valor || !formFatura.dataVencimento) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    if (editingFatura) {
      setFaturas((prev) =>
        prev.map((f) => (f.id === editingFatura.id ? { ...editingFatura, ...formFatura } : f))
      )
    } else {
      if (formFatura.temParcelas && formFatura.numeroParcelas > 1) {
        // Criar múltiplas faturas (parcelas)
        const valorParcela = formFatura.valor / formFatura.numeroParcelas
        const novasFaturas = []

        for (let i = 0; i < formFatura.numeroParcelas; i++) {
          const dataVencimento = new Date(formFatura.dataVencimento)
          dataVencimento.setMonth(dataVencimento.getMonth() + i)

          const novaFatura = {
            id: Math.max(...faturas.map((f) => f.id), 0) + i + 1,
            descricao: `${formFatura.descricao} (${i + 1}/${formFatura.numeroParcelas})`,
            valor: valorParcela,
            dataVencimento: dataVencimento.toISOString().split('T')[0],
            tipo: formFatura.tipo,
            status: formFatura.status,
            parcela: i + 1,
            totalParcelas: formFatura.numeroParcelas
          }

          novasFaturas.push(novaFatura)
        }

        setFaturas((prev) => [...prev, ...novasFaturas])
      } else {
        // Criar fatura única
        const novaFatura = {
          id: Math.max(...faturas.map((f) => f.id), 0) + 1,
          ...formFatura,
          numeroParcelas: undefined,
          temParcelas: undefined
        }
        setFaturas((prev) => [...prev, novaFatura])
      }
    }

    handleCancelFatura()
  }

  const handleCancelFatura = () => {
    setFormFatura({
      descricao: '',
      valor: '',
      dataVencimento: '',
      tipo: 'receber',
      status: 'pendente',
      numeroParcelas: 1,
      temParcelas: false
    })
    setEditingFatura(null)
    setIsModalFaturaOpen(false)
  }

  const { entradas, saidas } = calcularTotais()

  // Adicionar esta função após as outras funções de handler
  const handleMarcarContaPaga = (fatura) => {
    // Atualizar status da fatura
    setFaturas((prev) => prev.map((f) => (f.id === fatura.id ? { ...f, status: 'pago' } : f)))

    // Criar transação no fluxo de caixa
    const novaTransacao = {
      id: Math.max(...transacoes.map((t) => t.id)) + 1,
      data: new Date().toISOString().split('T')[0], // Data atual
      descricao: fatura.descricao,
      valor: fatura.valor,
      tipo: fatura.tipo === 'receber' ? 'entrada' : 'saida',
      categoria: fatura.tipo === 'receber' ? 'Recebimento' : 'Pagamento'
    }

    setTransacoes((prev) => [...prev, novaTransacao])
  }

  return (
    <div className="h-screen w-full p-6 text-gray-200">
      <h1 className="text-4xl font-bold mb-6 opacity-35">Financeiro</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Cards de resumo */}
        <div className="bg-green-600 rounded-lg p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Entradas</h3>
          <p className="text-2xl font-bold">R$ {entradas.toFixed(2)}</p>
        </div>

        <div className="bg-red-600 rounded-lg p-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Saídas</h3>
          <p className="text-2xl font-bold">R$ {saidas.toFixed(2)}</p>
        </div>

        <div
          className={`rounded-lg p-4 shadow-lg ${calcularSaldo() >= 0 ? 'bg-blue-600' : 'bg-orange-600'}`}
        >
          <h3 className="text-lg font-semibold mb-2">Saldo Atual</h3>
          <p className="text-2xl font-bold">R$ {calcularSaldo().toFixed(2)}</p>
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
                      className="bg-stone-600 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-white">{transacao.descricao}</h4>
                          <span
                            className={`font-bold ${transacao.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {transacao.tipo === 'entrada' ? '+' : '-'} R${' '}
                            {transacao.valor.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-300">
                          <span>{new Date(transacao.data).toLocaleDateString('pt-BR')}</span>
                          <span className="bg-stone-500 px-2 py-1 rounded text-xs">
                            {transacao.categoria}
                          </span>
                        </div>
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
                    <div key={fatura.id} className="bg-stone-600 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{fatura.descricao}</h4>
                        <span
                          className={`font-bold ${fatura.tipo === 'receber' ? 'text-green-400' : 'text-red-400'}`}
                        >
                          R$ {fatura.valor.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-3">
                        <span className="text-gray-300">
                          Vence: {new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}
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
                        </div>
                      </div>

                      {/* Botão para marcar como pago/recebido */}
                      {fatura.status === 'pendente' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleMarcarContaPaga(fatura)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              fatura.tipo === 'receber'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {fatura.tipo === 'receber' ? 'Conta Recebida' : 'Conta Paga'}
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
        title="Nova Transação"
        size="md"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelTransacao}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="primary" onClick={handleSaveTransacao}>
              Salvar
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
        </form>
      </Modal>

      {/* Modal Nova Fatura */}
      <Modal
        isOpen={isModalFaturaOpen}
        onClose={handleCancelFatura}
        title="Nova Fatura"
        size="lg"
        footer={
          <>
            <Modal.Button variant="outline" onClick={handleCancelFatura}>
              Cancelar
            </Modal.Button>
            <Modal.Button variant="primary" onClick={handleSaveFatura}>
              Salvar
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
                Data do Primeiro Vencimento *
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

          {/* Seção de Parcelas */}
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
                      <strong>Valor por parcela:</strong> R${' '}
                      {formFatura.valor && formFatura.numeroParcelas
                        ? (formFatura.valor / formFatura.numeroParcelas).toFixed(2)
                        : '0,00'}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      Vencimentos mensais a partir da data informada
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Financeiro
