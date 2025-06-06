import DatabaseLib from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getCurrentDate, getCurrentDateBrazil, getDateBrazil } from './utils/dbUtils.js'

// Caminho para o banco de dados
const dbPath = path.join(app.getPath('userData'), 'gymapp.db')

// Garantir que o diretório existe
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

class Database {
  constructor() {
    this.db = null
  }

  // Conectar ao banco de dados
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.db = new DatabaseLib(dbPath)
        this.initTables().then(resolve).catch(reject)
      } catch (err) {
        console.error('Erro ao conectar com o banco de dados:', err)
        reject(err)
      }
    })
  }

  // Inicializar tabelas
  initTables() {
    return new Promise((resolve, reject) => {
      try {
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            nascimento TEXT,
            telefone TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            diasTreino TEXT,
            horariosTreino TEXT,
            status TEXT DEFAULT 'Ativo',
            dataMatricula TEXT,
            corPadrao TEXT DEFAULT '#4CAF50',
            mensalidade REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS transacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            tipo TEXT NOT NULL,
            categoria TEXT,
            aluno_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos (id)
          );
          CREATE TABLE IF NOT EXISTS faturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL,
            dataVencimento TEXT NOT NULL,
            tipo TEXT NOT NULL,
            status TEXT DEFAULT 'pendente',
            categoria TEXT,
            aluno_id INTEGER,
            parcela INTEGER,
            totalParcelas INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos (id)
          );
          CREATE TABLE IF NOT EXISTS historicos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aluno_id INTEGER NOT NULL,
            data TEXT NOT NULL,
            peso REAL NOT NULL,
            treinoAtual TEXT NOT NULL,
            fotoBalanca TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (aluno_id) REFERENCES alunos (id)
          );
        `)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  // Buscar todos os alunos
  getAllAlunos() {
    try {
      const rows = this.db.prepare('SELECT * FROM alunos ORDER BY nome').all()
      const alunos = rows.map((aluno) => ({
        ...aluno,
        diasTreino: aluno.diasTreino ? JSON.parse(aluno.diasTreino) : [],
        horariosTreino: aluno.horariosTreino ? JSON.parse(aluno.horariosTreino) : [],
        mensalidade: aluno.mensalidade || 0
      }))
      return Promise.resolve(alunos)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Buscar aluno por ID
  getAlunoById(id) {
    try {
      const row = this.db.prepare('SELECT * FROM alunos WHERE id = ?').get(id)
      if (row) {
        const aluno = {
          ...row,
          diasTreino: row.diasTreino ? JSON.parse(row.diasTreino) : [],
          horariosTreino: row.horariosTreino ? JSON.parse(row.horariosTreino) : [],
          mensalidade: row.mensalidade || 0
        }
        return Promise.resolve(aluno)
      } else {
        return Promise.resolve(null)
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Criar novo aluno
  createAluno(alunoData) {
    const { dataMatricula } = alunoData
    console.log('dataMatricula recebida:', dataMatricula)
    try {
      const {
        nome,
        nascimento,
        telefone,
        email,
        diasTreino,
        horariosTreino,
        status,
        corPadrao,
        mensalidade,
        dataMatricula // <-- adicionar aqui
      } = alunoData

      // Use a dataMatricula enviada, ou o dia atual se não vier
      const dataMatriculaFinal = dataMatricula || getCurrentDateBrazil()
      const sql = `
        INSERT INTO alunos (
          nome, nascimento, telefone, email, diasTreino, horariosTreino,
          status, dataMatricula, corPadrao, mensalidade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const params = [
        nome,
        nascimento,
        telefone,
        email,
        JSON.stringify(diasTreino || []),
        JSON.stringify(horariosTreino || []),
        status || 'Ativo',
        dataMatriculaFinal,
        corPadrao || '#4CAF50',
        parseFloat(mensalidade) || 0
      ]
      const stmt = this.db.prepare(sql)
      const info = stmt.run(...params)
      return Promise.resolve({
        id: info.lastInsertRowid,
        ...alunoData,
        mensalidade: parseFloat(mensalidade) || 0,
        dataMatricula: dataMatriculaFinal // <-- garantir retorno correto
      })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Atualizar aluno
  updateAluno(id, alunoData) {
    try {
      const {
        nome,
        nascimento,
        telefone,
        email,
        diasTreino,
        horariosTreino,
        status,
        corPadrao,
        mensalidade,
        dataMatricula // <-- adicionar aqui
      } = alunoData

      const sql = `
        UPDATE alunos SET
          nome = ?, nascimento = ?, telefone = ?, email = ?,
          diasTreino = ?, horariosTreino = ?, status = ?,
          corPadrao = ?, mensalidade = ?, dataMatricula = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      const params = [
        nome,
        nascimento,
        telefone,
        email,
        JSON.stringify(diasTreino || []),
        JSON.stringify(horariosTreino || []),
        status,
        corPadrao,
        parseFloat(mensalidade) || 0,
        dataMatricula || getCurrentDateBrazil(), // <-- usar valor enviado
        id
      ]
      this.db.prepare(sql).run(...params)
      return Promise.resolve({
        id,
        ...alunoData,
        mensalidade: parseFloat(mensalidade) || 0,
        dataMatricula: dataMatricula // <-- garantir retorno correto
      })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Deletar aluno
  deleteAluno(id) {
    try {
      const info = this.db.prepare('DELETE FROM alunos WHERE id = ?').run(id)
      return Promise.resolve({ deletedId: id, changes: info.changes })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Métodos para transações
  getAllTransacoes() {
    try {
      const sql = `
        SELECT t.*, a.nome as aluno_nome
        FROM transacoes t
        LEFT JOIN alunos a ON t.aluno_id = a.id
        ORDER BY t.data DESC
      `
      const rows = this.db.prepare(sql).all()
      return Promise.resolve(rows || [])
    } catch (err) {
      return Promise.reject(err)
    }
  }

  createTransacao(transacaoData) {
    try {
      const { data, descricao, valor, tipo, categoria, aluno_id } = transacaoData
      const sql = `
        INSERT INTO transacoes (data, descricao, valor, tipo, categoria, aluno_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      const params = [data, descricao, valor, tipo, categoria, aluno_id]
      const info = this.db.prepare(sql).run(...params)
      return Promise.resolve({ id: info.lastInsertRowid, ...transacaoData })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  updateTransacao(id, transacaoData) {
    try {
      const { data, descricao, valor, tipo, categoria, aluno_id } = transacaoData
      const sql = `
        UPDATE transacoes SET
          data = ?, descricao = ?, valor = ?, tipo = ?, categoria = ?, aluno_id = ?
        WHERE id = ?
      `
      const params = [data, descricao, valor, tipo, categoria, aluno_id, id]
      this.db.prepare(sql).run(...params)
      return Promise.resolve({ id, ...transacaoData })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  deleteTransacao(id) {
    try {
      const info = this.db.prepare('DELETE FROM transacoes WHERE id = ?').run(id)
      return Promise.resolve({ deletedId: id, changes: info.changes })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Métodos para faturas
  getAllFaturas() {
    try {
      const sql = `
        SELECT f.*, a.nome as aluno_nome
        FROM faturas f
        LEFT JOIN alunos a ON f.aluno_id = a.id
        ORDER BY f.dataVencimento ASC
      `
      const rows = this.db.prepare(sql).all()
      return Promise.resolve(rows || [])
    } catch (err) {
      return Promise.reject(err)
    }
  }

  createFatura(faturaData) {
    try {
      const {
        descricao,
        valor,
        dataVencimento,
        tipo,
        status,
        categoria,
        aluno_id,
        parcela,
        totalParcelas
      } = faturaData
      const sql = `
        INSERT INTO faturas (
          descricao, valor, dataVencimento, tipo, status, categoria,
          aluno_id, parcela, totalParcelas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const params = [
        descricao,
        valor,
        dataVencimento,
        tipo,
        status || 'pendente',
        categoria,
        aluno_id,
        parcela,
        totalParcelas
      ]
      const info = this.db.prepare(sql).run(...params)
      return Promise.resolve({ id: info.lastInsertRowid, ...faturaData })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  updateFatura(id, faturaData) {
    try {
      const { descricao, valor, dataVencimento, tipo, status, categoria, aluno_id } = faturaData
      const sql = `
        UPDATE faturas SET
          descricao = ?, valor = ?, dataVencimento = ?, tipo = ?,
          status = ?, categoria = ?, aluno_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      const params = [descricao, valor, dataVencimento, tipo, status, categoria, aluno_id, id]
      this.db.prepare(sql).run(...params)
      return Promise.resolve({ id, ...faturaData })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  deleteFatura(id) {
    try {
      const info = this.db.prepare('DELETE FROM faturas WHERE id = ?').run(id)
      return Promise.resolve({ deletedId: id, changes: info.changes })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Gerar mensalidades automáticas
  gerarMensalidades() {
    return new Promise(async (resolve, reject) => {
      try {
        const alunos = await this.getAllAlunos()
        const alunosAtivos = alunos.filter(
          (aluno) => aluno.status === 'Ativo' && aluno.mensalidade && aluno.mensalidade > 0
        )

        const faturasCriadas = []
        const hoje = getDateBrazil()

        for (const aluno of alunosAtivos) {
          const dataMatricula = new Date(aluno.dataMatricula + 'T00:00:00')
          const proximoVencimento = new Date(
            hoje.getFullYear(),
            hoje.getMonth() + 1,
            dataMatricula.getDate()
          )
          const jaExiste = await this.verificarFaturaExistente(aluno.id, proximoVencimento)
          if (!jaExiste) {
            const faturaData = {
              descricao: `Mensalidade ${aluno.nome}`,
              valor: parseFloat(aluno.mensalidade),
              dataVencimento: proximoVencimento.toISOString().split('T')[0],
              tipo: 'receber',
              status: 'pendente',
              categoria: 'Mensalidade',
              aluno_id: aluno.id
            }
            const fatura = await this.createFatura(faturaData)
            faturasCriadas.push(fatura)
          }
        }
        resolve(faturasCriadas)
      } catch (error) {
        reject(error)
      }
    })
  }

  verificarFaturaExistente(alunoId, dataVencimento) {
    try {
      const dataFormatada = dataVencimento.toISOString().split('T')[0]
      const sql = `
        SELECT COUNT(*) as count
        FROM faturas
        WHERE aluno_id = ? AND dataVencimento = ? AND categoria = 'Mensalidade'
      `
      const row = this.db.prepare(sql).get(alunoId, dataFormatada)
      return Promise.resolve(row.count > 0)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Método para marcar fatura como paga e criar transação
  marcarFaturaPaga(faturaId) {
    return new Promise(async (resolve, reject) => {
      try {
        const fatura = await this.getFaturaById(faturaId)
        if (!fatura) {
          reject(new Error('Fatura não encontrada'))
          return
        }
        await this.updateFatura(faturaId, { ...fatura, status: 'pago' })
        const transacaoData = {
          data: getCurrentDateBrazil(),
          descricao: fatura.descricao,
          valor: fatura.valor,
          tipo: fatura.tipo === 'receber' ? 'entrada' : 'saida',
          categoria: fatura.categoria || (fatura.tipo === 'receber' ? 'Recebimento' : 'Pagamento'),
          aluno_id: fatura.aluno_id
        }
        await this.createTransacao(transacaoData)
        resolve({ success: true })
      } catch (error) {
        reject(error)
      }
    })
  }

  getFaturaById(id) {
    try {
      const row = this.db.prepare('SELECT * FROM faturas WHERE id = ?').get(id)
      return Promise.resolve(row)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Fechar conexão
  close() {
    try {
      if (this.db) {
        this.db.close()
        this.db = null
        return Promise.resolve()
      } else {
        return Promise.resolve()
      }
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Zerar todas as transações
  deleteAllTransacoes() {
    try {
      const info = this.db.prepare('DELETE FROM transacoes').run()
      return Promise.resolve({ deletedCount: info.changes })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Zerar todas as faturas
  deleteAllFaturas() {
    try {
      const info = this.db.prepare('DELETE FROM faturas').run()
      return Promise.resolve({ deletedCount: info.changes })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Métodos para históricos
  getAllHistoricos() {
    try {
      const sql = `
        SELECT h.*, a.nome as aluno_nome
        FROM historicos h
        LEFT JOIN alunos a ON h.aluno_id = a.id
        ORDER BY h.data DESC
      `
      const rows = this.db.prepare(sql).all()
      return Promise.resolve(rows || [])
    } catch (err) {
      return Promise.reject(err)
    }
  }

  getHistoricosByAluno(alunoId) {
    try {
      const sql = `
        SELECT h.*, a.nome as aluno_nome
        FROM historicos h
        LEFT JOIN alunos a ON h.aluno_id = a.id
        WHERE h.aluno_id = ?
        ORDER BY h.data DESC
      `
      const rows = this.db.prepare(sql).all(alunoId)
      return Promise.resolve(rows || [])
    } catch (err) {
      return Promise.reject(err)
    }
  }

  createHistorico(historicoData) {
    try {
      const { aluno_id, data, peso, treinoAtual, fotoBalanca } = historicoData
      const sql = `
        INSERT INTO historicos (aluno_id, data, peso, treinoAtual, fotoBalanca)
        VALUES (?, ?, ?, ?, ?)
      `
      const params = [aluno_id, data, peso, treinoAtual, fotoBalanca]
      const info = this.db.prepare(sql).run(...params)
      return Promise.resolve({ id: info.lastInsertRowid, ...historicoData })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  updateHistorico(id, historicoData) {
    try {
      const { data, peso, treinoAtual, fotoBalanca } = historicoData
      const sql = `
        UPDATE historicos SET
          data = ?, peso = ?, treinoAtual = ?, fotoBalanca = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      const params = [data, peso, treinoAtual, fotoBalanca, id]
      this.db.prepare(sql).run(...params)
      return Promise.resolve({ id, ...historicoData })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  deleteHistorico(id) {
    try {
      const info = this.db.prepare('DELETE FROM historicos WHERE id = ?').run(id)
      return Promise.resolve({ deletedId: id, changes: info.changes })
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // Métodos para Dashboard
  getDashboardData() {
    return new Promise(async (resolve, reject) => {
      try {
        const [alunos, faturas, transacoes] = await Promise.all([
          this.getAllAlunos(),
          this.getAllFaturas(),
          this.getAllTransacoes()
        ])
        const alunosAtivos = alunos.filter((aluno) => aluno.status === 'Ativo')
        const hoje = new Date()
        const dataAtualBrasil = hoje.toISOString().split('T')[0]
        const contasVencer = faturas.filter((fatura) => {
          if (fatura.status !== 'pendente') return false
          const dataVencimento = new Date(fatura.dataVencimento + 'T00:00:00')
          const hojeData = new Date(dataAtualBrasil + 'T00:00:00')
          const diferenca = Math.ceil(
            (dataVencimento.getTime() - hojeData.getTime()) / (1000 * 3600 * 24)
          )
          return diferenca >= -1 && diferenca <= 15
        })
        const mensalidadesReceber = faturas.filter((fatura) => {
          if (fatura.status !== 'pendente' || fatura.categoria !== 'Mensalidade') return false
          const dataVencimento = new Date(fatura.dataVencimento + 'T00:00:00')
          const hojeData = new Date(dataAtualBrasil + 'T00:00:00')
          const diferenca = Math.ceil(
            (dataVencimento.getTime() - hojeData.getTime()) / (1000 * 3600 * 24)
          )
          return diferenca >= -1 && diferenca <= 7
        })
        resolve({
          alunos: alunosAtivos,
          contasVencer,
          mensalidadesReceber,
          totalAlunos: alunosAtivos.length,
          totalContasVencer: contasVencer.reduce((total, conta) => total + conta.valor, 0),
          totalMensalidadesReceber: mensalidadesReceber.reduce(
            (total, mensalidade) => total + mensalidade.valor,
            0
          )
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  getTreinosDoDia(diaSemana) {
    try {
      const sql = `
        SELECT * FROM alunos
        WHERE status = 'Ativo'
        AND diasTreino LIKE ?
        ORDER BY nome
      `
      const rows = this.db.prepare(sql).all(`%"${diaSemana}"%`)
      const alunosComTreino = rows
        .map((aluno) => ({
          ...aluno,
          diasTreino: aluno.diasTreino ? JSON.parse(aluno.diasTreino) : [],
          horariosTreino: aluno.horariosTreino ? JSON.parse(aluno.horariosTreino) : [],
          horarioHoje: (() => {
            const horarios = aluno.horariosTreino ? JSON.parse(aluno.horariosTreino) : []
            const horarioHoje = horarios.find((h) => h.dia === diaSemana)
            return horarioHoje ? horarioHoje.horario : 'Não definido'
          })()
        }))
        .filter((aluno) => aluno.diasTreino.includes(diaSemana))
      return Promise.resolve(alunosComTreino)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  getEstatisticasSemana() {
    return new Promise(async (resolve, reject) => {
      try {
        const alunos = await this.getAllAlunos()
        const alunosAtivos = alunos.filter((aluno) => aluno.status === 'Ativo')
        const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
        const estatisticasPorDia = {}
        let totalAulasSemana = 0
        diasSemana.forEach((dia) => {
          const alunosNoDia = alunosAtivos.filter(
            (aluno) => aluno.diasTreino && aluno.diasTreino.includes(dia)
          ).length
          estatisticasPorDia[dia] = alunosNoDia
          totalAulasSemana += alunosNoDia
        })
        resolve({
          estatisticasPorDia,
          totalAulasSemana,
          totalAlunosAtivos: alunosAtivos.length,
          mediaAulasPorAluno: alunosAtivos.length > 0 ? totalAulasSemana / alunosAtivos.length : 0
        })
      } catch (error) {
        reject(error)
      }
    })
  }
}

export default new Database()
