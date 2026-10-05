import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
      
    }),
  ],
  server: {
    proxy: {
      "/usuario": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/comentario": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/hacker-malvadao": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
