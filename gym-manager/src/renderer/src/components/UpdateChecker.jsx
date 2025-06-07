import { useState, useEffect } from 'react'

function UpdateChecker() {
  const [updateStatus, setUpdateStatus] = useState('')

  const checkForUpdates = async () => {
    setUpdateStatus('Verificando atualizações...')
    try {
      const result = await window.electron.ipcRenderer.invoke('check-for-updates')
      if (result) {
        setUpdateStatus('Verificando...')
      } else {
        setUpdateStatus('Nenhuma atualização disponível')
      }
    } catch (error) {
      setUpdateStatus('Erro ao verificar atualizações')
    }
  }

  return (
    <div className="update-checker">
      <button
        onClick={checkForUpdates}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Verificar Atualizações
      </button>
      {updateStatus && (
        <p className="mt-2 text-sm text-gray-600">{updateStatus}</p>
      )}
    </div>
  )
}

export default UpdateChecker
