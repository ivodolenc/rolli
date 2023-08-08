#!/usr/bin/env node

import mri from 'mri'
import { cl, cyan } from 'colorate'
import { createBundle, logBundleStats } from './bundle.js'
import { logger } from '../utils/logger.js'
import { error } from '../utils/error.js'
import { nodeWarningsPatch } from '../utils/node.js'
import type { ConfigLoader } from '../types/cli/index.js'

async function main() {
  const rootDir = process.cwd()
  const args = mri(process.argv.splice(2))
  let config!: ConfigLoader
  const start = Date.now()

  logger.start()

  await createBundle(rootDir, args)
    .then((res) => {
      config = res
      const end = Date.now()

      logger.cyan(`⚡️ Bundling done in ` + cyan(`${end - start}ms`))
      cl()
    })
    .catch(error)

  await logBundleStats(rootDir, config)
}

nodeWarningsPatch()

main().catch(error)
