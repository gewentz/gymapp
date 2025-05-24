function Card({ aluno, onEdit = null }) {
  const getStatusColor = (status) => {
    console.log('Data no Card:', aluno.nascimento, 'Tipo:', typeof aluno.nascimento)
    return status === 'Ativo' ? 'text-green-400' : 'text-red-400'
  }

  const handleEdit = () => {
    if (onEdit && typeof onEdit === 'function') {
      onEdit(aluno)
    }
  }

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

  return (
    <div className="bg-stone-600 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow border border-stone-500">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-white truncate">{aluno.nome}</h3>
        <span className={`text-sm font-medium ${getStatusColor(aluno.status)}`}>
          {aluno.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-300 text-sm">
          <span className="text-gray-400">Email:</span> {aluno.email}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="text-gray-400">Telefone:</span> {aluno.telefone}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="text-gray-400">Idade:</span> {calcularIdade(aluno.nascimento)} anos
        </p>
        <p className="text-gray-300 text-sm">
          <span className="text-gray-400">Nascimento:</span>{' '}
          {aluno.nascimento.split('-').reverse().join('/')}
        </p>
        <p className="text-gray-300 text-sm">
          <span className="text-gray-400">Matrícula:</span> {aluno.dataMatricula}
        </p>
      </div>

      <div className="flex justify-between items-center">
        {/* Dias de treino */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 mb-1">Dias de Treino:</span>
          <div className="flex gap-1">
            {aluno.diasTreino && aluno.diasTreino.length > 0 ? (
              aluno.diasTreino.map((dia) => {
                const diasAbrev = {
                  segunda: 'Seg',
                  terca: 'Ter',
                  quarta: 'Qua',
                  quinta: 'Qui',
                  sexta: 'Sex',
                  sabado: 'Sáb',
                  domingo: 'Dom'
                }

                return (
                  <span
                    key={dia}
                    className="w-6 h-6 bg-lime-600 text-white text-xs rounded-full flex items-center justify-center font-medium"
                  >
                    {diasAbrev[dia]}
                  </span>
                )
              })
            ) : (
              <span className="text-xs text-gray-500">Nenhum</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleEdit} className="text-blue-400 hover:text-blue-300 text-sm">
            Editar
          </button>
          <button className="text-red-400 hover:text-red-300 text-sm">Excluir</button>
        </div>
      </div>
    </div>
  )
}

export default Card
