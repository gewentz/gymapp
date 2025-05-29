import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { formatDateForDB, getCurrentDate } from './utils/dbUtils.js'

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
          diasTreino TEXT, -- JSON string dos dias
          horariosTreino TEXT, -- JSON string dos horários
          status TEXT DEFAULT 'Ativo',
          dataMatricula TEXT,
          corPadrao TEXT DEFAULT '#4CAF50',
          mensalidade REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `

      this.db.run(createAlunosTable, (err) => {
        if (err) {
          console.error('Erro ao criar tabela alunos:', err)
          reject(err)
        } else {
          console.log('Tabela alunos criada/verificada com sucesso')
          resolve()
        }
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
          // Converter strings JSON de volta para arrays
          const alunos = rows.map(aluno => ({
            ...aluno,
            diasTreino: aluno.diasTreino ? JSON.parse(aluno.diasTreino) : [],
            horariosTreino: aluno.horariosTreino ? JSON.parse(aluno.horariosTreino) : []
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
            horariosTreino: row.horariosTreino ? JSON.parse(row.horariosTreino) : []
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

      const dataMatricula = getCurrentDate()

      const sql = `
        INSERT INTO alunos (
          nome, nascimento, telefone, email, diasTreino, horariosTreino,
          status, dataMatricula, corPadrao, mensalidade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const params = [
        nome,
        nascimento, // Já vem no formato correto do input
        telefone,
        email,
        JSON.stringify(diasTreino || []),
        JSON.stringify(horariosTreino || []),
        status || 'Ativo',
        dataMatricula,
        corPadrao || '#4CAF50',
        mensalidade
      ]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            id: this.lastID,
            ...alunoData,
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
        nascimento, // Já vem no formato correto do input
        telefone,
        email,
        JSON.stringify(diasTreino || []),
        JSON.stringify(horariosTreino || []),
        status,
        corPadrao,
        mensalidade,
        id
      ]

      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id, ...alunoData })
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
}

export default new Database()
