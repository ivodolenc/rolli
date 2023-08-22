import { cl, n, bold, darken, cyan } from 'colorate'
import { name, version } from './meta.js'
import { command } from './command.js'

export function logHelpDetails() {
  const time = new Date().toLocaleTimeString()

  cl(['', `${bold(cyan(name))} ${version}`].join(n))
  cl(
    `${bold(cyan(name))} ${darken('[' + time + ']')} 💬 HELP DETAILS ${cyan(
      '[-h, --help]',
    )}`,
    n,
  )
  cl(`LIST OF AVAILABLE COMMANDS 📟`, n)

  command({
    flags: '[--print-config]',
    description: `Prints the current Rolli configuration in the terminal.`,
  })

  command({
    flags: '[-c, --config] [my.config.js]',
    description: `Sets a custom Rolli configuration.`,
  })

  command({
    flags: '[--minify]',
    description: `Minifies all bundle assets for production.`,
  })

  command({
    flags: '[--tsconfig] [my.tsconfig.json]',
    description: `Sets a custom TypeScript configuration for the entire bundle.`,
  })
}
