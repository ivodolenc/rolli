/**
 * Silences Node experimental warnings.
 *
 * @see [source](https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-pnp/sources/loader/applyPatch.ts)
 */
export function nodeWarningsPatch() {
  const originalEmit = process.emit
  // @ts-expect-error - TS complains about the return type of originalEmit.apply
  process.emit = function (name, data: any, ...args) {
    if (
      name === 'warning' &&
      typeof data === 'object' &&
      data.name === 'ExperimentalWarning'
    )
      return false

    return originalEmit.apply(
      process,
      args as unknown as Parameters<typeof process.emit>,
    )
  }
}
