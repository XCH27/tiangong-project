/** Verify the resources copied into the Electron distribution. */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const source = join(import.meta.dir, '..', 'resources')
const destination = join(import.meta.dir, '..', 'dist', 'resources')

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? files(path) : entry.isFile() ? [path] : []
  })
}

if (!existsSync(destination)) throw new Error('Electron resources were not copied into dist/resources')

const missing = files(source).filter(file => {
  const copy = join(destination, relative(source, file))
  return !existsSync(copy) || statSync(copy).size !== statSync(file).size
})
if (missing.length > 0) {
  throw new Error(`Missing or incomplete Electron assets:\n${missing.map(file => relative(source, file)).join('\n')}`)
}

if (!existsSync(join(destination, 'docs', 'craft', 'index.md'))) {
  throw new Error('The local Craft documentation index is missing from the distribution')
}

console.log(`Validated ${files(source).length} bundled Electron assets`)
