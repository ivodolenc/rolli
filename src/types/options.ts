import type { InputOptions, OutputOptions } from 'rollup'
import type { RollupReplaceOptions } from '@rollup/plugin-replace'
import type { Options as EsbuildOptions } from 'rollup-plugin-esbuild'
import type { Options as DtsOptions } from 'rollup-plugin-dts'

interface EntriesOptions extends InputOptions {
  output: OutputOptions[]
}

export interface RolliOptions {
  outDir?: string
  entries?: EntriesOptions[]
  logFilter?: string[]
  externals?: (string | RegExp)[]
  esbuild?: EsbuildOptions
  replace?: RollupReplaceOptions
  dts?: DtsOptions
}
