// Dev-only wrapper to run TypeScript preload via ts-node
const path = require('path')

try {
  const tsnode = require('ts-node')
  tsnode.register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      moduleResolution: 'node',
      esModuleInterop: true,
      target: 'ES2020',
    },
  })

  const tsconfigPaths = require('tsconfig-paths')
  const projectRoot = path.join(__dirname, '..', '..')
  const tsconfig = require(path.join(projectRoot, 'tsconfig.json'))
  const baseUrl = path.join(projectRoot, tsconfig.compilerOptions?.baseUrl ?? '.')
  tsconfigPaths.register({
    baseUrl,
    paths: tsconfig.compilerOptions?.paths ?? {},
  })
} catch (error) {
  console.error('[preload/dev-register] Failed to register ts-node for preload:', error)
}

require('./index.ts')
