export function isPathAllowed(output: string) {
  if (!output.startsWith('./')) return false

  const outputExtensions = ['.js', '.mjs', '.cjs']

  return outputExtensions.some((ext) => output.endsWith(ext))
}
