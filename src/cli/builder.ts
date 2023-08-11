import { resolve, parse } from 'node:path'
import { stat } from 'node:fs/promises'
import { rollup } from 'rollup'
import _replace from '@rollup/plugin-replace'
import _json from '@rollup/plugin-json'
import _resolve from '@rollup/plugin-node-resolve'
import _esbuild from 'rollup-plugin-esbuild'
import { dts } from 'rollup-plugin-dts'
import { exists } from '../utils/fs.js'
import { isObject, isString } from '../utils/is.js'
import { logger } from '../utils/logger.js'
import type { ModuleFormat } from 'rollup'
import type { ConfigLoader } from '../types/cli/index.js'

const replacePlugin = _replace.default ?? _replace
const jsonPlugin = _json.default ?? _json
const resolvePlugin = _resolve.default ?? _resolve
const esbuildPlugin = _esbuild.default ?? _esbuild

let bundleStats = {
  size: 0,
  files: 0,
}

async function getInputPath(value: string) {
  const outputDir = value.split('/')[1]
  const inputDir = value.replace(outputDir, 'src')
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
    const options = {
      preventAssignment: true,
      ...replaceOptions,
    }
    plugins.unshift(replacePlugin(options))
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
      if (isString(value)) {
        bundleStats.files++

        let format: ModuleFormat = 'esm'
        if (value.endsWith('.cjs')) format = 'cjs'

        const input = await getInputPath(value)
        const builder = await rollup({
          input: resolve(rootDir, input),
          ...builderOptions,
        })
        await builder.write({
          file: resolve(rootDir, value),
          format,
        })
        await logOutputStat(rootDir, value)
      }

      if (isObject(value)) {
        if (value.import) {
          bundleStats.files++

          const input = await getInputPath(value.import)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...builderOptions,
          })
          await builder.write({
            file: resolve(rootDir, value.import),
            format: 'esm',
          })
          await logOutputStat(rootDir, value.import)
        }

        if (value.require) {
          bundleStats.files++

          const input = await getInputPath(value.require)
          const builder = await rollup({
            input: resolve(rootDir, input),
            ...builderOptions,
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

  if (isString(bin)) {
    bundleStats.files++

    let format: ModuleFormat = 'esm'
    if (bin.endsWith('.cjs')) format = 'cjs'

    const input = await getInputPath(bin)
    const builder = await rollup({
      input: resolve(rootDir, input),
      ...builderOptions,
    })
    await builder.write({
      file: resolve(rootDir, bin),
      format,
      banner: '#!/usr/bin/env node',
    })
    await logOutputStat(rootDir, bin)
  }

  if (isObject(bin)) {
    for (const value of Object.values(bin)) {
      bundleStats.files++

      let format: ModuleFormat = 'esm'
      if (value.endsWith('.cjs')) format = 'cjs'

      const input = await getInputPath(value)
      const builder = await rollup({
        input: resolve(rootDir, input),
        ...builderOptions,
      })
      await builder.write({
        file: resolve(rootDir, value),
        format,
        banner: '#!/usr/bin/env node',
      })
      await logOutputStat(rootDir, value)
    }
  }

  if (entries) {
    for (const value of entries) {
      bundleStats.files++

      const entriesPlugins = [esbuildPlugin(value.esbuild)]

      if (value.json) {
        const options = isObject(value.json) ? value.json : undefined
        entriesPlugins.push(jsonPlugin(options))
      }

      if (value.replace) {
        const options = {
          preventAssignment: true,
          ...value.replace,
        }
        entriesPlugins.unshift(replacePlugin(options))
      }

      if (value.resolve) {
        const options = isObject(value.resolve) ? value.resolve : undefined
        entriesPlugins.unshift(resolvePlugin(options))
      }

      const format = value.format || 'esm'

      if (!value.output.endsWith('.d.ts')) {
        const builder = await rollup({
          input: resolve(rootDir, value.input),
          external: external || value.externals,
          ...entriesPlugins,
        })
        await builder.write({
          file: resolve(rootDir, value.output),
          format,
          banner: value.banner,
          footer: value.footer,
        })
      }

      if (value.output.endsWith('.d.ts')) {
        const builder = await rollup({
          input: resolve(rootDir, value.input),
          external: external || value.externals,
          plugins: [dts(value.dts)],
        })
        await builder.write({
          file: resolve(rootDir, value.output),
          format,
          banner: value.banner,
          footer: value.footer,
        })
      }

      await logOutputStat(rootDir, value.output)
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
