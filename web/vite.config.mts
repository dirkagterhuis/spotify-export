import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    plugins: [react()],
    // Fixed host + port so the Spotify redirect URI we register in step 7 stays stable.
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
    },
    preview: {
        host: '127.0.0.1',
        port: 4173,
        strictPort: true,
    },
    test: {
        name: 'web',
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
})
