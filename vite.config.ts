import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import electron from 'vite-plugin-electron/simple'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  root: path.join(__dirname, 'src'),
  envDir: __dirname,
  resolve: {
    alias: {
      // Provide empty mock for vm module to avoid vm-browserify's eval usage
      vm: path.resolve(__dirname, 'src/polyfills/vm-mock.js'),
    },
  },
  define: {
    // Provide global for libraries that need it
    global: 'globalThis',
  },
  build: {
    outDir: path.join(__dirname, 'dist-electron', 'renderer'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB
    rollupOptions: {
      external: (id) => {
        if (id.includes('shared-array-buffer')) return true
        return false
      },
      output: {
        manualChunks: (id) => {
          // Split Supabase into its own chunk (large library)
          if (id.includes('@supabase')) {
            return 'supabase'
          }
          
          // Split React and React-DOM into vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          
          // Split Framer Motion (animations)
          if (id.includes('framer-motion')) {
            return 'framer'
          }
          
          // Split Lucide icons
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          
          // Split crypto and OTP libraries
          if (id.includes('@otplib') || id.includes('crypto-js')) {
            return 'crypto'
          }
          
          // All other node_modules go into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),
    nodePolyfills({
      // Whether to polyfill specific globals
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill `node:` protocol imports
      protocolImports: true,
      // Exclude vm to use our custom mock instead
      exclude: ['vm'],
    }),
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