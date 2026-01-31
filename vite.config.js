import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'https://api.heygen.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api/, '/v2/photo'),
                configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        // Forward the X-Api-Key header
                        const apiKey = req.headers['x-api-key'];
                        if (apiKey) {
                            proxyReq.setHeader('X-Api-Key', apiKey);
                        }
                    });
                },
            },
        },
    },
})

