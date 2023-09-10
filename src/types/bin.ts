import type { Plugin } from 'rollup'
import type { Plugins, PluginsOptions } from './plugins.js'

export interface BinOptions extends Omit<Plugins, 'dts'> {
  srcDir?: string
  externals?: (string | RegExp)[]
  logFilter?: string[]
  minify?: boolean
  tsconfig?: string
  exclude?: string[]
  matcher?: string
  plugins?: Plugin[] | PluginsOptions
}
