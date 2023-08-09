import { resolve, parse } from 'node:path'
import { stat } from 'node:fs/promises'
import { rollup } from 'rollup'
import { getLogFilter } from 'rollup/getLogFilter'
import esbuild from 'rollup-plugin-esbuild'
import replace from '@rollup/plugin-replace'
import { dts } from 'rollup-plugin-dts'
import { exists } from '../utils/fs.js'
import { isObject } from '../utils/is.js'
import { logger } from '../utils/logger.js'
import type { LogHandlerWithDefault } from 'rollup'
import type { RollupReplaceOptions } from '@rollup/plugin-replace'
import type { ConfigLoader } from '../types/cli/index.js'

const esbuildPlugin = esbuild.default ?? esbuild
const replacePlugin = replace.default ?? replace

let bundleStats = {
  size: 0,
  files: 0,
}

async function parseOutputPath(value: string) {
  const distDir = value.split('/')[1]
  const inputDir = value.replace(distDir, 'src')
  const inputJs = inputDir.replace(parse(inputDir).ext, '.js')
  const inputTs = inputDir.replace(parse(inputDir).ext, '.ts')
  const fileJs = await exists(inputJs)

  return fileJs ? inputJs : inputTs
}

async function logOutputStat(rootDir: string, value: string) {
  const outputStat = await stat(resolve(rootDir, value))
  const parseExt = value.endsWith('.d.ts') ? '.dts' : parse(value).ext
  const ext = parseExt.slice(1).toUpperCase().padEnd(3)

  bundleStats.size = bundleStats.size + outputStat.size

  return logger.output(ext, value, outputStat.size)
}

export async function createBuilder(rootDir: string, config: ConfigLoader) {
  const {
    exports,
    entries,
    externals: external,
    esbuild: esbuildOptions,
    replace,
    dts: dtsOptions,
  } = config

  const logFilter = getLogFilter(config.logFilter as string[])
  const onLog: LogHandlerWithDefault = (level, log, handler) => {
    if (logFilter(log)) handler(level, log)
  }
  const replaceOptions: RollupReplaceOptions = {
    preventAssignment: true,
    ...replace,
  }
  const plugins = [esbuildPlugin(esbuildOptions)]
  if (replace) plugins.unshift(replacePlugin(replaceOptions))

  logger.start(config.type)
  const start = Date.now()

  if (!entries) {
    for (const value of Object.values(exports)) {
      if (isObject(value)) {
        if (value.import) {
          bundleStats.files++

          const input = await parseOutputPath(value.import)
          const builder = await rollup({
            input: resolve(rootDir, input),
            plugins,
            external,
            onLog,
          })
          await builder.write({
            file: resolve(rootDir, value.import),
            format: 'esm',
          })
          await logOutputStat(rootDir, value.import)
        }

        if (value.require) {
          bundleStats.files++

          const input = await parseOutputPath(value.require)
          const builder = await rollup({
            input: resolve(rootDir, input),
            plugins,
            external,
            onLog,
          })
          await builder.write({
            file: resolve(rootDir, value.require),
            format: 'cjs',
          })
          await logOutputStat(rootDir, value.require)
        }

        if (value.types) {
          bundleStats.files++

          const inputDir = value.types.split('/')[1]
          const input = value.types
            .replace(inputDir, 'src')
            .replace('.d.ts', '.ts')

          const builder = await rollup({
            input: resolve(rootDir, input),
            plugins: [dts(dtsOptions)],
            onLog,
          })
          await builder.write({
            file: resolve(rootDir, value.types),
            format: 'esm',
          })
          await logOutputStat(rootDir, value.types)
        }
      }
    }
  }

  if (entries) {
    for (const options of entries) {
      const builder = await rollup(options)

      for (const output of options.output) {
        await builder.write(output)
      }
    }
  }

  const end = Date.now()
  const time = end - start
  const { size, files } = bundleStats
  const suffix = files > 1 ? ' files' : ' file'

  logger.end({ time, size, files, suffix })
}
