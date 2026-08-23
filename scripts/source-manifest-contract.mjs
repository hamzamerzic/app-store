import { access, readFile } from 'node:fs/promises'
import { posix, resolve } from 'node:path'

const STATIC_IMPORT = /\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?['"](\.[^'"]+)['"]/g
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g

function relativeImports(source) {
  const imports = []
  for (const pattern of [STATIC_IMPORT, DYNAMIC_IMPORT]) {
    pattern.lastIndex = 0
    for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
      imports.push(match[1])
    }
  }
  return imports
}

function resolvedImport(from, specifier) {
  return posix.normalize(posix.join(posix.dirname(from), specifier))
}

export async function assertCompleteSourceManifest(root, manifest) {
  const entry = String(manifest?.entry || '')
  const sourceFiles = Array.isArray(manifest?.source_files) ? manifest.source_files : []
  if (!entry) throw new Error('mobius.json is missing entry')
  if (!sourceFiles.length) throw new Error('mobius.json is missing source_files')

  const declared = new Set([entry, ...sourceFiles])
  const job = manifest?.schedule?.job
  if (typeof job === 'string' && job) declared.add(job)
  if (declared.size !== 1 + sourceFiles.length + (job ? 1 : 0)) {
    throw new Error('mobius.json contains duplicate source paths')
  }

  for (const rel of declared) {
    if (!rel || rel.startsWith('/') || rel.split('/').includes('..')) {
      throw new Error(`${rel || '(empty)'}: source path is invalid`)
    }
    try {
      await access(resolve(root, rel))
    } catch {
      throw new Error(`${rel}: declared source file is missing`)
    }
  }

  const visited = new Set()
  const queue = [entry, ...(job ? [job] : [])]
  while (queue.length) {
    const rel = queue.shift()
    if (visited.has(rel)) continue
    visited.add(rel)
    if (!/\.(?:[cm]?js|jsx|tsx?)$/i.test(rel)) continue
    const source = await readFile(resolve(root, rel), 'utf8')
    for (const specifier of relativeImports(source)) {
      const imported = resolvedImport(rel, specifier)
      if (!declared.has(imported)) {
        throw new Error(`${rel}: relative import ${specifier} is not declared in source_files`)
      }
      queue.push(imported)
    }
  }
}
