/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'

const output = (type) => ({
    input: 'src/index.tsx',
    external: ['localforage', 'react', '@react-native-community/async-storage'],
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({
            useTsconfigDeclarationDir: true,
            tsconfigOverride: {
                includes: ['src'],
                exclude: ['__tests__', 'jest.setup.ts', 'dist'],
            },
        }),
        terser(),
    ],
    output: {
        exports: 'named',
        dir: `dist/${type}`,
        format: type,
        name: 'r-cache',
        sourcemap: true,
        globals: {
            'localforage': 'localforage',
            'react': 'React',
            '@react-native-community/async-storage': 'AsyncStorage',
        },
    },
})

export default [output('esm'), output('cjs'), output('umd')]
