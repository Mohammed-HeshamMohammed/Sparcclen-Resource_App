// Electron dev entry wrapper to run TypeScript main with ts-node in CommonJS mode
const path = require('path');
const tsnode = require('ts-node');

// Force CommonJS transpilation for Node/Electron main
tsnode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    target: 'ES2020',
  },
});

// Manually wire tsconfig-paths to the root tsconfig.json
const tsconfigPaths = require('tsconfig-paths');
const tsconfig = require(path.join(__dirname, '..', 'tsconfig.json'));
const baseUrl = path.join(__dirname, '..', tsconfig.compilerOptions?.baseUrl || '.');
tsconfigPaths.register({ baseUrl, paths: tsconfig.compilerOptions?.paths || {} });

require('./main/index.ts');
