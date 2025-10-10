import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  root: path.join(__dirname, 'src'),
  envDir: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
  ],
  server: {
    port: 5175,
    host: '127.0.0.1',
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
})