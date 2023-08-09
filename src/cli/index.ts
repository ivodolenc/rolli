#!/usr/bin/env node

import mri from 'mri'
import { cl, n } from 'colorate'
import { createBuilder } from './builder.js'
import { version } from './meta.js'
import { logger } from '../utils/logger.js'
import { error } from '../utils/error.js'
import { createConfigLoader } from './loader.js'
import { nodeWarningsPatch } from '../utils/node.js'

async function main() {
  const rootDir = process.cwd()
  const args = mri(process.argv.splice(2))

  const config = await createConfigLoader(rootDir, args)
  if (!config) return logger.notFound('Configuration not found.')

  if (args['print-config']) {
    cl()
    logger.cyan(version)
    logger.cyan('Current Configuration:')

    return cl(config, n)
  }

  await createBuilder(rootDir, config).catch(error)
}

nodeWarningsPatch()

main().catch(error)
