import { parse, resolve } from 'node:path'
import { exists } from '../utils/fs.js'
import { error } from '../utils/error.js'
import type { ArgsOptions, ConfigLoader } from '../types/cli/index.js'

const defaultExternals = [/node:/, /rollup/, /types/]

async function parseConfig(filePath: string, pkg: any) {
  const { ext, base } = parse(filePath)

  const externals = [
    ...defaultExternals,
    ...Object.keys(pkg.dependencies || {}),
  ]

  if (ext === '.js') {
    const js = await import(filePath).catch(error)

    const config: ConfigLoader = {
      type: base,
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
      ...js.default,
    }

    return config
  }
}

export async function createConfigLoader(rootDir: string, args: ArgsOptions) {
  const pathPkg = resolve(rootDir, 'package.json')
  const pathJs = resolve(rootDir, 'rolli.config.js')
  const pathCustom = args.c ? resolve(rootDir, args.c) : undefined

  const fileJs = await exists(pathJs)

  const pkgJson = await import(pathPkg, { assert: { type: 'json' } })
  const pkg = pkgJson.default

  const externals = [
    ...defaultExternals,
    ...Object.keys(pkg.dependencies || {}),
  ]

  if (pkg.exports && !pkg.rolli && !fileJs && !pathCustom) {
    const config: ConfigLoader = {
      type: 'auto',
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
    }

    return config
  }

  if (pkg.rolli && !fileJs && !pathCustom) {
    const config: ConfigLoader = {
      type: 'package.json',
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
      ...pkg.rolli,
    }

    return config
  }

  if (fileJs && !pathCustom) return await parseConfig(pathJs, pkg)

  if (pathCustom && !fileJs) return await parseConfig(pathCustom, pkg)
}
