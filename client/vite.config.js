import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'clsx': path.resolve(__dirname, './src/lib/shims/clsx.js'),
      'tailwind-merge': path.resolve(__dirname, './src/lib/shims/tailwind-merge.js'),
      'class-variance-authority': path.resolve(__dirname, './src/lib/shims/cva.js'),
      '@radix-ui/react-slot': path.resolve(__dirname, './src/lib/shims/radix-slot.js'),
    },
  },
})
