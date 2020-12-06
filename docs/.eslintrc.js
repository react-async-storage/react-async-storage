module.exports = {
    root: true,
    env: { node: true, browser: true },
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:sonarjs/recommended',
        'plugin:prettier/recommended',
    ],
}
