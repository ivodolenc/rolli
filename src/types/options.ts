import type { InputOptions, OutputOptions, ModuleFormat } from 'rollup'
import type { RollupReplaceOptions } from '@rollup/plugin-replace'
import type { RollupJsonOptions } from '@rollup/plugin-json'
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
import type { Options as EsbuildOptions } from 'rollup-plugin-esbuild'
import type { Options as DtsOptions } from 'rollup-plugin-dts'

interface RollupOptions extends InputOptions {
  output: OutputOptions[]
}

interface EntriesOptions {
  input: string
  output: string
  format?: ModuleFormat
  externals?: (string | RegExp)[]
  banner?: OutputOptions['banner']
  footer?: OutputOptions['footer']
  replace?: RollupReplaceOptions
  json?: RollupJsonOptions | true
  resolve?: RollupNodeResolveOptions | true
  esbuild?: EsbuildOptions
  dts?: DtsOptions
}

export interface RolliOptions {
  exports?: false
  bin?: false
  externals?: (string | RegExp)[]
  entries?: EntriesOptions[]
  rollup?: RollupOptions[]
  replace?: RollupReplaceOptions
  json?: RollupJsonOptions | true
  resolve?: RollupNodeResolveOptions | true
  esbuild?: EsbuildOptions
  dts?: DtsOptions
}
