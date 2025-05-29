import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import database from './database.js'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Conectar ao banco de dados
  try {
    await database.connect()
    console.log('Banco de dados inicializado com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers para operações do banco de dados
  ipcMain.handle('db:getAllAlunos', async () => {
    try {
      return await database.getAllAlunos()
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
      throw error
    }
  })

  ipcMain.handle('db:getAlunoById', async (event, id) => {
    try {
      return await database.getAlunoById(id)
    } catch (error) {
      console.error('Erro ao buscar aluno:', error)
      throw error
    }
  })

  ipcMain.handle('db:createAluno', async (event, alunoData) => {
    try {
      return await database.createAluno(alunoData)
    } catch (error) {
      console.error('Erro ao criar aluno:', error)
      throw error
    }
  })

  ipcMain.handle('db:updateAluno', async (event, id, alunoData) => {
    try {
      return await database.updateAluno(id, alunoData)
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error)
      throw error
    }
  })

  ipcMain.handle('db:deleteAluno', async (event, id) => {
    try {
      return await database.deleteAluno(id)
    } catch (error) {
      console.error('Erro ao deletar aluno:', error)
      throw error
    }
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  // Fechar conexão com banco de dados
  try {
    await database.close()
  } catch (error) {
    console.error('Erro ao fechar banco de dados:', error)
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
