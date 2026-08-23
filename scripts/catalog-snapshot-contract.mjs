// Release invariant for the App Store's offline-safe first-paint catalog.

export const REQUIRED_SNAPSHOT_FIELDS = [
  'id', 'name', 'version', 'description', 'entry',
]

export function assertCompleteCatalogSnapshots(catalog, snapshots) {
  if (!Array.isArray(catalog?.apps) || catalog.apps.length === 0) {
    throw new Error('catalog.json has no apps')
  }
  if (!snapshots || typeof snapshots !== 'object' || Array.isArray(snapshots)) {
    throw new Error('manifest snapshots must be an object')
  }

  const catalogIds = catalog.apps.map((entry) => String(entry?.id || ''))
  const duplicate = catalogIds.find((id, index) => catalogIds.indexOf(id) !== index)
  if (duplicate) throw new Error(`${duplicate}: duplicate catalog entry`)

  const known = new Set(catalogIds)
  for (const id of Object.keys(snapshots)) {
    if (!known.has(id)) throw new Error(`${id}: snapshot has no catalog entry`)
  }

  for (const entry of catalog.apps) {
    const id = String(entry.id || '')
    const manifest = snapshots[id]
    if (!manifest) throw new Error(`${id || '(missing id)'}: snapshot is missing`)
    if (manifest.id !== id && manifest.previous_id !== id) {
      throw new Error(
        `${id}: snapshot identity is ${String(manifest.id || '(missing)')}`,
      )
    }
    for (const key of REQUIRED_SNAPSHOT_FIELDS) {
      if (typeof manifest[key] !== 'string' || !manifest[key]) {
        throw new Error(`${id}: snapshot is missing ${key}`)
      }
    }
  }
}
