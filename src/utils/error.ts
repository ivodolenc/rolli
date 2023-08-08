import { cl, ce } from 'colorate'
import { logger } from '../utils/logger.js'

export const error = (err: any) => {
  cl()
  logger.red(` 🚨 Something went wrong...`)
  cl()
  ce(err)
  process.exit(1)
}
