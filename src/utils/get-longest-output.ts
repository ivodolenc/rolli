import { isString, isObject } from '@hypernym/utils'
import { isPathAllowed } from './is-path-allowed.js'
import type { ConfigLoader } from '../types/cli/loader.js'

export function getLongestOutput(config: ConfigLoader) {
  const outputs: string[] = []
  const { exportsPaths, binPaths, entries } = config

  if (exportsPaths) {
    for (const value of Object.values(exportsPaths)) {
      if (isString(value) && isPathAllowed(value)) outputs.push(value)
      if (isObject(value)) {
        if (value.import && isPathAllowed(value.import)) {
          outputs.push(value.import)
        }

        if (value.require && isPathAllowed(value.require)) {
          outputs.push(value.require)
        }

        if (value.types && value.types.endsWith('.d.ts')) {
          outputs.push(value.types)
        }
      }
    }
  }

  if (binPaths) {
    if (isString(binPaths) && isPathAllowed(binPaths)) outputs.push(binPaths)
    if (isObject(binPaths)) {
      for (const value of Object.values(binPaths)) {
        if (isPathAllowed(value)) outputs.push(value)
      }
    }
  }

  if (entries) {
    for (const entry of entries) outputs.push(entry.output)
  }

  return Math.max(...outputs.map((v) => v.length))
}
