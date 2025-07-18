import fs from 'fs'
import path from 'path'

export function createDirIfNotExists(dir: string) {
  const fullPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }

  return fullPath
}
