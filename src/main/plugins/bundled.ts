import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { addInstalledId } from './installed-list'
import { validateManifest } from './manifest-validator'
import { pluginDir, pluginEntryPath, pluginManifestPath, pluginsDir } from './paths'
import gemScannerEntry from './bundled/gem-scanner/plugin.js?raw'
import gemScannerManifest from './bundled/gem-scanner/manifest.json'

// Plugins shipped inside this build. Embedded in the main bundle (not
// extraResources) so they ride along in app.asar and the updater's asar swap
// delivers new plugin versions too.
const BUNDLED: { manifest: unknown; entry: string }[] = [{ manifest: gemScannerManifest, entry: gemScannerEntry }]

/** id -> bundled version last seeded. A plugin is (re)seeded only when its
 *  bundled version changes, so a user who uninstalls it keeps it uninstalled
 *  until the next build ships a new version. */
function seededJsonPath(): string {
  return join(pluginsDir(), 'bundled.json')
}

function readSeeded(): Record<string, string> {
  const p = seededJsonPath()
  if (!existsSync(p)) return {}
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8'))
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  } catch {
    return {}
  }
}

/** Copy bundled plugins into userData/plugins and mark them installed. Runs
 *  synchronously at startup, before the renderer asks for the plugin list. */
export function seedBundledPlugins(): void {
  const seeded = readSeeded()
  let changed = false
  for (const b of BUNDLED) {
    const v = validateManifest(b.manifest)
    if (!v.ok) {
      console.error('[Plugins] Bundled plugin has an invalid manifest:', v.error)
      continue
    }
    const { id, version } = v.manifest
    if (seeded[id] === version) continue
    try {
      mkdirSync(pluginDir(id), { recursive: true })
      writeFileSync(pluginEntryPath(id), b.entry)
      writeFileSync(pluginManifestPath(id), JSON.stringify(v.manifest, null, 2))
      addInstalledId(id)
      seeded[id] = version
      changed = true
    } catch (err) {
      console.error(`[Plugins] Failed to seed bundled plugin ${id}:`, (err as Error).message)
    }
  }
  if (changed) writeFileSync(seededJsonPath(), JSON.stringify(seeded))
}
