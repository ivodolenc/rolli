import { access, constants } from 'node:fs/promises'

export async function exists(path: string) {
  return await access(path, constants.F_OK)
    .then(() => true)
    .catch(() => false)
}
