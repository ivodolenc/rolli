import { parse } from 'node:path'
import { exists } from './fs.js'

export async function getInputPath(srcDir: string, output: string) {
  const outputDir = output.split('/')[1]
  const inputDir = output.replace(outputDir, srcDir)
  const inputJs = inputDir.replace(parse(inputDir).ext, '.js')
  const inputTs = inputDir.replace(parse(inputDir).ext, '.ts')
  const fileJs = await exists(inputJs)

  return fileJs ? inputJs : inputTs
}
