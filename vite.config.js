import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // ⚠️ ORDER MATTERS: /api/heygen-upload MUST come before /api/heygen
            // because /api/heygen is a prefix of /api/heygen-upload
            '/api/heygen-upload': {
                target: 'https://upload.heygen.com',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api\/heygen-upload/, '')
            },
            '/api/heygen': {
                target: 'https://api.heygen.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/heygen/, '')
            }
        },
    },
})

