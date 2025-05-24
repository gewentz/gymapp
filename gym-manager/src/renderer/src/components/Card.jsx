function Card({ aluno, onEdit = null }) {
  const getStatusColor = (status) => {
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

  const formatarDiaAbreviado = (dia) => {
    const diasAbrev = {
      segunda: 'Seg',
      terca: 'Ter',
      quarta: 'Qua',
      quinta: 'Qui',
      sexta: 'Sex',
      sabado: 'Sáb',
      domingo: 'Dom'
    }
    return diasAbrev[dia] || dia
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

      {/* Horários de Treino */}
      <div className="mb-4">
        <span className="text-xs text-gray-400 mb-2 block">Horários de Treino:</span>
        {aluno.horariosTreino && aluno.horariosTreino.length > 0 ? (
          <div className="space-y-1">
            {aluno.horariosTreino
              .sort((a, b) => {
                const ordem = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
                return ordem.indexOf(a.dia) - ordem.indexOf(b.dia)
              })
              .map((horario, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-stone-700 rounded px-2 py-1"
                >
                  <span className="text-xs text-gray-300">{formatarDiaAbreviado(horario.dia)}</span>
                  <span className="text-xs text-lime-400 font-medium">{horario.horario}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">Nenhum horário definido</div>
        )}
      </div>

      {/* Dias de treino (visual alternativo - badges) */}
      <div className="mb-4">
        <span className="text-xs text-gray-400 mb-2 block">Dias de Treino:</span>
        <div className="flex flex-wrap gap-1">
          {aluno.diasTreino && aluno.diasTreino.length > 0 ? (
            aluno.diasTreino.map((dia) => (
              <span
                key={dia}
                className="px-2 py-1 bg-lime-600 text-white text-xs rounded-full font-medium"
              >
                {formatarDiaAbreviado(dia)}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">Nenhum</span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">
          {aluno.horariosTreino?.length || 0} horário(s) definido(s)
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
