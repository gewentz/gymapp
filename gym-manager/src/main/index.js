import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import database from './database.js'
import {
  formatDateFromDB,
  calculateAge,
  getCurrentDate,
  getCurrentDateBrazil
} from './utils/dbUtils.js'

// Configurar auto-updater
autoUpdater.autoDownload = false // Não baixar automaticamente
autoUpdater.autoInstallOnAppQuit = true

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

  return mainWindow
}

// Configurar eventos do auto-updater
function setupAutoUpdater(mainWindow) {
  // Verificando por atualizações
  autoUpdater.on('checking-for-update', () => {
    console.log('Verificando atualizações...')
    mainWindow?.webContents.send('updater-message', {
      type: 'checking',
      message: 'Verificando atualizações...'
    })
  })

  // Atualização disponível
  autoUpdater.on('update-available', (info) => {
    console.log('Atualização disponível:', info.version)

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Atualização Disponível',
        message: `Uma nova versão (${info.version}) está disponível!`,
        detail: 'Deseja baixar e instalar agora?',
        buttons: ['Sim', 'Mais tarde'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
          mainWindow?.webContents.send('updater-message', {
            type: 'downloading',
            message: 'Baixando atualização...'
          })
        }
      })
  })

  // Nenhuma atualização disponível
  autoUpdater.on('update-not-available', () => {
    console.log('Aplicação está atualizada')
    mainWindow?.webContents.send('updater-message', {
      type: 'not-available',
      message: 'Aplicação está atualizada'
    })
  })

  // Erro na atualização
  autoUpdater.on('error', (err) => {
    console.error('Erro na atualização:', err)
    mainWindow?.webContents.send('updater-message', {
      type: 'error',
      message: `Erro na atualização: ${err.message}`
    })

    dialog.showErrorBox(
      'Erro na Atualização',
      `Ocorreu um erro ao verificar atualizações: ${err.message}`
    )
  })

  // Progresso do download
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    const speed = (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2)

    console.log(`Download: ${percent}% - Velocidade: ${speed} MB/s`)

    mainWindow?.webContents.send('updater-message', {
      type: 'download-progress',
      percent: percent,
      speed: speed,
      message: `Baixando: ${percent}% (${speed} MB/s)`
    })
  })

  // Atualização baixada
  autoUpdater.on('update-downloaded', () => {
    console.log('Atualização baixada. Será instalada ao reiniciar.')

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Atualização Pronta',
        message: 'A atualização foi baixada com sucesso!',
        detail: 'A aplicação será reiniciada para aplicar a atualização.',
        buttons: ['Reiniciar Agora', 'Reiniciar Depois'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        } else {
          mainWindow?.webContents.send('updater-message', {
            type: 'ready',
            message: 'Atualização pronta. Reinicie quando desejar.'
          })
        }
      })
  })
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

  // Criar janela principal
  const mainWindow = createWindow()

  // Configurar auto-updater apenas em produção
  if (!is.dev) {
    setupAutoUpdater(mainWindow)

    // Verificar atualizações após 5 segundos
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify()
    }, 5000)
  }

  ipcMain.handle('utils:getCurrentDateBrazil', async () => {
    try {
      return getCurrentDateBrazil()
    } catch (error) {
      console.error('Erro ao obter data atual do Brasil:', error)
      throw error
    }
  })

  // ========== HANDLERS DOS ALUNOS ==========

  ipcMain.handle('alunos:getAll', async () => {
    try {
      return await database.getAllAlunos()
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
      throw error
    }
  })

  ipcMain.handle('alunos:getById', async (event, id) => {
    try {
      return await database.getAlunoById(id)
    } catch (error) {
      console.error('Erro ao buscar aluno:', error)
      throw error
    }
  })

  ipcMain.handle('alunos:create', async (event, alunoData) => {
    try {
      return await database.createAluno(alunoData)
    } catch (error) {
      console.error('Erro ao criar aluno:', error)
      throw error
    }
  })

  ipcMain.handle('alunos:update', async (event, id, alunoData) => {
    try {
      return await database.updateAluno(id, alunoData)
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error)
      throw error
    }
  })

  ipcMain.handle('alunos:delete', async (event, id) => {
    try {
      return await database.deleteAluno(id)
    } catch (error) {
      console.error('Erro ao deletar aluno:', error)
      throw error
    }
  })

  // ========== HANDLERS DAS TRANSAÇÕES ==========

  ipcMain.handle('transacoes:getAll', async () => {
    try {
      return await database.getAllTransacoes()
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
      throw error
    }
  })

  ipcMain.handle('transacoes:create', async (event, transacaoData) => {
    try {
      return await database.createTransacao(transacaoData)
    } catch (error) {
      console.error('Erro ao criar transação:', error)
      throw error
    }
  })

  ipcMain.handle('transacoes:update', async (event, id, transacaoData) => {
    try {
      return await database.updateTransacao(id, transacaoData)
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
      throw error
    }
  })

  ipcMain.handle('transacoes:delete', async (event, id) => {
    try {
      return await database.deleteTransacao(id)
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
      throw error
    }
  })

  // ========== HANDLERS DAS FATURAS ==========

  ipcMain.handle('faturas:getAll', async () => {
    try {
      return await database.getAllFaturas()
    } catch (error) {
      console.error('Erro ao buscar faturas:', error)
      throw error
    }
  })

  ipcMain.handle('faturas:create', async (event, faturaData) => {
    try {
      return await database.createFatura(faturaData)
    } catch (error) {
      console.error('Erro ao criar fatura:', error)
      throw error
    }
  })

  ipcMain.handle('faturas:update', async (event, id, faturaData) => {
    try {
      return await database.updateFatura(id, faturaData)
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error)
      throw error
    }
  })

  ipcMain.handle('faturas:delete', async (event, id) => {
    try {
      return await database.deleteFatura(id)
    } catch (error) {
      console.error('Erro ao deletar fatura:', error)
      throw error
    }
  })

  ipcMain.handle('faturas:gerarMensalidades', async () => {
    try {
      return await database.gerarMensalidades()
    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error)
      throw error
    }
  })

  ipcMain.handle('faturas:marcarPaga', async (event, faturaId) => {
    try {
      return await database.marcarFaturaPaga(faturaId)
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error)
      throw error
    }
  })

  // ========== HANDLERS PARA ZERAR DADOS ==========

  ipcMain.handle('transacoes:deleteAll', async () => {
    try {
      return await database.deleteAllTransacoes()
    } catch (error) {
      console.error('Erro ao zerar transações:', error)
      throw error
    }
  })

  ipcMain.handle('faturas:deleteAll', async () => {
    try {
      return await database.deleteAllFaturas()
    } catch (error) {
      console.error('Erro ao zerar faturas:', error)
      throw error
    }
  })

  // ========== HANDLERS DOS UTILS ==========

  ipcMain.handle('utils:formatDate', async (event, date) => {
    try {
      return formatDateFromDB(date)
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      throw error
    }
  })

  ipcMain.handle('utils:calculateAge', async (event, birthDate) => {
    try {
      return calculateAge(birthDate)
    } catch (error) {
      console.error('Erro ao calcular idade:', error)
      throw error
    }
  })

  ipcMain.handle('utils:getCurrentDate', async () => {
    try {
      return getCurrentDate()
    } catch (error) {
      console.error('Erro ao obter data atual:', error)
      throw error
    }
  })

  // ========== HANDLERS DO AUTO-UPDATER ==========

  ipcMain.handle('updater:check-for-updates', async () => {
    if (!is.dev) {
      try {
        return await autoUpdater.checkForUpdates()
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error)
        throw error
      }
    }
    return null
  })

  ipcMain.handle('updater:download-update', async () => {
    if (!is.dev) {
      try {
        return await autoUpdater.downloadUpdate()
      } catch (error) {
        console.error('Erro ao baixar atualização:', error)
        throw error
      }
    }
    return null
  })

  ipcMain.handle('updater:quit-and-install', () => {
    if (!is.dev) {
      autoUpdater.quitAndInstall()
    }
  })

  ipcMain.handle('updater:get-version', () => {
    return app.getVersion()
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      const newMainWindow = createWindow()
      if (!is.dev) {
        setupAutoUpdater(newMainWindow)
      }
    }
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
