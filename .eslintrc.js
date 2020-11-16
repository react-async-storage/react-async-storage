module.exports = {
    root: true,
    env: {
        es2020: true,
        node: true,
        browser: true,
    },
    plugins: ['jest', 'sort-imports-es6-autofix'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:jest/recommended',
        'plugin:prettier/recommended',
        'prettier/@typescript-eslint',
    ],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-unsafe-assignment': 0,
        '@typescript-eslint/prefer-nullish-coalescing': 2,
        '@typescript-eslint/prefer-optional-chain': 2,
        '@typescript-eslint/no-floating-promises': [
            'error',
            { ignoreIIFE: true, ignoreVoid: true },
        ],
        'sort-imports-es6-autofix/sort-imports-es6': 2,
    },
    overrides: [
        {
            files: [
                '*.{spec,test}.{ts,tsx}',
                '**/__{mocks,tests}__/**/*.{ts,tsx}',
            ],
            env: {
                'jest': true,
                'jest/globals': true,
            },
        },
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
}
