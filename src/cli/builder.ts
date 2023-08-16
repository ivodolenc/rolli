import { resolve, parse } from 'node:path'
import { stat } from 'node:fs/promises'
import { rollup } from 'rollup'
import _replace from '@rollup/plugin-replace'
import _json from '@rollup/plugin-json'
import _resolve from '@rollup/plugin-node-resolve'
import _esbuild from 'rollup-plugin-esbuild'
import { dts as dtsPlugin } from 'rollup-plugin-dts'
import { exists } from '../utils/fs.js'
import { isObject, isString } from '../utils/is.js'
import { logger } from '../utils/logger.js'
import type { ModuleFormat } from 'rollup'
import type {
  ConfigLoader,
  ArgsOptions,
  PluginLog,
} from '../types/cli/index.js'

const replacePlugin = _replace.default ?? _replace
const jsonPlugin = _json.default ?? _json
const resolvePlugin = _resolve.default ?? _resolve
const esbuildPlugin = _esbuild.default ?? _esbuild

let bundleStats = {
  start: 0,
  end: 0,
  size: 0,
  files: 0,
}

async function getInputPath(srcDir: string, output: string) {
  const outputDir = output.split('/')[1]
  const inputDir = output.replace(outputDir, srcDir)
  const inputJs = inputDir.replace(parse(inputDir).ext, '.js')
  const inputTs = inputDir.replace(parse(inputDir).ext, '.ts')
  const fileJs = await exists(inputJs)

  return fileJs ? inputJs : inputTs
}

async function logOutputStat(
  rootDir: string,
  output: string,
  pluginLog?: PluginLog,
) {
  const outputStat = await stat(resolve(rootDir, output))
  const parseExt = output.endsWith('.d.ts') ? '.dts' : parse(output).ext
  const ext = parseExt.slice(1).toUpperCase().padEnd(3)

  bundleStats.size = bundleStats.size + outputStat.size

  logger.output(ext, output, outputStat.size)
  if (pluginLog) logger.plugin(pluginLog)
}

function isExtAllowed(value: string) {
  const outputExtensions = ['.js', '.mjs', '.cjs']

  return outputExtensions.some((ext) => value.endsWith(ext))
}

