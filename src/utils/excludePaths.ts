import { isString, isObject } from '@hypernym/utils'
import type { ExportsOptions } from '../types/exports.js'
import type { BinOptions } from '../types/bin.js'
import type { ConfigLoader } from '../types/cli/index.js'

export function excludeExportsPaths(
  paths: ConfigLoader['exportsPaths'],
  exclude: NonNullable<ExportsOptions['exclude']>,
): ConfigLoader['exportsPaths'] {
  let exportsPaths = paths

  for (const value of exclude) {
    if (isString(value)) {
      if (exportsPaths[value]) {
        const { [value]: _, ...newPaths } = exportsPaths
        exportsPaths = newPaths
      }
    }

    if (isObject(value)) {
      const path = exportsPaths[value.path]

      if (value.types && isObject(path)) path.types = undefined
      if (value.import && isObject(path)) path.import = undefined
      if (value.require && isObject(path)) path.require = undefined
    }
  }

  return exportsPaths
}

export function excludeBinPaths(
  paths: ConfigLoader['binPaths'],
  exclude: NonNullable<BinOptions['exclude']>,
): ConfigLoader['binPaths'] {
  let binPaths = paths

  for (const value of exclude) {
    if (isObject(binPaths)) {
      if (binPaths[value]) {
        const { [value]: _, ...newPaths } = binPaths
        binPaths = newPaths
      }
    }
  }

  return binPaths
}
