import type { RolliOptions } from '../options.js'

export interface ConfigLoader extends RolliOptions {
  type: string
  exportsPaths: {
    [key: string]:
      | string
      | {
          types?: string
          import?: string
          require?: string
        }
  }
  binPaths?:
    | string
    | {
        [key: string]: string
      }
  externals: (string | RegExp)[]
}
