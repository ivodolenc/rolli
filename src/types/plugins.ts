import type { Plugin } from 'rollup'
import type { RollupReplaceOptions } from '@rollup/plugin-replace'
import type { RollupJsonOptions } from '@rollup/plugin-json'
import type { RollupNodeResolveOptions } from '@rollup/plugin-node-resolve'
import type { Options as EsbuildOptions } from 'rollup-plugin-esbuild'
import type { Options as DtsOptions } from 'rollup-plugin-dts'

export interface PluginsOptions {
  /**
   * Runs `before` the default plugins.
   */
  start: Plugin[]
  /**
   * Runs `after` the default plugins.
   */
  end: Plugin[]
}

export interface Plugins {
  replace?: RollupReplaceOptions
  json?: RollupJsonOptions | true
  resolve?: RollupNodeResolveOptions | true
  esbuild?: EsbuildOptions
  dts?: DtsOptions
}
