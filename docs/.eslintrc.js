module.exports = {
    overrides: {
        files: ['**/*.js', '*.js'],
        parserOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            ecmaFeatures: {
                jsx: true,
            },
        },
        extends: [
            'eslint:recommended',
            'plugin:import/errors',
            'plugin:import/warnings',
            'plugin:sonarjs/recommended',
            'plugin:prettier/recommended',
        ],
    },
}
