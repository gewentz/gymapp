import sqlite3 from 'sqlite3'
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
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar com o banco de dados:', err)
          reject(err)
        } else {
          console.log('Conectado ao banco de dados SQLite')
          this.initTables().then(resolve).catch(reject)
        }
      })
    })
  }

  // Inicializar tabelas
  initTables() {
    return new Promise((resolve, reject) => {
      const createAlunosTable = `
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
        )
      `

      const createTransacoesTable = `
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
        )
      `

      const createFaturasTable = `
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
        )
      `

      this.db.serialize(() => {
        this.db.run(createAlunosTable, (err) => {
          if (err) {
            console.error('Erro ao criar tabela alunos:', err)
            reject(err)
            return
          }
          console.log('Tabela alunos criada/verificada com sucesso')
        })

        this.db.run(createTransacoesTable, (err) => {
          if (err) {
            console.error('Erro ao criar tabela transacoes:', err)
            reject(err)
            return
          }
          console.log('Tabela transacoes criada/verificada com sucesso')
        })

        this.db.run(createFaturasTable, (err) => {
          if (err) {
            console.error('Erro ao criar tabela faturas:', err)
            reject(err)
            return
          }
          console.log('Tabela faturas criada/verificada com sucesso')
          resolve()
        })
      })
    })
  }

  // Buscar todos os alunos
  getAllAlunos() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM alunos ORDER BY nome', (err, rows) => {
        if (err) {
          reject(err)
        } else {
          // Converter strings JSON de volta para arrays e centavos para reais
          const alunos = rows.map(aluno => ({
            ...aluno,
            diasTreino: aluno.diasTreino ? JSON.parse(aluno.diasTreino) : [],
            horariosTreino: aluno.horariosTreino ? JSON.parse(aluno.horariosTreino) : [],
            mensalidade: aluno.mensalidade ? aluno.mensalidade / 100 : 0
          }))
          resolve(alunos)
        }
      })
    })
  }

  // Buscar aluno por ID
  getAlunoById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM alunos WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err)
        } else if (row) {
          const aluno = {
            ...row,
            diasTreino: row.diasTreino ? JSON.parse(row.diasTreino) : [],
            horariosTreino: row.horariosTreino ? JSON.parse(row.horariosTreino) : [],
            mensalidade: row.mensalidade ? row.mensalidade / 100 : 0
          }
          resolve(aluno)
        } else {
          resolve(null)
        }
      })
    })
  }

  // Criar novo aluno
  createAluno(alunoData) {
    return new Promise((resolve, reject) => {
      const {
        nome,
        nascimento,
        telefone,
        email,
        diasTreino,
        horariosTreino,
        status,
        corPadrao,
        mensalidade
      } = alunoData

      const dataMatricula = getCurrentDateBrazil() // Data atual do Brasil
      console.log(`Cadastrando aluno ${nome} - Data matrícula: ${dataMatricula}`)

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
        dataMatricula,
        corPadrao || '#4CAF50',
        parseFloat(mensalidade) || 0
      ]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            id: this.lastID,
            ...alunoData,
            mensalidade: parseFloat(mensalidade) || 0,
            dataMatricula
          })
        }
      })
    })
  }

  // Atualizar aluno
  updateAluno(id, alunoData) {
    return new Promise((resolve, reject) => {
      const {
        nome,
        nascimento,
        telefone,
        email,
        diasTreino,
        horariosTreino,
        status,
        corPadrao,
        mensalidade
      } = alunoData

      const sql = `
        UPDATE alunos SET
          nome = ?, nascimento = ?, telefone = ?, email = ?,
          diasTreino = ?, horariosTreino = ?, status = ?,
          corPadrao = ?, mensalidade = ?, updated_at = CURRENT_TIMESTAMP
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
        parseFloat(mensalidade) || 0,  // Garantir conversão correta
        id
      ]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            id,
            ...alunoData,
            mensalidade: parseFloat(mensalidade) || 0  // Retornar valor correto
          })
        }
      })
    })
  }

  // Deletar aluno
  deleteAluno(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM alunos WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ deletedId: id, changes: this.changes })
        }
      })
    })
  }

  // Adicionar métodos para transações
  getAllTransacoes() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT t.*, a.nome as aluno_nome
        FROM transacoes t
        LEFT JOIN alunos a ON t.aluno_id = a.id
        ORDER BY t.data DESC
      `

      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows || [])
        }
      })
    })
  }

  createTransacao(transacaoData) {
    return new Promise((resolve, reject) => {
      const { data, descricao, valor, tipo, categoria, aluno_id } = transacaoData

      const sql = `
        INSERT INTO transacoes (data, descricao, valor, tipo, categoria, aluno_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `

      const params = [data, descricao, valor, tipo, categoria, aluno_id]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID, ...transacaoData })
        }
      })
    })
  }

  updateTransacao(id, transacaoData) {
    return new Promise((resolve, reject) => {
      const { data, descricao, valor, tipo, categoria, aluno_id } = transacaoData

      const sql = `
        UPDATE transacoes SET
          data = ?, descricao = ?, valor = ?, tipo = ?, categoria = ?, aluno_id = ?
        WHERE id = ?
      `

      const params = [data, descricao, valor, tipo, categoria, aluno_id, id]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id, ...transacaoData })
        }
      })
    })
  }

  deleteTransacao(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM transacoes WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ deletedId: id, changes: this.changes })
        }
      })
    })
  }

  // Adicionar métodos para faturas
  getAllFaturas() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT f.*, a.nome as aluno_nome
        FROM faturas f
        LEFT JOIN alunos a ON f.aluno_id = a.id
        ORDER BY f.dataVencimento ASC
      `

      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows || [])
        }
      })
    })
  }

  createFatura(faturaData) {
    return new Promise((resolve, reject) => {
      const {
        descricao, valor, dataVencimento, tipo, status, categoria,
        aluno_id, parcela, totalParcelas
      } = faturaData

      const sql = `
        INSERT INTO faturas (
          descricao, valor, dataVencimento, tipo, status, categoria,
          aluno_id, parcela, totalParcelas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const params = [
        descricao, valor, dataVencimento, tipo, status || 'pendente',
        categoria, aluno_id, parcela, totalParcelas
      ]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID, ...faturaData })
        }
      })
    })
  }

  updateFatura(id, faturaData) {
    return new Promise((resolve, reject) => {
      const {
        descricao, valor, dataVencimento, tipo, status, categoria, aluno_id
      } = faturaData

      const sql = `
        UPDATE faturas SET
          descricao = ?, valor = ?, dataVencimento = ?, tipo = ?,
          status = ?, categoria = ?, aluno_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `

      const params = [descricao, valor, dataVencimento, tipo, status, categoria, aluno_id, id]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id, ...faturaData })
        }
      })
    })
  }

  deleteFatura(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM faturas WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ deletedId: id, changes: this.changes })
        }
      })
    })
  }

  // Gerar mensalidades automáticas
  gerarMensalidades() {
    return new Promise(async (resolve, reject) => {
      try {
        const alunos = await this.getAllAlunos()
        const alunosAtivos = alunos.filter(aluno =>
          aluno.status === 'Ativo' && aluno.mensalidade && aluno.mensalidade > 0
        )

        const faturasCriadas = []
        const hoje = getDateBrazil() // Data atual no Brasil

        console.log(`Gerando mensalidades - Data atual: ${hoje.toLocaleDateString('pt-BR')}`)

        for (const aluno of alunosAtivos) {
          // Pegar a data de matrícula do aluno
          const dataMatricula = new Date(aluno.dataMatricula + 'T00:00:00')

          console.log(`Aluno: ${aluno.nome}, Data matrícula: ${dataMatricula.toLocaleDateString('pt-BR')}`)

          // Calcular próximo vencimento: próximo mês, mesmo dia da matrícula
          const proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dataMatricula.getDate())

          console.log(`Próximo vencimento: ${proximoVencimento.toLocaleDateString('pt-BR')}`)

          // Verificar se já existe fatura para o próximo mês
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

            console.log(`Criando fatura: ${faturaData.descricao} - Vencimento: ${faturaData.dataVencimento}`)

            const fatura = await this.createFatura(faturaData)
            faturasCriadas.push(fatura)
          } else {
            console.log(`Fatura já existe para ${aluno.nome}`)
          }
        }

        console.log(`Total de faturas criadas: ${faturasCriadas.length}`)
        resolve(faturasCriadas)
      } catch (error) {
        console.error('Erro ao gerar mensalidades:', error)
        reject(error)
      }
    })
  }

  verificarFaturaExistente(alunoId, dataVencimento) {
    return new Promise((resolve, reject) => {
      const dataFormatada = dataVencimento.toISOString().split('T')[0]

      const sql = `
        SELECT COUNT(*) as count
        FROM faturas
        WHERE aluno_id = ? AND dataVencimento = ? AND categoria = 'Mensalidade'
      `

      this.db.get(sql, [alunoId, dataFormatada], (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row.count > 0)
        }
      })
    })
  }

  // Método para marcar fatura como paga e criar transação
  marcarFaturaPaga(faturaId) {
    return new Promise(async (resolve, reject) => {
      try {
        // Buscar a fatura
        const fatura = await this.getFaturaById(faturaId)
        if (!fatura) {
          reject(new Error('Fatura não encontrada'))
          return
        }

        // Atualizar status da fatura
        await this.updateFatura(faturaId, { ...fatura, status: 'pago' })

        // Criar transação no fluxo de caixa
        const transacaoData = {
          data: getCurrentDateBrazil(), // Usar horário do Brasil
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
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM faturas WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  // Fechar conexão
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err)
          } else {
            console.log('Conexão com banco de dados fechada')
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
  }

  // Zerar todas as transações
  deleteAllTransacoes() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM transacoes', function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ deletedCount: this.changes })
        }
      })
    })
  }

  // Zerar todas as faturas
  deleteAllFaturas() {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM faturas', function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ deletedCount: this.changes })
        }
      })
    })
  }
}

export default new Database()
