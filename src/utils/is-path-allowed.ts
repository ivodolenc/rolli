export function isPathAllowed(
  path: string,
  extensions: string[] = ['.js', '.mjs', '.cjs'],
) {
  if (!path.startsWith('./')) return false

  return extensions.some((ext) => path.endsWith(ext))
}
