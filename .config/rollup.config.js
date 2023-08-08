import { defineConfig } from 'rollup'
import { getLogFilter } from 'rollup/getLogFilter'
import replace from '@rollup/plugin-replace'
import esbuild from 'rollup-plugin-esbuild'
import { dts } from 'rollup-plugin-dts'
import pkg from '../package.json' assert { type: 'json' }

const logFilter = getLogFilter(['!code:CIRCULAR_DEPENDENCY'])
const onLog = (level, log, handler) => {
  if (logFilter(log)) handler(level, log)
}

const external = [...Object.keys(pkg.dependencies), /node:/, /rollup/]
const tsconfig = './node_modules/configshare/tsconfig.json'

const exports = {
  main: pkg.exports['.'],
  cli: pkg.exports['./cli'],
}

const replaceOptions = {
  preventAssignment: true,
  __name__: pkg.name.toUpperCase(),
  __version__: pkg.version,
}

export default defineConfig([
  {
    input: './src/index.ts',
    output: [{ file: exports.main.import, format: 'esm' }],
    plugins: [esbuild({ tsconfig })],
    external,
  },
  {
    input: './src/cli/index.ts',
    output: [
      {
        file: exports.cli.import,
        format: 'esm',
        banner: '#!/usr/bin/env node',
      },
    ],
    plugins: [replace(replaceOptions), esbuild({ tsconfig })],
    external,
  },
  {
    input: './src/types/index.ts',
    output: { file: exports.main.types, format: 'esm' },
    plugins: [dts()],
    onLog,
  },
])
