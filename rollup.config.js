/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const output = (type) => ({
    input: 'src/index.tsx',
    external: ['localforage'],
    plugins: [
        typescript({
            useTsconfigDeclarationDir: false,
            tsconfigOverride: {
                includes: ['src'],
                exclude: ['node_modules', 'dist', '*.js', '*.ts', '__tests__'],
            },
        }),
        terser(),
    ],
    output: {
        exports: 'named',
        file:
            type === 'umd' ? 'dist/umd/index.min.js' : `dist/${type}/index.js`,
        format: type,
        name: 'r-cache',
        sourcemap: true,
        globals: {
            localforage: 'localforage',
        },
    },
})

export default [output('esm'), output('cjs'), output('umd')]
