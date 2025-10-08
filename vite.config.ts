import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  root: path.join(__dirname, 'src'),
  envDir: __dirname,
  build: {
    outDir: path.join(__dirname, 'dist-electron', 'renderer'),
    emptyOutDir: true,
    rollupOptions: {
      external: (id) => {
        if (id.includes('shared-array-buffer')) return true
        return false
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    electron({
      main: {
        entry: path.join(__dirname, 'electron/main/index.ts'),
        onstart({ startup }) {
          // Auto-launch Electron after main bundle is ready
          // IMPORTANT: our Vite root is `src/`, so we must run Electron from project root
          // Otherwise Electron starts in the wrong CWD and shows the default splash
          startup(['.'], {
            cwd: __dirname,
            env: {
              ...process.env,
              VITE_DEV_SERVER_URL: process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173',
            },
          })
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              output: {
                entryFileNames: 'index.js',
              },
              external: ['electron', 'react', 'react-dom'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              output: {
                entryFileNames: 'preload.js',
              },
              external: ['electron', 'react', 'react-dom'],
            },
          },
        },
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
})
