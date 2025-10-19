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
    outDir: path.join(__dirname, 'Releases'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase limit to 1000 kB
    rollupOptions: {
      external: [],
      output: {
        format: 'es',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'framer': ['framer-motion'],
          'icons': ['lucide-react']
        },
      },
    },
  },
  base: process.env.NODE_ENV === 'production' ? './' : '/',
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
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime', 
      'react/jsx-dev-runtime',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react'
    ],
  },
})