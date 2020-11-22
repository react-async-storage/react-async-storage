module.exports = {
    setupFiles: ['<rootDir>/jest.setup.ts'],
    collectCoverageFrom: ['src/**/*.*'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    cacheDirectory: '.jest/cache',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
}
