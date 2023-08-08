export function formatBytes(bytes: number) {
  const decimals = 2
  const units = ['B', 'KB', 'MB', 'GB', 'TB']

  if (bytes === 0) return `0 B`

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${units[i]}`
}
