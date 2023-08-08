import { cl, bold, cyan, lime, yellow, red } from 'colorate'
import { name, version } from '../cli/meta.js'

export const logger = {
  cyan: (v: string | number) => cl(bold(cyan(name)), v),
  lime: (v: string | number) => cl(bold(lime(name)), v),
  yellow: (v: string | number) => cl(bold(yellow(name)), v),
  red: (v: string | number) => cl(bold(red(name)), v),
  start: () => {
    cl()
    cl(bold(cyan(name)), version)
    cl(bold(cyan(name)), `Bundling started...`)
    cl()
  },
  config: (v: string) => {
    cl(bold(cyan(name)), `Config ${cyan("'" + v + "'")}`)
  },
  notFound: (v: string) => {
    cl()
    cl(bold(yellow(name)), `💬 ${v}`)
    cl()
    process.exit(1)
  },
}
