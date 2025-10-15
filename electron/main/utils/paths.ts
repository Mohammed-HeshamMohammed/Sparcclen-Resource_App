import { app } from 'electron'
import { join } from 'path'

export const sanitizePathSegment = (segment: string) =>
  segment.replace(/[:*?"<>|]/g, '').replace(/[/\\]+/g, '').trim()

export const resolveLibraryBaseDir = () => {
  if (process.platform === 'win32') {
    const localAppData = process.env['LOCALAPPDATA']
    if (localAppData && localAppData.trim()) {
      return join(localAppData, 'Sparcclen')
    }
  }
  return join(app.getPath('userData'), 'Sparcclen')
}
