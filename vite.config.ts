import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // BlockNote is ~1.5 MB; it's lazy-loaded so the warning is cosmetic
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          'blocknote': [
            '@blocknote/core',
            '@blocknote/react',
            '@blocknote/shadcn',
          ],
          'vendor': [
            'react',
            'react-dom',
            'react-router',
          ],
          'dnd': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
        },
      },
    },
  },
})
