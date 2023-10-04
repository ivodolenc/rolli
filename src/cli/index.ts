#!/usr/bin/env node

import { createArgs } from '@hypernym/args'
import { logHelpDetails } from './help.js'
import { createBuilder } from './builder.js'
import { createConfigLoader } from './loader.js'
import { logger, error } from '../utils/index.js'
import { nodePatch } from '../utils/node.js'
import type { Args } from '../types/cli/index.js'

async function main() {
  const rootDir = process.cwd()
  const args = createArgs<Args>({ alias: { help: 'h', config: 'c' } })

  if (args.help) return logHelpDetails()

  const config = await createConfigLoader(rootDir, args).catch(error)
  if (!config) return logger.notFound('Configuration not found.')

  if (args['print-config']) {
    const { exportsPaths, binPaths, externals, ...printConfig } = config
    return logger.printConfig(printConfig)
  }

  if (config.hooks && config.hooks['rolli:start']) {
    await config.hooks['rolli:start']()
  }

  await createBuilder(rootDir, args, config).catch(error)

  if (config.hooks && config.hooks['rolli:end']) {
    await config.hooks['rolli:end']()
  }
}

nodePatch()

main().catch(error)
