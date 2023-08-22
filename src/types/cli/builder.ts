import type { LogLevel, RollupLog } from 'rollup'

export interface OutputLogs {
  level: LogLevel
  log: RollupLog
}
