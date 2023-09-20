import { createFilter } from '@rollup/pluginutils'
import { transform, type TransformOptions } from 'esbuild'
import type { Plugin } from 'rollup'

export function esbuild(options?: TransformOptions): Plugin {
  const isJs = /\.(?:[mc]?js|jsx)$/
  const filter = createFilter(/\.([cm]?ts|[jt]sx)$/)

  return {
    name: 'esbuild',

    resolveId(id, importer, options) {
      if (isJs.test(id) && importer) {
        return this.resolve(id.replace(/js(x?)$/, 'ts$1'), importer, options)
      }
      return null
    },

    async transform(code, id) {
      if (!filter(id)) return null

      const result = await transform(code, {
        loader: 'default',
        ...options,
        sourcefile: id.replace(/\.[cm]ts/, '.ts'),
      })

      return {
        code: result.code,
        map: result.map || null,
      }
    },

    async renderChunk(code, { fileName }) {
      if (!options?.minify) return null

      if (/\.d\.(c|m)?tsx?$/.test(fileName)) return null

      const result = await transform(code, {
        ...options,
        sourcefile: fileName,
        minify: true,
      })

      return {
        code: result.code,
        map: result.map || null,
      }
    },
  }
}
