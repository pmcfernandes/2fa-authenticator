import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'src/renderer',
  base: './',
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true
  },
  build: {
    outDir: '../../out/renderer',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve('src/renderer/src')
    }
  },
  plugins: [react()]
})
