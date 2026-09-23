import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
    {
        files: ['**/*.{ts,tsx,mts}'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                // Uses the nearest tsconfig per file: the root one for the server, web/ for the SPA.
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: { arguments: false } },
            ],
        },
    },
    {
        files: ['web/**/*.{ts,tsx,mts}'],
        ...reactHooks.configs.flat.recommended,
    },
    {
        ignores: ['dist/**', 'web/dist/**', 'coverage/**', 'node_modules/**'],
    },
]
