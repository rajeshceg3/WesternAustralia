import globals from 'globals';
import pluginJest from 'eslint-plugin-jest';

export default [
    {
        ignores: ['assets/', 'dist/', 'coverage/'],
    },
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'no-unused-vars': 'error',
            'no-console': 'warn',
            semi: ['error', 'always'],
        },
    },
    {
        files: ['tests/**/*.js'],
        plugins: { jest: pluginJest },
        languageOptions: {
            globals: pluginJest.environments.globals.globals,
        },
        rules: {
            ...pluginJest.configs['flat/recommended'].rules,
            'no-unused-vars': 'off', // Allow unused vars in tests for mocks
        },
    },
];
