// ESLint Flat Config for ESLint v9
// Uses typescript-eslint + React Hooks + React Refresh
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // TypeScript recommended (includes base JS rules)
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Prefer alias imports over deep parent traversals
      'no-restricted-imports': [
        'warn',
        {
          patterns: ['../../*', '../../../*', '../../../../*'],
        },
      ],
      // Allow "any" as a warning (useful for mocks, interop, quick prototypes)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow console usage in this app
      'no-console': 'off',
      // Ignore unused args that start with underscore (e.g., _userId)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // React
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React Refresh (allow non-component exports by default)
      'react-refresh/only-export-components': 'off',
    },
  },
  // Allow Node/CommonJS style in Electron scripts
  {
    files: ['electron/**/*.{js,cjs,ts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs',
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },
]
