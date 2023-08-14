import type { LogLevel, RollupLog } from 'rollup'

export interface PluginLog {
  level: LogLevel
  log: RollupLog
}
