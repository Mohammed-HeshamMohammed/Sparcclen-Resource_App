import { ipcMain, app } from 'electron'
import { promises as fs } from 'fs'
import { resolve } from 'path'

const resolveDocumentsPath = (relativePath: string) => {
  const documentsPath = app.getPath('documents')
  let adjustedPath = relativePath
  if (/^Documents[\\/](?:Sparcclen)[\\/]/.test(adjustedPath)) {
    adjustedPath = adjustedPath.replace(/^Documents[\\/](Sparcclen)[\\/]/, (_, base: string) => `${base}/`)
  } else if (!/^Sparcclen[\\/]/.test(adjustedPath)) {
    adjustedPath = `Sparcclen/${adjustedPath}`
  }
  return resolve(documentsPath, adjustedPath)
}

export const registerFileSystemHandlers = () => {
  ipcMain.handle('fs:writeFile', async (_event, relativePath: string, data: string) => {
    try {
      const fullPath = resolveDocumentsPath(relativePath)
      await fs.writeFile(fullPath, data, 'utf-8')
      return true
    } catch (error) {
      console.error('[fs:writeFile] Error:', error)
      return false
    }
  })

  ipcMain.handle('fs:readFile', async (_event, relativePath: string) => {
    try {
      const fullPath = resolveDocumentsPath(relativePath)
      return await fs.readFile(fullPath, 'utf-8')
    } catch (error) {
      console.error('[fs:readFile] Error:', error)
      return null
    }
  })

  ipcMain.handle('fs:exists', async (_event, relativePath: string) => {
    try {
      const fullPath = resolveDocumentsPath(relativePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:ensureDir', async (_event, relativePath: string) => {
    try {
      const fullPath = resolveDocumentsPath(relativePath)
      await fs.mkdir(fullPath, { recursive: true })
      return true
    } catch (error) {
      console.error('[fs:ensureDir] Error:', error)
      return false
    }
  })
}
