import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/heygen': {
                target: 'https://api.heygen.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/heygen/, '')
            },
            '/api/heygen-upload': {
                target: 'https://upload.heygen.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/heygen-upload/, '')
            }
        },
    },
})

