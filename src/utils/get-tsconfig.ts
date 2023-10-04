import { resolve } from 'node:path'
import { exists } from '@hypernym/utils/node'

export async function getTsconfigRaw(
  rootDir: string,
  path: string,
): Promise<string | undefined> {
  const tsconfigPath = resolve(rootDir, path)
  const tsconfigFile = await exists(tsconfigPath)

  if (tsconfigFile) {
    const tsconfig = await import(tsconfigPath, {
      assert: { type: 'json' },
    })

    return JSON.stringify(tsconfig.default)
  }
}
