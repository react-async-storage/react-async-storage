module.exports = {
    root: true,
    extends: ['@sprylab/eslint-config/react'],
    parserOptions: {
        project: './tsconfig.json',
    },
    rules: {
        'jest/no-conditional-expect': 0,
    },
}
