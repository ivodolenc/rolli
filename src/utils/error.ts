import { cl, ce, bold, red, darken } from 'colorate'
import { name } from '../cli/meta.js'

export const error = (err: any) => {
  const time = new Date().toLocaleTimeString()

  cl(bold(red(name)), `${darken('[' + time + ']')} Something went wrong...`)
  cl()
  ce(err)
  process.exit(1)
}
