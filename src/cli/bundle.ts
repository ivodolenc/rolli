import { resolve } from 'node:path'
import { stat } from 'node:fs/promises'
import { cl, darken, lime } from 'colorate'
import { createConfigLoader } from './loader.js'
import { createBuilder } from './builder.js'
import { getDirFiles } from '../utils/fs.js'
import { formatBytes } from '../utils/format-bytes.js'
import { logger } from '../utils/logger.js'
import type { ArgsOptions, ConfigLoader } from '../types/cli/index.js'

export async function logBundleStats(rootDir: string, config: ConfigLoader) {
  const { outDir } = config
  const dirPath = resolve(rootDir, outDir as string)
  const files = await getDirFiles(dirPath)

  let bundleSize = 0
  const filesSuffix = files.length > 1 ? ' files' : ' file'

  for (const [index, file] of files.entries()) {
    const fileStat = await stat(file)
    const filePath = file.split(outDir as string)
    const { size } = fileStat
    bundleSize += size

    const pathPrefix = index === files.length - 1 ? '└─' : '├─'

    cl(
      `  ${pathPrefix} ${darken(`${outDir}${filePath[1]}`)} → ${lime(
        formatBytes(size),
      )}`,
    )
  }

  const bundleStats = lime(
    `${files.length}${filesSuffix}, ${formatBytes(bundleSize)}`,
  )

  cl()
  logger.lime(`📦 Bundle stats: ${bundleStats}`)
  cl()
}

export async function createBundle(rootDir: string, args: ArgsOptions) {
  const config = await createConfigLoader(rootDir, args)
  if (!config) return logger.notFound('Configuration not found.')

  logger.config(config.type)

  await createBuilder(rootDir, config)

  return config
}
