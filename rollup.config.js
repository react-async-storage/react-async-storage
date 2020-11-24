/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { terser } from 'rollup-plugin-terser'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

const input = 'src/index.ts'
const output = (type) => ({
    output: {
        exports: 'named',
        file:
            type === 'umd' ? 'dist/umd/index.min.js' : `dist/${type}/index.js`,
        format: type,
        name: 'r-cache',
        sourcemap: true,
        globals: {
            'localforage': 'localforage',
            '@react-native-community/async-storage': 'asyncStorage',
        },
    },
})
const external = ['localforage', '@react-native-community/async-storage ']
const plugins = [
    nodeResolve({
        browser: true,
        customResolveOptions: {
            moduleDirectory: 'node_modules',
        },
    }),
    commonjs({
        include: 'node_modules/**',
    }),
    typescript({
        useTsconfigDeclarationDir: false,
        tsconfigOverride: {
            include: ['src'],
            exclude: ['node_modules', 'dist'],
        },
    }),
    terser(),
]

export default [
    {
        input,
        external,
        ...output('esm'),
        plugins,
    },
    {
        input,
        external,
        ...output('cjs'),
        plugins,
    },
    {
        input,
        external,
        ...output('umd'),
        plugins,
    },
]
