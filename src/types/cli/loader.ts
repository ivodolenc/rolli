import type { RolliOptions } from '../options.js'

export interface ConfigLoader extends RolliOptions {
  type: string
  exports: {
    [key: string]: {
      types?: string
      import?: string
      require?: string
    }
  }
}