export async function createBuilder(
  rootDir: string,
  args: ArgsOptions,
  config: ConfigLoader,
) {
  const { srcDir } = config

  logger.start(config.type)
  bundleStats.start = Date.now()

  if (config.exports || config.bin) {
    const esbuildOptions: typeof config.esbuild = {
      minify: args.minify || config.minify,
      tsconfig: args.tsconfig || config.tsconfig,
      ...config.esbuild,
    }

    const dtsOptions: typeof config.dts = {
      tsconfig: args.tsconfig || config.tsconfig,
      ...config.dts,
    }

    const plugins = [esbuildPlugin(esbuildOptions)]

    if (config.json) {
      const options = isObject(config.json) ? config.json : undefined
      plugins.push(jsonPlugin(options))
    }

    if (config.replace) {
      plugins.unshift(replacePlugin(config.replace))
    }

    if (config.resolve) {
      const options = isObject(config.resolve) ? config.resolve : undefined
      plugins.unshift(resolvePlugin(options))
    }

    const builderOptions = {
      plugins,
      external: config.externals,
    }

    if (config.exports) {
      for (const value of Object.values(config.exports)) {
        if (isString(value) && isExtAllowed(value)) {
          bundleStats.files++

          let pluginLog: PluginLog | undefined
          const output = value
          let format: ModuleFormat = 'esm'
          if (output.endsWith('.cjs')) format = 'cjs'

          const input = await getInputPath(srcDir, output)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...builderOptions,
            onLog: (level, log) => {
              pluginLog = { level, log }
            },
          })
          await builder.write({
            file: resolve(rootDir, output),
            format,
          })
          await logOutputStat(rootDir, output, pluginLog)
        }

        if (isObject(value)) {
          if (value.import && isExtAllowed(value.import)) {
            bundleStats.files++

            let pluginLog: PluginLog | undefined
            const output = value.import
            const input = await getInputPath(srcDir, output)
            const builder = await rollup({
              input: resolve(rootDir, input),
              ...builderOptions,
              onLog: (level, log) => {
                pluginLog = { level, log }
              },
            })
            await builder.write({
              file: resolve(rootDir, output),
              format: 'esm',
            })
            await logOutputStat(rootDir, output, pluginLog)
          }

          if (value.require && isExtAllowed(value.require)) {
            bundleStats.files++

            let pluginLog: PluginLog | undefined
            const output = value.require
            const input = await getInputPath(srcDir, output)
            const builder = await rollup({
              input: resolve(rootDir, input),
              ...builderOptions,
              onLog: (level, log) => {
                pluginLog = { level, log }
              },
            })
            await builder.write({
              file: resolve(rootDir, output),
              format: 'cjs',
            })
            await logOutputStat(rootDir, output, pluginLog)
          }

          if (value.types && value.types.endsWith('.d.ts')) {
            bundleStats.files++

            let pluginLog: PluginLog | undefined
            const output = value.types
            const inputDir = output.split('/')[1]
            const input = output
              .replace(inputDir, 'src')
              .replace('.d.ts', '.ts')

            const builder = await rollup({
              input: resolve(rootDir, input),
              plugins: [dtsPlugin(dtsOptions)],
              onLog: (level, log) => {
                pluginLog = { level, log }
              },
            })
            await builder.write({
              file: resolve(rootDir, output),
              format: 'esm',
            })
            await logOutputStat(rootDir, output, pluginLog)
          }
        }
      }
    }

    if (isString(config.bin) && isExtAllowed(config.bin)) {
      bundleStats.files++

      let pluginLog: PluginLog | undefined
      const output = config.bin
      let format: ModuleFormat = 'esm'
      if (output.endsWith('.cjs')) format = 'cjs'

      const input = await getInputPath(srcDir, output)
      const builder = await rollup({
        input: resolve(rootDir, input),
        ...builderOptions,
        onLog: (level, log) => {
          pluginLog = { level, log }
        },
      })
      await builder.write({
        file: resolve(rootDir, output),
        format,
        banner: '#!/usr/bin/env node',
      })
      await logOutputStat(rootDir, output, pluginLog)
    }

    if (isObject(config.bin)) {
      for (const value of Object.values(config.bin)) {
        if (isExtAllowed(value)) {
          bundleStats.files++

          let pluginLog: PluginLog | undefined
          const output = value
          let format: ModuleFormat = 'esm'
          if (output.endsWith('.cjs')) format = 'cjs'

          const input = await getInputPath(srcDir, output)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...builderOptions,
            onLog: (level, log) => {
              pluginLog = { level, log }
            },
          })
          await builder.write({
            file: resolve(rootDir, output),
            format,
            banner: '#!/usr/bin/env node',
          })
          await logOutputStat(rootDir, output, pluginLog)
        }
      }
    }
  }

  if (config.entries) {
    for (const entry of config.entries) {
      bundleStats.files++

      const entryEsbuild: typeof entry.esbuild = {
        minify: args.minify || config.minify,
        tsconfig: args.tsconfig || config.tsconfig,
        ...entry.esbuild,
      }

      const entryDts: typeof entry.dts = {
        tsconfig: args.tsconfig || config.tsconfig,
        ...entry.dts,
      }

      const entriesPlugins = [esbuildPlugin(entryEsbuild)]

      if (entry.json) {
        const options = isObject(entry.json) ? entry.json : undefined
        entriesPlugins.push(jsonPlugin(options))
      }

      if (entry.replace) {
        entriesPlugins.unshift(replacePlugin(entry.replace))
      }

      if (entry.resolve) {
        const options = isObject(entry.resolve) ? entry.resolve : undefined
        entriesPlugins.unshift(resolvePlugin(options))
      }

      let pluginLog: PluginLog | undefined
      const format = entry.format || 'esm'
      const external = config.externals || entry.externals
      const banner = entry.banner
      const footer = entry.footer

      if (entry.output.endsWith('.d.ts')) {
        const builder = await rollup({
          input: resolve(rootDir, entry.input),
          external,
          plugins: [dtsPlugin(entryDts)],
          onLog: (level, log) => {
            pluginLog = { level, log }
          },
        })
        await builder.write({
          file: resolve(rootDir, entry.output),
          format,
          banner,
          footer,
        })
      } else {
        const builder = await rollup({
          input: resolve(rootDir, entry.input),
          external,
          plugins: entriesPlugins,
          onLog: (level, log) => {
            pluginLog = { level, log }
          },
        })
        await builder.write({
          file: resolve(rootDir, entry.output),
          format,
          banner,
          footer,
        })
      }
      await logOutputStat(rootDir, entry.output, pluginLog)
    }
  }

  if (config.rollup) {
    for (const options of config.rollup) {
      const builder = await rollup(options)

      for (const output of options.output) {
        bundleStats.files++

        await builder.write(output)
        await logOutputStat(rootDir, output.file as string)
      }
    }
  }

  bundleStats.end = Date.now()

  logger.end({
    time: bundleStats.end - bundleStats.start,
    size: bundleStats.size,
    files: bundleStats.files,
  })
}
