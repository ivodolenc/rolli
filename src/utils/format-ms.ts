export function formatMs(ms: number): string {
  const s = 1000
  const m = s * 60
  const h = m * 60
  const msAbs = Math.abs(ms)

  if (msAbs >= h) return `${(ms / h).toFixed(2)}h`
  if (msAbs >= m) return `${(ms / m).toFixed(2)}m`
  if (msAbs >= s) return `${(ms / s).toFixed(2)}s`

  return `${ms}ms`
}
