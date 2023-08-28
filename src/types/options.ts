import type { OutputOptions } from 'rollup'
import type { RollupReplaceOptions } from '@rollup/plugin-replace'
import type { RollupJsonOptions } from '@rollup/plugin-json'
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
import type { Options as EsbuildOptions } from 'rollup-plugin-esbuild'
import type { Options as DtsOptions } from 'rollup-plugin-dts'

type Externals = (string | RegExp)[]

type ExportsExclude = {
  path: string
  types?: true
  import?: true
  require?: true
}

type ExportsMatcher = {
  default?: string
  types?: string
  import?: string
  require?: string
}

export interface Plugins {
  replace?: RollupReplaceOptions
  json?: RollupJsonOptions | true
  resolve?: RollupNodeResolveOptions | true
  esbuild?: EsbuildOptions
  dts?: DtsOptions
}

export interface ExportsOptions extends Plugins {
  srcDir?: string
  externals?: Externals
  logFilter?: string[]
  minify?: boolean
  tsconfig?: string
  exclude?: (string | ExportsExclude)[]
  matcher?: ExportsMatcher
}

export interface BinOptions extends Omit<Plugins, 'dts'> {
  srcDir?: string
  externals?: Externals
  logFilter?: string[]
  minify?: boolean
  tsconfig?: string
  exclude?: string[]
  matcher?: string
}

export interface EntriesOptions extends Plugins {
  input: string
  output: string
  format?: OutputOptions['format']
  externals?: Externals
  logFilter?: string[]
  banner?: OutputOptions['banner']
  footer?: OutputOptions['footer']
  minify?: boolean
  tsconfig?: string
}

export interface RolliOptions {
  /**
   * Auto-build `exports` mode.
   *
   * @default enabled
   */
  exports?: ExportsOptions | false
  /**
   * Auto-build `bin` mode.
   *
   * @default enabled
   */
  bin?: BinOptions | false
  /**
   * Custom-build `entries` mode.
   *
   * @default undefined
   */
  entries?: EntriesOptions[]
  minify?: boolean
  tsconfig?: string
}
