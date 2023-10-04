import { parse, resolve } from 'node:path'
import { exists } from '@hypernym/utils/node'
import { error } from '../utils/index.js'
import type { Args, ConfigLoader } from '../types/cli/index.js'

async function parseConfig(filePath: string, defaults: ConfigLoader) {
  const { base } = parse(filePath)

  const js = await import(filePath).catch(error)

  const config: ConfigLoader = {
    ...defaults,
    type: base,
    ...js.default,
  }

  return config
}

export async function createConfigLoader(rootDir: string, args: Args) {
  const pathPkg = resolve(rootDir, 'package.json')
  const pkg = await import(pathPkg, { assert: { type: 'json' } }).catch(error)
  const { exports, bin, dependencies, rolli } = pkg.default

  const pathCustom = args.config ? resolve(rootDir, args.config) : undefined
  const pathJs = resolve(rootDir, 'rolli.config.js')
  const fileJs = await exists(pathJs)

  const defaults: ConfigLoader = {
    type: 'auto',
    exportsPaths: exports,
    binPaths: bin,
    externals: [
      /^node:/,
      /^@types/,
      /^@rollup/,
      /^rollup/,
      ...Object.keys(dependencies || {}),
    ],
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
