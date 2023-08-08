import type { RolliOptions } from './types/index.js'

export const defaults: RolliOptions = {
  outDir: 'dist',
  logFilter: ['!code:CIRCULAR_DEPENDENCY'],
}
