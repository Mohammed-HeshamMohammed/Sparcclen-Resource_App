import { ipcMain, dialog } from 'electron'
import type { BrowserWindow } from 'electron'
import { basename, join } from 'path'
import { promises as fs } from 'fs'
import { resolveLibraryBaseDir, sanitizePathSegment } from '../utils/paths'

export const registerResourceHandlers = (getWindow: () => BrowserWindow | null) => {
  ipcMain.handle('resources:pickJsonFile', async () => {
    try {
      const targetWindow = getWindow() ?? undefined
      const result = await dialog.showOpenDialog(targetWindow, {
        title: 'Select resource JSON file',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }

      const filePath = result.filePaths[0]
      const fileName = basename(filePath)
      const data = await fs.readFile(filePath, 'utf-8')

      return { canceled: false, filePath, fileName, data }
    } catch (error) {
      console.error('[resources:pickJsonFile] Error:', error)
      return {
        canceled: true,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  ipcMain.handle(
    'resources:saveLibraryBin',
    async (_event, segments: string[], fileName: string, content: string) => {
      try {
        const sanitizedSegments = Array.isArray(segments)
          ? segments.map(sanitizePathSegment).filter(Boolean)
          : []

        const safeFileName = sanitizePathSegment(fileName) || 'library.bin'

        const baseDir = resolveLibraryBaseDir()
        const targetDir = join(baseDir, ...sanitizedSegments)

        await fs.mkdir(targetDir, { recursive: true })
        const fullPath = join(targetDir, safeFileName)

        await fs.writeFile(fullPath, Buffer.from(content, 'utf-8'))
        return { ok: true, path: fullPath }
      } catch (error) {
        console.error('[resources:saveLibraryBin] Error:', error)
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  )

  ipcMain.handle(
    'resources:listLibraryBins',
    async (
      _event,
      options?: { category?: string | null; subcategory?: string | null },
    ) => {
      try {
        const baseDir = resolveLibraryBaseDir()
        const libraryRoot = join(baseDir, 'library')
        const results: Array<{
          categorySegment: string | null
          subcategorySegment: string | null
          fileName: string
          items: unknown[]
        }> = []

        const libraryExists = await fs
          .stat(libraryRoot)
          .then(stat => stat.isDirectory())
          .catch(() => false)

        if (!libraryExists) {
          return { ok: true, files: results }
        }

        const categoryFilter = options?.category
          ? sanitizePathSegment(options.category)
          : null
        const subcategoryFilter = options?.subcategory
          ? sanitizePathSegment(options.subcategory)
          : null

        const collectBins = async (
          targetDir: string,
          categorySegment: string | null,
          subcategorySegment: string | null,
        ) => {
          try {
            const entries = await fs.readdir(targetDir, { withFileTypes: true })
            for (const entry of entries) {
              if (!entry.isFile()) continue
              if (!entry.name.toLowerCase().endsWith('.bin')) continue

              const filePath = join(targetDir, entry.name)
              try {
                const raw = await fs.readFile(filePath, 'utf-8')
                const parsed = JSON.parse(raw)
                const items = Array.isArray(parsed) ? parsed : [parsed]
                results.push({
                  categorySegment,
                  subcategorySegment,
                  fileName: entry.name,
                  items,
                })
              } catch (error) {
                console.error(
                  `[resources:listLibraryBins] Failed to parse file ${filePath}:`,
                  error,
                )
              }
            }
          } catch (error) {
            console.error(
              '[resources:listLibraryBins] Failed to read directory:',
              targetDir,
              error,
            )
          }
        }

        const processCategoryDirectory = async (dirName: string) => {
          const sanitizedName = sanitizePathSegment(dirName)
          if (!sanitizedName) return

          if (
            categoryFilter &&
            sanitizedName.toLowerCase() !== categoryFilter.toLowerCase()
          ) {
            return
          }

          const categoryDir = join(libraryRoot, dirName)

          if (!subcategoryFilter) {
            await collectBins(categoryDir, dirName, null)
          }

          const entries = await fs
            .readdir(categoryDir, { withFileTypes: true })
            .catch(() => [])

          for (const entry of entries) {
            if (!entry.isDirectory()) continue
            const subDirName = entry.name
            const sanitizedSub = sanitizePathSegment(subDirName)
            if (!sanitizedSub) continue

            if (
              subcategoryFilter &&
              sanitizedSub.toLowerCase() !== subcategoryFilter.toLowerCase()
            ) {
              continue
            }

            await collectBins(
              join(categoryDir, subDirName),
              dirName,
              subDirName,
            )
          }
        }

        const topLevelEntries = await fs
          .readdir(libraryRoot, { withFileTypes: true })
          .catch(() => [])

        if (!categoryFilter) {
          await collectBins(libraryRoot, null, null)
        }

        for (const entry of topLevelEntries) {
          if (!entry.isDirectory()) continue
          await processCategoryDirectory(entry.name)
        }

        return { ok: true, files: results }
      } catch (error) {
        console.error('[resources:listLibraryBins] Error:', error)
        return {
          ok: false,
          files: [],
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  )
}
