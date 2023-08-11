/**
 * Silences Node experimental warnings.
 *
 * When using the ESM loader Node.js prints either of the following warnings
 *
 * - ExperimentalWarning: --experimental-loader is an experimental feature. This feature could change at any time
 * - ExperimentalWarning: Custom ESM Loaders is an experimental feature. This feature could change at any time
 *
 * Having this warning show up once is "fine" but it's also printed
 * for each Worker that is created so it ends up spamming stderr.
 * Since that doesn't provide any value we suppress the warning.
 *
 * @see [source](https://github.com/yarnpkg/berry/blob/master/packages/yarnpkg-pnp/sources/loader/applyPatch.ts#L303)
 */
export function nodePatch() {
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
