import type { Plugin } from 'rollup'
import type { Plugins, PluginsOptions } from './plugins.js'

export interface ExportsExclude {
  path: string
  types?: true
  import?: true
  require?: true
}

export interface ExportsMatcher {
  default?: string
  types?: string
  import?: string
  require?: string
}

export interface ExportsOptions extends Plugins {
  srcDir?: string
  externals?: (string | RegExp)[]
  logFilter?: string[]
  minify?: boolean
  tsconfig?: string
  exclude?: (string | ExportsExclude)[]
  matcher?: ExportsMatcher
  plugins?: Plugin[] | PluginsOptions
}
