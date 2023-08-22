import type { RolliOptions } from '../options.js'

export interface ConfigLoader extends Omit<RolliOptions, 'srcDir'> {
  type: string
  exportsPaths: {
    [key: string]: {
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
