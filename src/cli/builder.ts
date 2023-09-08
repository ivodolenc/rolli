import { resolve, parse } from 'node:path'
import { stat } from 'node:fs/promises'
import { isString, isObject, isBoolean, isArray } from 'utills'
import { cl, lime, cyan, darken, pink } from 'colorate'
import { rollup } from 'rollup'
import { getLogFilter } from 'rollup/getLogFilter'
import _replace from '@rollup/plugin-replace'
import _json from '@rollup/plugin-json'
import _resolve from '@rollup/plugin-node-resolve'
import _esbuild from 'rollup-plugin-esbuild'
import { dts as dtsPlugin } from 'rollup-plugin-dts'
import {
  logger,
  formatBytes,
  formatMs,
  getInputPath,
  isPathAllowed,
  getLongestOutput,
  excludeExportsPaths,
  excludeBinPaths,
} from '../utils/index.js'
import type { InputOptions, ModuleFormat, Plugin } from 'rollup'
import type { Plugins } from '../types/index.js'
import type {
  ConfigLoader,
  ArgsOptions,
  OutputLogs,
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

async function logOutputStat(
  start: number,
  rootDir: string,
  format: string,
  output: string,
  outputLength: number,
  logs?: OutputLogs[],
) {
  const end = Date.now()
  const done = end - start
  const outputStat = await stat(resolve(rootDir, output))
  bundleStats.size = bundleStats.size + outputStat.size

  if (format.includes('system')) format = 'sys'
  if (format === 'commonjs') format = 'cjs'
  if (format === 'module') format = 'esm'

  const fileFormat = format.toUpperCase().padEnd(4)

  if (logs && logs.length) {
    for (const value of logs) {
      const { level, log } = value
      const pluginName = log.plugin ? pink(`(${log.plugin}) `) : ''

      cl(pink(`! ${level}`), darken(output), pluginName + log.message)
    }
  }

  cl(
    cyan('>'),
    fileFormat,
    darken(output.padEnd(outputLength)),
    ' → ',
    darken('Done in'),
    cyan(formatMs(done).padEnd(6)),
    darken('Size'),
    lime(formatBytes(outputStat.size)),
  )
}

export async function createBuilder(
  rootDir: string,
  args: ArgsOptions,
  config: ConfigLoader,
) {
  logger.start(config.type)
  bundleStats.start = Date.now()

  const outputLength = getLongestOutput(config)
  const typesExts = ['.d.ts', '.d.mts', '.d.cts']

  if (config.exportsPaths && config.exports !== false) {
    const exportsOptions = isObject(config.exports) ? config.exports : undefined
    const exports = {
      srcDir: 'src',
      externals: config.externals,
      ...exportsOptions,
    }

    const logFilter = getLogFilter(exports.logFilter || [])

    const exportsPaths = exports.exclude
      ? excludeExportsPaths(config.exportsPaths, exports.exclude)
      : config.exportsPaths

    const exportsMinify = isBoolean(exports.minify)
      ? exports.minify
      : isBoolean(config.minify) || args.minify

    const exportsTsconfig = exports.tsconfig
      ? exports.tsconfig
      : config.tsconfig || args.tsconfig

    const esbuildOptions: Plugins['esbuild'] = {
      minify: exportsMinify,
      tsconfig: exportsTsconfig,
      ...exports.esbuild,
    }

    const dtsOptions: Plugins['dts'] = {
      tsconfig: exportsTsconfig,
      ...exports.dts,
    }

    const defaultPlugins: Plugin[] = [esbuildPlugin(esbuildOptions)]

    const startPlugins: Plugin[] =
      exports.plugins && !isArray(exports.plugins) ? exports.plugins.start : []

    const endPlugins: Plugin[] =
      exports.plugins && !isArray(exports.plugins) ? exports.plugins.end : []

    if (exports.json) {
      const jsonOptions = isObject(exports.json) ? exports.json : undefined
      defaultPlugins.push(jsonPlugin(jsonOptions))
    }

    if (exports.replace) {
      defaultPlugins.unshift(replacePlugin(exports.replace))
    }

    if (exports.resolve) {
      const resolveOptions = isObject(exports.resolve)
        ? exports.resolve
        : undefined
      defaultPlugins.unshift(resolvePlugin(resolveOptions))
    }

    if (isArray(exports.plugins)) defaultPlugins.push(...exports.plugins)

    const exportsPlugins: Plugin[] = [
      ...startPlugins,
      ...defaultPlugins,
      ...endPlugins,
    ]

    const exportsBuilder: InputOptions = {
      external: exports.externals,
      plugins: exportsPlugins,
    }

    for (const value of Object.values(exportsPaths)) {
      if (isString(value) && isPathAllowed(value)) {
        bundleStats.files++
        const start = Date.now()

        const output = value
        const outputLogs: OutputLogs[] = []

        let format: ModuleFormat = 'esm'
        if (output.endsWith('.cjs')) format = 'cjs'

        const input = await getInputPath(
          exports.srcDir,
          output,
          exports.matcher?.default,
        )
        const builder = await rollup({
          input: resolve(rootDir, input),
          ...exportsBuilder,
          onLog: (level, log) => {
            if (logFilter(log)) outputLogs.push({ level, log })
          },
        })
        await builder.write({
          file: resolve(rootDir, output),
          format,
        })
        await logOutputStat(
          start,
          rootDir,
          format,
          output,
          outputLength,
          outputLogs,
        )
      }

      if (isObject(value)) {
        if (value.import && isPathAllowed(value.import)) {
          bundleStats.files++
          const start = Date.now()

          const output = value.import
          const outputLogs: OutputLogs[] = []

          const input = await getInputPath(
            exports.srcDir,
            output,
            exports.matcher?.import,
          )
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...exportsBuilder,
            onLog: (level, log) => {
              if (logFilter(log)) outputLogs.push({ level, log })
            },
          })
          await builder.write({
            file: resolve(rootDir, output),
            format: 'esm',
          })
          await logOutputStat(
            start,
            rootDir,
            'esm',
            output,
            outputLength,
            outputLogs,
          )
        }

        if (value.require && isPathAllowed(value.require)) {
          bundleStats.files++
          const start = Date.now()

          const output = value.require
          const outputLogs: OutputLogs[] = []

          const input = await getInputPath(
            exports.srcDir,
            output,
            exports.matcher?.require,
          )
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...exportsBuilder,
            onLog: (level, log) => {
              if (logFilter(log)) outputLogs.push({ level, log })
            },
          })
          await builder.write({
            file: resolve(rootDir, output),
            format: 'cjs',
          })
          await logOutputStat(
            start,
            rootDir,
            'cjs',
            output,
            outputLength,
            outputLogs,
          )
        }

        if (value.types && isPathAllowed(value.types, typesExts)) {
          bundleStats.files++
          const start = Date.now()

          const output = value.types
          const outputLogs: OutputLogs[] = []
          const matcher = exports.matcher?.types

          let outputExt = '.d.ts'
          let format: ModuleFormat = 'esm'

          if (output.endsWith('.d.mts')) outputExt = '.d.mts'
          if (output.endsWith('.d.cts')) {
            outputExt = '.d.cts'
            format = 'cjs'
          }

          const outputDir = output.split('/')[1]
          const outputPath = output.replace(outputDir, exports.srcDir)
          let input = ''

          if (!matcher) {
            input = outputPath.replace(outputExt, '.ts')
          } else {
            const outputBase = parse(outputPath).base
            input = outputPath.replace(outputBase, `${matcher}.ts`)
          }

          const builder = await rollup({
            input: resolve(rootDir, input),
            plugins: [dtsPlugin(dtsOptions)],
            onLog: (level, log) => {
              if (logFilter(log)) outputLogs.push({ level, log })
            },
          })
          await builder.write({
            file: resolve(rootDir, output),
            format,
          })
          await logOutputStat(
            start,
            rootDir,
            'dts',
            output,
            outputLength,
            outputLogs,
          )
        }
      }
    }
  }

  if (config.binPaths && config.bin !== false) {
    const binOptions = isObject(config.bin) ? config.bin : undefined
    const bin = {
      srcDir: 'src',
      externals: config.externals,
      ...binOptions,
    }

    const logFilter = getLogFilter(bin.logFilter || [])

    const binPaths = bin.exclude
      ? excludeBinPaths(config.binPaths, bin.exclude)
      : config.binPaths

    const binMinify = isBoolean(bin.minify)
      ? bin.minify
      : isBoolean(config.minify) || args.minify

    const binTsconfig = bin.tsconfig
      ? bin.tsconfig
      : config.tsconfig || args.tsconfig

    const esbuildOptions: Plugins['esbuild'] = {
      minify: binMinify,
      tsconfig: binTsconfig,
      ...bin.esbuild,
    }

    const defaultPlugins: Plugin[] = [esbuildPlugin(esbuildOptions)]

    const startPlugins: Plugin[] =
      bin.plugins && !isArray(bin.plugins) ? bin.plugins.start : []

    const endPlugins: Plugin[] =
      bin.plugins && !isArray(bin.plugins) ? bin.plugins.end : []

    if (bin.json) {
      const jsonOptions = isObject(bin.json) ? bin.json : undefined
      defaultPlugins.push(jsonPlugin(jsonOptions))
    }

    if (bin.replace) {
      defaultPlugins.unshift(replacePlugin(bin.replace))
    }

    if (bin.resolve) {
      const resolveOptions = isObject(bin.resolve) ? bin.resolve : undefined
      defaultPlugins.unshift(resolvePlugin(resolveOptions))
    }

    if (isArray(bin.plugins)) defaultPlugins.push(...bin.plugins)

    const binPlugins: Plugin[] = [
      ...startPlugins,
      ...defaultPlugins,
      ...endPlugins,
    ]

    const binBuilder: InputOptions = {
      external: bin.externals,
      plugins: binPlugins,
    }

    if (isString(config.binPaths) && isPathAllowed(config.binPaths)) {
      bundleStats.files++
      const start = Date.now()

      const output = config.binPaths
      const outputLogs: OutputLogs[] = []

      let format: ModuleFormat = 'esm'
      if (output.endsWith('.cjs')) format = 'cjs'

      const input = await getInputPath(bin.srcDir, output, bin.matcher)
      const builder = await rollup({
        input: resolve(rootDir, input),
        ...binBuilder,
        onLog: (level, log) => {
          if (logFilter(log)) outputLogs.push({ level, log })
        },
      })
      await builder.write({
        file: resolve(rootDir, output),
        format,
        banner: '#!/usr/bin/env node',
      })
      await logOutputStat(
        start,
        rootDir,
        format,
        output,
        outputLength,
        outputLogs,
      )
    }

    if (isObject(binPaths)) {
      for (const value of Object.values(binPaths)) {
        if (isPathAllowed(value)) {
          bundleStats.files++
          const start = Date.now()

          const output = value
          const outputLogs: OutputLogs[] = []

          let format: ModuleFormat = 'esm'
          if (output.endsWith('.cjs')) format = 'cjs'

          const input = await getInputPath(bin.srcDir, output, bin.matcher)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...binBuilder,
            onLog: (level, log) => {
              if (logFilter(log)) outputLogs.push({ level, log })
            },
          })
          await builder.write({
            file: resolve(rootDir, output),
            format,
            banner: '#!/usr/bin/env node',
          })
          await logOutputStat(
            start,
            rootDir,
            format,
            output,
            outputLength,
            outputLogs,
          )
        }
      }
    }
  }

  if (config.entries) {
    for (const entry of config.entries) {
      bundleStats.files++
      const start = Date.now()

      const logFilter = getLogFilter(entry.logFilter || [])

      const entryMinify = isBoolean(entry.minify)
        ? entry.minify
        : isBoolean(config.minify) || args.minify

      const entryTsconfig = entry.tsconfig
        ? entry.tsconfig
        : config.tsconfig || args.tsconfig

      const esbuildOptions: Plugins['esbuild'] = {
        minify: entryMinify,
        tsconfig: entryTsconfig,
        ...entry.esbuild,
      }

      const dtsOptions: Plugins['dts'] = {
        tsconfig: entryTsconfig,
        ...entry.dts,
      }

      const defaultPlugins: Plugin[] = [esbuildPlugin(esbuildOptions)]

      const startPlugins: Plugin[] =
        entry.plugins && !isArray(entry.plugins) ? entry.plugins.start : []

      const endPlugins: Plugin[] =
        entry.plugins && !isArray(entry.plugins) ? entry.plugins.end : []

      if (entry.json) {
        const jsonOptions = isObject(entry.json) ? entry.json : undefined
        defaultPlugins.push(jsonPlugin(jsonOptions))
      }

      if (entry.replace) {
        defaultPlugins.unshift(replacePlugin(entry.replace))
      }

      if (entry.resolve) {
        const resolveOptions = isObject(entry.resolve)
          ? entry.resolve
          : undefined
        defaultPlugins.unshift(resolvePlugin(resolveOptions))
      }

      if (isArray(entry.plugins)) defaultPlugins.push(...entry.plugins)

      const entryPlugins: Plugin[] = [
        ...startPlugins,
        ...defaultPlugins,
        ...endPlugins,
      ]

      const { input, output, banner, footer } = entry
      const outputLogs: OutputLogs[] = []
      const external = entry.externals || config.externals
      const format = entry.format || 'esm'

      const isTypesExts = typesExts.some((ext) => output.endsWith(ext))

      if (input.startsWith('./') && output.startsWith('./') && !isTypesExts) {
        const builder = await rollup({
          input: resolve(rootDir, input),
          external,
          plugins: entryPlugins,
          onLog: (level, log) => {
            if (logFilter(log)) outputLogs.push({ level, log })
          },
        })
        await builder.write({
          file: resolve(rootDir, output),
          format,
          banner,
          footer,
        })
      }

      if (input.startsWith('./') && isPathAllowed(output, typesExts)) {
        const builder = await rollup({
          input: resolve(rootDir, input),
          plugins: [dtsPlugin(dtsOptions)],
          onLog: (level, log) => {
            if (logFilter(log)) outputLogs.push({ level, log })
          },
        })
        await builder.write({
          file: resolve(rootDir, output),
          format,
          banner,
          footer,
        })
      }

      await logOutputStat(
        start,
        rootDir,
        format,
        output,
        outputLength,
        outputLogs,
      )
    }
  }

  bundleStats.end = Date.now()
  logger.end({
    time: bundleStats.end - bundleStats.start,
    size: bundleStats.size,
    files: bundleStats.files,
  })
}
