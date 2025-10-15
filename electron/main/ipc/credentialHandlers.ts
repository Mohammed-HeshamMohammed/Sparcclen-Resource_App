import { ipcMain } from 'electron'
import { CredentialManager } from '../security/credentialManager'

export const registerCredentialHandlers = (manager: CredentialManager) => {
  ipcMain.handle('credentials:isAvailable', () => manager.isEncryptionAvailable())
  ipcMain.handle('credentials:store', async (_event, email: string, password: string) =>
    manager.storeCredentials(email, password),
  )
  ipcMain.handle('credentials:get', async (_event, email: string) =>
    manager.getCredentials(email),
  )
  ipcMain.handle('credentials:getEmails', async () =>
    manager.getStoredEmails(),
  )
  ipcMain.handle('credentials:has', async (_event, email: string) =>
    manager.hasCredentials(email),
  )
  ipcMain.handle('credentials:delete', async (_event, email: string) =>
    manager.deleteCredentials(email),
  )
  ipcMain.handle('credentials:promptHello', async (_event, email: string) =>
    manager.promptWindowsHello(email),
  )
}
