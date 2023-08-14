import { parse, resolve } from 'node:path'
import { exists } from '../utils/fs.js'
import { error } from '../utils/error.js'
import type { ArgsOptions, ConfigLoader } from '../types/cli/index.js'

async function parseConfig(filePath: string, defaults: ConfigLoader) {
  const { ext, base } = parse(filePath)

  if (ext === '.js') {
    const js = await import(filePath).catch(error)

    const config: ConfigLoader = {
      ...defaults,
      type: base,
      ...js.default,
    }

    return config
  }
}

export async function createConfigLoader(rootDir: string, args: ArgsOptions) {
  const pathPkg = resolve(rootDir, 'package.json')
  const { default: pkg } = await import(pathPkg, {
    assert: { type: 'json' },
  }).catch(error)
  const { exports, bin, dependencies, rolli } = pkg

  let minify: object | undefined = undefined
  if (args.minify) minify = { esbuild: { minify: true } }

  const pathCustom = args.c ? resolve(rootDir, args.c) : undefined
  const pathJs = resolve(rootDir, 'rolli.config.js')
  const fileJs = await exists(pathJs)

  const defaults: ConfigLoader = {
    srcDir: 'src',
    type: 'auto',
    exports,
    bin,
    externals: [/node:/, /rollup/, /types/, ...Object.keys(dependencies || {})],
    ...minify,
  }

  if (exports && !rolli && !fileJs && !pathCustom) {
    const config: ConfigLoader = {
      ...defaults,
      type: 'auto',
    }

    return config
  }

  if (rolli && !fileJs && !pathCustom) {
    const config: ConfigLoader = {
      ...defaults,
      type: 'package.json',
      ...pkg.rolli,
    }

    return config
  }

  if (fileJs && !pathCustom) return await parseConfig(pathJs, defaults)

  if (pathCustom && !fileJs) return await parseConfig(pathCustom, defaults)
}
