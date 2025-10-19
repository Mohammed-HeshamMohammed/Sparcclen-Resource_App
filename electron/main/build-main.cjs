// Build Electron main process (TypeScript) to JS for production
// Usage: node electron/main/build-main.cjs

const path = require('path')
const esbuild = require('esbuild')

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })

const entry = path.join(__dirname, 'index.ts')
const outfile = path.join(__dirname, 'index.js')

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  external: [
    'electron',
    '@electron-toolkit/preload'
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
    'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '')
  }
}

async function build() {
  try {
    await esbuild.build(options)
    console.log('[main] built:', path.relative(process.cwd(), outfile))
  } catch (error) {
    console.error('[main] build failed:', error)
    process.exit(1)
  }
}

build()