import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'


// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    mkcert()
  ],
  server: {
    host: '0.0.0.0',
    port: 8000,
    proxy: {
      "/graphql": {
        target: "http://localhost:8080", // Apollo Router in Docker
        changeOrigin: true,
        secure: false
      }
    }
  }
})
