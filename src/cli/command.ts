import { cl, n, bold, darken, lime, cyan } from 'colorate'
import { name } from './meta.js'

export const command = (meta: { flags: string; description: string }) => {
  const { flags, description } = meta

  const cmd = bold(cyan('> ')) + 'Command:'
  const cmdName = darken(lime('npx ')) + lime(name.toLowerCase())
  const cmdFlags = cyan(flags)

  cl(cmd, cmdName, cmdFlags)
  cl(`     ${darken('│')}`)
  cl(`     ${darken('└─ ' + description)}`, n)
}
