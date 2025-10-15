// Build Electron preload (TypeScript) to a JS file Electron can load
// Usage: node electron/preload/build-preload.cjs [--watch]

const path = require('path')
const esbuild = require('esbuild')

const watch = process.argv.includes('--watch')

const entry = path.join(__dirname, 'index.ts')
const outfile = path.join(__dirname, '..', 'main', 'preload.js')

/** @type {import('esbuild').BuildOptions} */
const common = {
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  external: ['electron', '@electron-toolkit/preload'],
}

async function run() {
  if (watch) {
    const ctx = await esbuild.context(common)
    await ctx.watch()
    console.log(
      '[preload] watching:',
      path.relative(process.cwd(), entry),
      '->',
      path.relative(process.cwd(), outfile),
    )
  } else {
    await esbuild.build(common)
    console.log('[preload] built:', path.relative(process.cwd(), outfile))
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
