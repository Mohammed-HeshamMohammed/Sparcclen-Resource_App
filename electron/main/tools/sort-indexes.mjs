#!/usr/bin/env node
/**
 * Ensures index files export their members in alphabetical order.
 * Use `node electron/main/tools/sort-indexes.mjs --check` to verify ordering
 * and `node electron/main/tools/sort-indexes.mjs` to rewrite indices in place.
 *
 * By default this script inspects `src/components` and `src/lib`. You can add
 * extra folders via repeated `--dir <path>` arguments (paths are relative to
 * the project root).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')
const rootDir = resolve(__dirname, '..', '..', '..')
const isCheckMode = process.argv.includes('--check')

function parseDirArgs() {
  const dirs = []
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--check') continue
    if (arg === '--dir') {
      const next = args[index + 1]
      if (next && !next.startsWith('--')) {
        dirs.push(resolve(rootDir, next))
        index += 1
      }
      continue
    }
    if (arg.startsWith('--dir=')) {
      const [, value] = arg.split('=')
      if (value) dirs.push(resolve(rootDir, value))
      continue
    }
    dirs.push(resolve(rootDir, arg))
  }

  if (dirs.length > 0) return dirs

  return [
    resolve(rootDir, 'src', 'components'),
    resolve(rootDir, 'src', 'lib'),
  ]
}

async function findIndexFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await findIndexFiles(entryPath)))
    } else if (entry.isFile() && entry.name === 'index.ts') {
      files.push(entryPath)
    }
  }
  return files
}

function normaliseLine(line) {
  return line.trim().replace(/\s+/g, ' ')
}

async function processFile(file) {
  const original = await readFile(file, 'utf8')
  const lines = original.split(/\r?\n/)
  const exportLines = lines.filter(line => line.trim().startsWith('export'))

  if (exportLines.length === 0) {
    return { file, changed: false }
  }

  const nonExportLines = lines.filter(line => line.trim().length > 0 && !line.trim().startsWith('export'))
  if (nonExportLines.length > 0) {
    return { file, changed: false }
  }

  const sorted = [...exportLines].sort((a, b) => normaliseLine(a).localeCompare(normaliseLine(b)))
  const isSameOrder = exportLines.every((line, idx) => normaliseLine(line) === normaliseLine(sorted[idx]))

  if (isSameOrder) {
    return { file, changed: false }
  }

  if (isCheckMode) {
    return { file, changed: true }
  }

  const newline = original.includes('\r\n') ? '\r\n' : '\n'
  const finalContents = sorted.join(newline) + newline
  await writeFile(file, finalContents, 'utf8')
  return { file, changed: true }
}

async function main() {
  const targetDirs = parseDirArgs()
  const indexFiles = []

  for (const dir of targetDirs) {
    try {
      indexFiles.push(...(await findIndexFiles(dir)))
    } catch (error) {
      console.warn(`[sort-indexes] Skipping missing directory: ${dir}`)
    }
  }

  if (indexFiles.length === 0) {
    console.log('[sort-indexes] No index files found for processing.')
    return
  }

  const results = await Promise.all(indexFiles.map(processFile))
  const changedFiles = results.filter(result => result.changed).map(result => result.file)

  if (isCheckMode) {
    if (changedFiles.length > 0) {
      console.error('[sort-indexes] Found unsorted index exports:')
      for (const file of changedFiles) {
        console.error(`  - ${resolve(file)}`)
      }
      process.exitCode = 1
      return
    }
    console.log('[sort-indexes] All component index exports are sorted.')
    return
  }

  if (changedFiles.length > 0) {
    console.log('[sort-indexes] Updated indices:')
    for (const file of changedFiles) {
      console.log(`  - ${resolve(file)}`)
    }
  } else {
    console.log('[sort-indexes] All component index exports were already sorted.')
  }
}

main().catch(error => {
  console.error('[sort-indexes] Failed to process component indices.')
  console.error(error)
  process.exitCode = 1
})
