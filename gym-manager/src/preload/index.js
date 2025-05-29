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
  utils: {
    formatDate: (date) => ipcRenderer.invoke('utils:formatDate', date),
    calculateAge: (birthDate) => ipcRenderer.invoke('utils:calculateAge', birthDate),
    getCurrentDate: () => ipcRenderer.invoke('utils:getCurrentDate')
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
