import { cl, ce, bold, red } from 'colorate'
import { name } from '../cli/meta.js'

export const error = (err: any) => {
  cl(bold(red(name)), 'Something went wrong...')
  cl()
  ce(err)
  process.exit(1)
}
