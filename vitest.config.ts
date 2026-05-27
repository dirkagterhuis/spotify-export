import { defineConfig, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['src/__test__/setup.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: [
                'src/__test__/**',
                'src/**/*.test.ts',
                ...coverageConfigDefaults.exclude,
            ],
            reporter: ['text', 'html', 'lcov', 'cobertura'],
            provider: 'istanbul',
        },
    },
})
