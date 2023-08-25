import { resolve } from 'node:path'
import { stat } from 'node:fs/promises'
import { isString, isObject } from 'utills'
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
import type { InputOptions, ModuleFormat } from 'rollup'
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

  if (config.exportsPaths) {
    const exportsOptions = isObject(config.exports) ? config.exports : undefined
    const exports = {
      srcDir: 'src',
      externals: config.externals,
      ...exportsOptions,
    }
    const exportsPaths = exports.exclude
      ? excludeExportsPaths(config.exportsPaths, exports.exclude)
      : config.exportsPaths

    const exportsMinify = exports.minify
      ? exports.minify
      : args.minify || config.minify

    const exportsTsconfig = exports.tsconfig
      ? exports.tsconfig
      : args.tsconfig || config.tsconfig

    const esbuildOptions: Plugins['esbuild'] = {
      minify: exportsMinify,
      tsconfig: exportsTsconfig,
      ...exports?.esbuild,
    }

    const dtsOptions: Plugins['dts'] = {
      tsconfig: exportsTsconfig,
      ...exports?.dts,
    }

    const exportsLogFilter = getLogFilter(exports.logFilter || [])
    const exportsPlugins = [esbuildPlugin(esbuildOptions)]

    if (exports?.json) {
      const jsonOptions = isObject(exports.json) ? exports.json : undefined
      exportsPlugins.push(jsonPlugin(jsonOptions))
    }

    if (exports?.replace) {
      exportsPlugins.unshift(replacePlugin(exports.replace))
    }

    if (exports?.resolve) {
      const resolveOptions = isObject(exports.resolve)
        ? exports.resolve
        : undefined
      exportsPlugins.unshift(resolvePlugin(resolveOptions))
    }

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

        const input = await getInputPath(exports.srcDir, output)
        const builder = await rollup({
          input: resolve(rootDir, input),
          ...exportsBuilder,
          onLog: (level, log) => {
            if (exportsLogFilter(log)) outputLogs.push({ level, log })
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

          const input = await getInputPath(exports.srcDir, output)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...exportsBuilder,
            onLog: (level, log) => {
              if (exportsLogFilter(log)) outputLogs.push({ level, log })
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

          const input = await getInputPath(exports.srcDir, output)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...exportsBuilder,
            onLog: (level, log) => {
              if (exportsLogFilter(log)) outputLogs.push({ level, log })
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

          let outputExt = '.d.ts'
          let format: ModuleFormat = 'esm'

          if (output.endsWith('.d.mts')) outputExt = '.d.mts'
          if (output.endsWith('.d.cts')) {
            outputExt = '.d.cts'
            format = 'cjs'
          }

          const inputDir = output.split('/')[1]
          const input = output
            .replace(inputDir, exports.srcDir)
            .replace(outputExt, '.ts')

          const builder = await rollup({
            input: resolve(rootDir, input),
            plugins: [dtsPlugin(dtsOptions)],
            onLog: (level, log) => {
              if (exportsLogFilter(log)) outputLogs.push({ level, log })
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

  if (config.binPaths) {
    const binOptions = isObject(config.bin) ? config.bin : undefined
    const bin = {
      srcDir: 'src',
      externals: config.externals,
      ...binOptions,
    }
    const binPaths = bin.exclude
      ? excludeBinPaths(config.binPaths, bin.exclude)
      : config.binPaths

    const binMinify = bin.minify ? bin.minify : args.minify || config.minify

    const binTsconfig = bin.tsconfig
      ? bin.tsconfig
      : args.tsconfig || config.tsconfig

    const esbuildOptions: Plugins['esbuild'] = {
      minify: binMinify,
      tsconfig: binTsconfig,
      ...bin?.esbuild,
    }

    const binLogFilter = getLogFilter(bin.logFilter || [])
    const binPlugins = [esbuildPlugin(esbuildOptions)]

    if (bin?.json) {
      const jsonOptions = isObject(bin.json) ? bin.json : undefined
      binPlugins.push(jsonPlugin(jsonOptions))
    }

    if (bin?.replace) {
      binPlugins.unshift(replacePlugin(bin.replace))
    }

    if (bin?.resolve) {
      const resolveOptions = isObject(bin.resolve) ? bin.resolve : undefined
      binPlugins.unshift(resolvePlugin(resolveOptions))
    }

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

      const input = await getInputPath(bin.srcDir, output)
      const builder = await rollup({
        input: resolve(rootDir, input),
        ...binBuilder,
        onLog: (level, log) => {
          if (binLogFilter(log)) outputLogs.push({ level, log })
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

          const input = await getInputPath(bin.srcDir, output)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...binBuilder,
            onLog: (level, log) => {
              if (binLogFilter(log)) outputLogs.push({ level, log })
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

      const entryMinify = entry.minify
        ? entry.minify
        : args.minify || config.minify

      const entryTsconfig = entry.tsconfig
        ? entry.tsconfig
        : args.tsconfig || config.tsconfig

      const esbuildOptions: Plugins['esbuild'] = {
        minify: entryMinify,
        tsconfig: entryTsconfig,
        ...entry.esbuild,
      }

      const dtsOptions: Plugins['dts'] = {
        tsconfig: entryTsconfig,
        ...entry.dts,
      }

      const entryLogFilter = getLogFilter(entry.logFilter || [])
      const entryPlugins = [esbuildPlugin(esbuildOptions)]

      if (entry.json) {
        const jsonOptions = isObject(entry.json) ? entry.json : undefined
        entryPlugins.push(jsonPlugin(jsonOptions))
      }

      if (entry.replace) {
        entryPlugins.unshift(replacePlugin(entry.replace))
      }

      if (entry.resolve) {
        const resolveOptions = isObject(entry.resolve)
          ? entry.resolve
          : undefined
        entryPlugins.unshift(resolvePlugin(resolveOptions))
      }

      const { input, output, banner, footer } = entry
      const outputLogs: OutputLogs[] = []
      const external = config.externals || entry.externals
      const format = entry.format || 'esm'

      const isTypesExts = typesExts.some((ext) => output.endsWith(ext))

      if (input.startsWith('./') && output.startsWith('./') && !isTypesExts) {
        const builder = await rollup({
          input: resolve(rootDir, input),
          external,
          plugins: entryPlugins,
          onLog: (level, log) => {
            if (entryLogFilter(log)) outputLogs.push({ level, log })
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
            if (entryLogFilter(log)) outputLogs.push({ level, log })
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
