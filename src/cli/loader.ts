import { parse, resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { transform } from 'esbuild'
import { defaults } from '../defaults.js'
import { exists } from '../utils/fs.js'
import { logger } from '../utils/logger.js'
import type { ArgsOptions, ConfigLoader } from '../types/cli/index.js'

const defaultExternals = [/node:/, /rollup/]

async function parseConfig(filePath: string, pkg: any) {
  const { ext, base } = parse(filePath)
  const notFound = () => logger.notFound('Config file not found.')

  const externals = [
    ...defaultExternals,
    ...Object.keys(pkg.dependencies || {}),
  ]

  if (ext === '.js') {
    const js = await import(filePath).catch(notFound)

    const config: ConfigLoader = {
      ...defaults,
      type: base,
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
      ...js.default,
    }

    return config
  }

  if (ext === '.ts') {
    const content = await readFile(filePath, 'utf-8').catch(notFound)
    const { code } = await transform(content, { loader: 'ts' })
    const ts = await import('data:text/javascript,' + code)

    const config: ConfigLoader = {
      ...defaults,
      type: base,
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
      ...ts.default,
    }

    return config
  }
}

export async function createConfigLoader(rootDir: string, args: ArgsOptions) {
  const pathPkg = resolve(rootDir, 'package.json')
  const pathJs = resolve(rootDir, 'rolli.config.js')
  const pathTs = resolve(rootDir, 'rolli.config.ts')
  const pathCustom = args.c ? resolve(rootDir, args.c) : undefined

  const fileJs = await exists(pathJs)
  const fileTs = await exists(pathTs)
  const fileCustom = pathCustom

  const pkgJson = await import(pathPkg, { assert: { type: 'json' } })
  const pkg = pkgJson.default

  const externals = [
    ...defaultExternals,
    ...Object.keys(pkg.dependencies || {}),
  ]

  if (pkg.exports && !pkg.rolli && !fileJs && !fileTs && !fileCustom) {
    const config: ConfigLoader = {
      ...defaults,
      type: 'auto',
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
    }

    return config
  }

  if (pkg.rolli && !fileJs && !fileTs && !fileCustom) {
    const config: ConfigLoader = {
      ...defaults,
      type: 'package.json',
      exports: pkg.exports,
      bin: pkg.bin,
      externals,
      ...pkg.rolli,
    }

    return config
  }

  if (fileJs && !fileTs && !fileCustom) return await parseConfig(pathJs, pkg)

  if (fileTs && !fileJs && !fileCustom) return await parseConfig(pathTs, pkg)

  if (fileCustom && !fileJs && !fileTs)
    return await parseConfig(pathCustom, pkg)
}
