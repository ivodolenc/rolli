import { cl, pink } from 'colorate'
import type { LogLevel, RollupLog } from 'rollup'

export function onLog(level: LogLevel, log: RollupLog): void {
  cl(pink(`! ${level}`), log.message)
}
