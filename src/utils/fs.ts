import { resolve } from 'node:path'
import { access, constants, readdir } from 'node:fs/promises'

export async function exists(path: string) {
  return await access(path, constants.F_OK)
    .then(() => true)
    .catch(() => false)
}

export async function getDirFiles(path: string) {
  const dirPath = resolve(path)
  const dirFiles = await readdir(dirPath, { withFileTypes: true })

  let fileList: string[] = []

  for (const file of dirFiles) {
    const filePath = resolve(path, file.name)

    if (file.isDirectory()) {
      fileList = [...fileList, ...(await getDirFiles(filePath))]
    } else {
      fileList.push(filePath)
    }
  }

  return fileList
}
