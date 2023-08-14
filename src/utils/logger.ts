import { cl, bold, cyan, lime, yellow, red, darken, pink } from 'colorate'
import { formatBytes } from './format-bytes.js'
import { formatMs } from './format-ms.js'
import { name, version } from '../cli/meta.js'
import type { PluginLog } from '../types/cli/builder.js'

export const logger = {
  cyan: (v: string | number) => cl(bold(cyan(name)), v),
  lime: (v: string | number) => cl(bold(lime(name)), v),
  yellow: (v: string | number) => cl(bold(yellow(name)), v),
  red: (v: string | number) => cl(bold(red(name)), v),
  start: (v: string) => {
    const time = new Date().toLocaleTimeString()

    cl()
    cl(bold(cyan(name)), version)
    cl(bold(cyan(name)), `Config ${cyan("'" + v + "'")}`)
    cl(bold(cyan(name)), `${darken('[' + time + ']')} Bundling started...`)
    cl()
  },
  output: (ext: string, output: string, size: number) => {
    cl(cyan('>'), ext, darken(output), '→', lime(formatBytes(size)))
  },
  plugin: (pluginLog: PluginLog) => {
    const { level, log } = pluginLog

    let status = pink(`- ${level}`)
    if (level === 'info') cyan(`- ${level}`)
    if (level === 'debug') yellow(`- ${level}`)

    cl(status, log.message)
  },
  end: (bundleStats: { time: number; files: number; size: number }) => {
    const { time, files, size } = bundleStats

    const suffix = files === 1 ? ' file' : ' files'
    const stats = lime(`${files}${suffix}, ${formatBytes(size)}`)

    cl()
    cl(bold(cyan(name)), `⚡️ Bundling done in ` + cyan(formatMs(time)))
    cl(bold(lime(name)), `📦 Bundle stats: ${stats}`)
    cl()
  },
  printConfig: () => {
    const time = new Date().toLocaleTimeString()
    const flag = cyan('[--print-config]')

    cl()
    cl(bold(cyan(name)), version)
    cl(bold(cyan(name)), `${darken('[' + time + ']')} ⚙️  CONFIGURATION`, flag)
    cl()
  },
  notFound: (v: string) => {
    const time = new Date().toLocaleTimeString()

    cl()
    cl(bold(yellow(name)), `${darken('[' + time + ']')} 💬 ${v}`)
    cl()
    process.exit(1)
  },
}
