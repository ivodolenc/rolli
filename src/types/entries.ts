import type { OutputOptions, Plugin } from 'rollup'
import type { Plugins, PluginsOptions } from './plugins.js'

export interface EntriesOptions extends Plugins {
  input: string
  output: string
  format?: OutputOptions['format']
  externals?: (string | RegExp)[]
  logFilter?: string[]
  banner?: OutputOptions['banner']
  footer?: OutputOptions['footer']
  minify?: boolean
  tsconfig?: string
  plugins?: Plugin[] | PluginsOptions
}
