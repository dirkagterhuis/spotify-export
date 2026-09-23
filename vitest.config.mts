import { defineConfig, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'server',
                    globals: true,
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                    setupFiles: ['src/__test__/setup.ts'],
                },
            },
            // The SPA brings its own config (React plugin, jsdom environment).
            'web/vite.config.mts',
        ],
        coverage: {
            include: ['src/**/*.ts', 'web/src/**/*.{ts,tsx}'],
            exclude: [
                'src/__test__/**',
                'web/src/test/**',
                '**/*.test.{ts,tsx}',
                ...coverageConfigDefaults.exclude,
            ],
            reporter: ['text', 'html', 'lcov', 'cobertura'],
            provider: 'istanbul',
        },
    },
})
