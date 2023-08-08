import { resolve } from 'node:path'
import { rollup } from 'rollup'
import { getLogFilter } from 'rollup/getLogFilter'
import esbuild from 'rollup-plugin-esbuild'
import replace from '@rollup/plugin-replace'
import { dts } from 'rollup-plugin-dts'
import { exists } from '../utils/fs.js'
import { isObject } from '../utils/is.js'
import type { LogHandlerWithDefault } from 'rollup'
import type { Options as EsbuildOptions } from 'rollup-plugin-esbuild'
import type { RollupReplaceOptions } from '@rollup/plugin-replace'
import type { ConfigLoader } from '../types/cli/index.js'

const esbuildPlugin = esbuild.default ?? esbuild
const replacePlugin = replace.default ?? replace

export async function createBuilder(rootDir: string, config: ConfigLoader) {
  const { exports, entries, externals, replace, esbuild } = config

  const logFilter = getLogFilter(config.logFilter as string[])
  const onLog: LogHandlerWithDefault = (level, log, handler) => {
    if (logFilter(log)) handler(level, log)
  }

  const esbuildOptions: EsbuildOptions = {
    tsconfig: resolve(rootDir, 'tsconfig.json'),
    ...esbuild,
  }
  const replaceOptions: RollupReplaceOptions = {
    preventAssignment: true,
    ...replace,
  }

  const plugins = [esbuildPlugin(esbuildOptions)]
  if (replace) plugins.unshift(replacePlugin(replaceOptions))

  // auto builder
  if (!entries) {
    for (const [key, value] of Object.entries(exports)) {
      if (isObject(value)) {
        let srcJs = resolve(rootDir, 'src/index.js')
        let srcTs = resolve(rootDir, 'src/index.ts')
        let srcDts = resolve(rootDir, 'src/types/index.ts')

        if (key !== '.') {
          const dir = key.slice(2)
          srcJs = resolve(rootDir, `src/${dir}/index.js`)
          srcTs = resolve(rootDir, `src/${dir}/index.ts`)
          srcDts = resolve(rootDir, `src/types/${dir}/index.ts`)
        }

        const indexJs = await exists(srcJs)
        const srcFile = indexJs ? srcJs : srcTs

        if (value.import) {
          const builder = await rollup({
            input: srcFile,
            plugins,
            external: externals,
            onLog,
          })
          await builder.write({
            file: resolve(rootDir, value.import),
            format: 'esm',
          })
        }

        if (value.require) {
          const builder = await rollup({
            input: srcFile,
            plugins,
            external: externals,
            onLog,
          })
          await builder.write({
            file: resolve(rootDir, value.require),
            format: 'cjs',
          })
        }

        if (value.types) {
          const builder = await rollup({
            input: resolve(rootDir, srcDts),
            plugins: [dts()],
            onLog,
          })
          await builder.write({
            file: resolve(rootDir, value.types),
            format: 'esm',
          })
        }
      }
    }
  }

  // custom builder
  if (entries) {
    for (const entry of entries) {
      const builder = await rollup(entry)

      for await (const out of entry.output) await builder.write(out)
    }
  }
}
