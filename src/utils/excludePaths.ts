import { isBoolean, isObject } from 'utills'
import type { ExportsOptions, BinOptions } from '../types/options.js'
import type { ConfigLoader } from '../types/cli/index.js'

export function excludeExportsPaths(
  paths: ConfigLoader['exportsPaths'],
  exclude: NonNullable<ExportsOptions['exclude']>,
): ConfigLoader['exportsPaths'] {
  let exportsPaths = paths

  for (const [key, value] of Object.entries(exclude)) {
    const exportsKey = exportsPaths[key]

    if (isBoolean(value) && value) {
      const { [key]: _key, ...newPaths } = exportsPaths
      exportsPaths = newPaths
    }

    if (isObject(exportsKey) && isObject(value)) {
      if (isBoolean(value.types) && value.types) {
        exportsKey.types = undefined
      }
      if (isBoolean(value.import) && value.import) {
        exportsKey.import = undefined
      }
      if (isBoolean(value.require) && value.require) {
        exportsKey.require = undefined
      }
    }
  }

  return exportsPaths
}

export function excludeBinPaths(
  paths: ConfigLoader['binPaths'],
  exclude: NonNullable<BinOptions['exclude']>,
): ConfigLoader['binPaths'] {
  let binPaths = paths

  for (const [key, value] of Object.entries(exclude)) {
    if (isObject(binPaths)) {
      if (isBoolean(value) && value) {
        const { [key]: _key, ...newPaths } = binPaths
        binPaths = newPaths
      }
    }
  }

  return binPaths
}
