import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  alunos: {
    getAll: () => ipcRenderer.invoke('alunos:getAll'),
    getById: (id) => ipcRenderer.invoke('alunos:getById', id),
    create: (alunoData) => ipcRenderer.invoke('alunos:create', alunoData),
    update: (id, alunoData) => ipcRenderer.invoke('alunos:update', id, alunoData),
    delete: (id) => ipcRenderer.invoke('alunos:delete', id)
  },
  historicos: {
    getAll: () => ipcRenderer.invoke('historicos:getAll'),
    getByAluno: (alunoId) => ipcRenderer.invoke('historicos:getByAluno', alunoId),
    create: (historicoData) => ipcRenderer.invoke('historicos:create', historicoData),
    update: (id, historicoData) => ipcRenderer.invoke('historicos:update', id, historicoData),
    delete: (id) => ipcRenderer.invoke('historicos:delete', id)
  },
  transacoes: {
    getAll: () => ipcRenderer.invoke('transacoes:getAll'),
    create: (transacaoData) => ipcRenderer.invoke('transacoes:create', transacaoData),
    update: (id, transacaoData) => ipcRenderer.invoke('transacoes:update', id, transacaoData),
    delete: (id) => ipcRenderer.invoke('transacoes:delete', id),
    deleteAll: () => ipcRenderer.invoke('transacoes:deleteAll')
  },
  faturas: {
    getAll: () => ipcRenderer.invoke('faturas:getAll'),
    create: (faturaData) => ipcRenderer.invoke('faturas:create', faturaData),
    update: (id, faturaData) => ipcRenderer.invoke('faturas:update', id, faturaData),
    delete: (id) => ipcRenderer.invoke('faturas:delete', id),
    gerarMensalidades: () => ipcRenderer.invoke('faturas:gerarMensalidades'),
    marcarPaga: (faturaId) => ipcRenderer.invoke('faturas:marcarPaga', faturaId),
    deleteAll: () => ipcRenderer.invoke('faturas:deleteAll')
  },
  dashboard: {
    getData: () => ipcRenderer.invoke('dashboard:getData'),
    getTreinosDoDia: (diaSemana) => ipcRenderer.invoke('dashboard:getTreinosDoDia', diaSemana),
    getEstatisticasSemana: () => ipcRenderer.invoke('dashboard:getEstatisticasSemana')
  },
  utils: {
    formatDate: (date) => ipcRenderer.invoke('utils:formatDate', date),
    calculateAge: (birthDate) => ipcRenderer.invoke('utils:calculateAge', birthDate),
    getCurrentDate: () => ipcRenderer.invoke('utils:getCurrentDate'),
    getCurrentDateBrazil: () => ipcRenderer.invoke('utils:getCurrentDateBrazil')
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    onMessage: (callback) => ipcRenderer.on('updater-message', callback),
    removeAllListeners: () => ipcRenderer.removeAllListeners('updater-message')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
