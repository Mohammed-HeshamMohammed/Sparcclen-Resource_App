// Dev-only wrapper to run TypeScript preload via ts-node
try {
  const tsnode = require('ts-node')
  tsnode.register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs',
      esModuleInterop: true,
      target: 'ES2020',
    },
  })
} catch (e) {
  console.error('[preload/register] Failed to register ts-node for preload:', e)
}

require('./index.ts')
