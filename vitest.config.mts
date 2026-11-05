import { defineConfig, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
    test: {
        // The SPA brings its own config (React plugin, jsdom environment). A project list, so a
        // second one (the Lambda of Phase B) can be added next to it.
        projects: ['web/vite.config.mts'],
        coverage: {
            include: ['web/src/**/*.{ts,tsx}'],
            exclude: ['web/src/test/**', '**/*.test.{ts,tsx}', ...coverageConfigDefaults.exclude],
            reporter: ['text', 'html', 'lcov', 'cobertura'],
            provider: 'istanbul',
        },
    },
})
