// Electron dev entry wrapper to run TypeScript main with ts-node in CommonJS mode
const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })
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
const tsconfig = require(path.join(__dirname, '..', '..', 'tsconfig.json'))
const baseUrl = path.join(__dirname, '..', '..', tsconfig.compilerOptions?.baseUrl || '.')
tsconfigPaths.register({ baseUrl, paths: tsconfig.compilerOptions?.paths || {} })

require('./index.ts')
