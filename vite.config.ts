import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePrerenderPlugin({
      prerenderScript: path.resolve(__dirname, 'src/entry-server.tsx'),
      renderTarget: '#root',
      additionalPrerenderRoutes: [
        '/festival/dmz-peacetrain-2026',
        '/festival/yeonghee-2026',
        '/festival/beautiful-mint-life-2026',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
