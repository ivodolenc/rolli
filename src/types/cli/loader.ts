import type { RolliOptions } from '../options.js'

export interface ConfigLoader
  extends Omit<RolliOptions, 'srcDir' | 'exports' | 'bin'> {
  srcDir: string
  type: string
  exports: {
    [key: string]: {
      types?: string
      import?: string
      require?: string
    }
  }
  bin?:
    | string
    | {
        [key: string]: string
      }
    | false
}
