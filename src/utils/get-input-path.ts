import { parse } from 'node:path'
import { exists } from 'utills/node'

export async function getInputPath(
  srcDir: string,
  output: string,
  matcher?: string,
) {
  const outputDir = output.split('/')[1]
  const outputPath = output.replace(outputDir, srcDir)
  let inputJs = ''
  let inputTs = ''

  if (!matcher) {
    const outputExt = parse(outputPath).ext
    inputJs = outputPath.replace(outputExt, '.js')
    inputTs = outputPath.replace(outputExt, '.ts')
  } else {
    const outputBase = parse(outputPath).base
    inputJs = outputPath.replace(outputBase, `${matcher}.js`)
    inputTs = outputPath.replace(outputBase, `${matcher}.ts`)
  }

  const fileJs = await exists(inputJs)

  return fileJs ? inputJs : inputTs
}
