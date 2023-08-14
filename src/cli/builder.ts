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
import type { ConfigLoader, PluginLog } from '../types/cli/index.js'

const replacePlugin = _replace.default ?? _replace
const jsonPlugin = _json.default ?? _json
const resolvePlugin = _resolve.default ?? _resolve
const esbuildPlugin = _esbuild.default ?? _esbuild

let bundleStats = {
  size: 0,
  files: 0,
}

async function getInputPath(srcDir: string, value: string) {
  const outputDir = value.split('/')[1]
  const inputDir = value.replace(outputDir, srcDir)
  const inputJs = inputDir.replace(parse(inputDir).ext, '.js')
  const inputTs = inputDir.replace(parse(inputDir).ext, '.ts')
  const fileJs = await exists(inputJs)

  return fileJs ? inputJs : inputTs
}

async function logOutputStat(
  rootDir: string,
  value: string,
  pluginLog?: PluginLog,
) {
  const outputStat = await stat(resolve(rootDir, value))
  const parseExt = value.endsWith('.d.ts') ? '.dts' : parse(value).ext
  const ext = parseExt.slice(1).toUpperCase().padEnd(3)

  bundleStats.size = bundleStats.size + outputStat.size

  logger.output(ext, value, outputStat.size)
  if (pluginLog) logger.plugin(pluginLog)
}

function isExtAllowed(value: string) {
  const outputExtensions = ['.js', '.mjs', '.cjs']

  return outputExtensions.some((ext) => value.endsWith(ext))
}

export async function createBuilder(rootDir: string, config: ConfigLoader) {
  const {
    srcDir,
    exports,
    bin,
    entries,
    externals: external,
    rollup: rollupOptions,
    json: jsonOptions,
    replace: replaceOptions,
    resolve: resolveOptions,
    esbuild: esbuildOptions,
    dts: dtsOptions,
  } = config

  const plugins = [esbuildPlugin(esbuildOptions)]

  if (jsonOptions) {
    const options = isObject(jsonOptions) ? jsonOptions : undefined
    plugins.push(jsonPlugin(options))
  }

  if (replaceOptions) {
    plugins.unshift(replacePlugin(replaceOptions))
  }

  if (resolveOptions) {
    const options = isObject(resolveOptions) ? resolveOptions : undefined
    plugins.unshift(resolvePlugin(options))
  }

  const builderOptions = {
    plugins,
    external,
  }

  logger.start(config.type)
  const start = Date.now()

  if (exports) {
    for (const value of Object.values(exports)) {
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
          const input = output.replace(inputDir, 'src').replace('.d.ts', '.ts')

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

  if (isString(bin) && isExtAllowed(bin)) {
    bundleStats.files++

    let pluginLog: PluginLog | undefined
    const output = bin
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

  if (isObject(bin)) {
    for (const value of Object.values(bin)) {
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

  if (entries) {
    for (const entry of entries) {
      bundleStats.files++

      const entriesPlugins = [esbuildPlugin(entry.esbuild)]

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

      if (entry.output.endsWith('.d.ts')) {
        const builder = await rollup({
          input: resolve(rootDir, entry.input),
          external: external || entry.externals,
          plugins: [dtsPlugin(entry.dts)],
          onLog: (level, log) => {
            pluginLog = { level, log }
          },
        })
        await builder.write({
          file: resolve(rootDir, entry.output),
          format,
          banner: entry.banner,
          footer: entry.footer,
        })
      } else {
        const builder = await rollup({
          input: resolve(rootDir, entry.input),
          external: external || entry.externals,
          ...entriesPlugins,
          onLog: (level, log) => {
            pluginLog = { level, log }
          },
        })
        await builder.write({
          file: resolve(rootDir, entry.output),
          format,
          banner: entry.banner,
          footer: entry.footer,
        })
      }

      await logOutputStat(rootDir, entry.output, pluginLog)
    }
  }

  if (rollupOptions) {
    for (const options of rollupOptions) {
      const builder = await rollup(options)

      for (const output of options.output) {
        bundleStats.files++

        await builder.write(output)
        await logOutputStat(rootDir, output.file as string)
      }
    }
  }

  const end = Date.now()
  const time = end - start

  logger.end({
    time,
    size: bundleStats.size,
    files: bundleStats.files,
  })
}
