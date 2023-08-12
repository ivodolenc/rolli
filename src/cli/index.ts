#!/usr/bin/env node

import mri from 'mri'
import { cl, n } from 'colorate'
import { logHelpDetails } from './help.js'
import { createBuilder } from './builder.js'
import { logger } from '../utils/logger.js'
import { error } from '../utils/error.js'
import { createConfigLoader } from './loader.js'
import { nodePatch } from '../utils/node.js'

async function main() {
  const rootDir = process.cwd()
  const args = mri(process.argv.splice(2), { alias: { c: 'config' } })

  if (args.h || args.help) return logHelpDetails()

  const config = await createConfigLoader(rootDir, args)
  if (!config) return logger.notFound('Configuration not found.')

  if (args['print-config']) {
    logger.printConfig()
    return cl(config, n)
  }

  await createBuilder(rootDir, config).catch(error)
}

nodePatch()

main().catch(error)
