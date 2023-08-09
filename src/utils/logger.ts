import { cl, bold, cyan, lime, yellow, red, darken } from 'colorate'
import { formatBytes } from './format-bytes.js'
import { name, version } from '../cli/meta.js'

export const logger = {
  cyan: (v: string | number) => cl(bold(cyan(name)), v),
  lime: (v: string | number) => cl(bold(lime(name)), v),
  yellow: (v: string | number) => cl(bold(yellow(name)), v),
  red: (v: string | number) => cl(bold(red(name)), v),
  start: (v: string) => {
    cl()
    cl(bold(cyan(name)), version)
    cl(bold(cyan(name)), `Config ${cyan("'" + v + "'")}`)
    cl(bold(cyan(name)), `Bundling started...`)
    cl()
  },
  output: (ext: string, v: string, size: number) => {
    cl(cyan('> ') + ext, darken(v), '→', lime(formatBytes(size)))
  },
  end: (bundleStats: {
    time: number
    files: number
    suffix: string
    size: number
  }) => {
    const { time, files, suffix, size } = bundleStats
    const stats = lime(`${files}${suffix}, ${formatBytes(size)}`)

    cl()
    cl(bold(lime(name)), `⚡️ Bundling done in ` + cyan(`${time}ms`))
    cl(bold(lime(name)), `📦 Bundle stats: ${stats}`)
    cl()
  },
  notFound: (v: string) => {
    cl()
    cl(bold(yellow(name)), `💬 ${v}`)
    cl()
    process.exit(1)
  },
}
