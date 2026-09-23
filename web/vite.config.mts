import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves 404.html for any path without a matching file, e.g. /about.
// Making that a copy of index.html boots the app there, and React Router renders the right page.
function githubPagesSpaFallback(): Plugin {
    return {
        name: 'github-pages-spa-fallback',
        apply: 'build',
        writeBundle({ dir }) {
            if (!dir) {
                return
            }
            copyFileSync(join(dir, 'index.html'), join(dir, '404.html'))
        },
    }
}

export default defineConfig({
    plugins: [react(), githubPagesSpaFallback()],
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
