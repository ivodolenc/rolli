import type { ExportsOptions } from './exports.js'
import type { BinOptions } from './bin.js'
import type { EntriesOptions } from './entries.js'
import type { Hooks } from './hooks.js'

export interface RolliOptions {
  /**
   * Defines the auto-build `exports` mode.
   *
   * @default enabled
   */
  exports?: ExportsOptions | false
  /**
   * Defines the auto-build `bin` mode.
   *
   * @default enabled
   */
  bin?: BinOptions | false
  /**
   * Defines the custom-build `entries` mode.
   *
   * @default undefined
   */
  entries?: EntriesOptions[]
  /**
   * Provides a powerful hooking system to further expand build modes.
   *
   * @default undefined
   */
  hooks?: Hooks
  /**
   * Minifies all bundle assets for production.
   *
   * @default undefined
   */
  minify?: boolean
  /**
   * Sets a custom TypeScript configuration for the entire bundle.
   *
   * If not defined, it uses the main `tsconfig.json` file from the project's root.
   *
   * @default undefined
   */
  tsconfig?: string
}
