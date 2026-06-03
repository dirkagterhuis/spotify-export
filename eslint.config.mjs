import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsparser,
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
    {
        ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
    },
]
