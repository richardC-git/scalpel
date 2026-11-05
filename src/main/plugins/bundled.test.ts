import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import bundledManifest from './bundled/gem-scanner/manifest.json'

const TEST_USER_DATA = '/test/userData'

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => TEST_USER_DATA) },
}))

const mockFs = { files: new Map<string, string>(), dirs: new Set<string>() }

vi.mock('fs', () => ({
  readFileSync: (p: string) => {
    const v = mockFs.files.get(p)
    if (v == null) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    return v
  },
  existsSync: (p: string) => mockFs.files.has(p) || mockFs.dirs.has(p),
  writeFileSync: (p: string, data: string) => {
    mockFs.files.set(p, data)
  },
  mkdirSync: (p: string) => {
    mockFs.dirs.add(p)
  },
}))

const PLUGINS = join(TEST_USER_DATA, 'plugins')
const ID = bundledManifest.id
const installed = (): string[] => JSON.parse(mockFs.files.get(join(PLUGINS, 'installed.json')) ?? '[]')

describe('seedBundledPlugins', () => {
  beforeEach(() => {
    mockFs.files.clear()
    mockFs.dirs.clear()
  })

  it('copies the bundled plugin into userData and marks it installed', async () => {
    const { seedBundledPlugins } = await import('./bundled')
    seedBundledPlugins()
    expect(mockFs.files.get(join(PLUGINS, ID, 'plugin.js'))?.length).toBeGreaterThan(0)
    expect(JSON.parse(mockFs.files.get(join(PLUGINS, ID, 'manifest.json'))!)).toMatchObject({ id: ID })
    expect(installed()).toEqual([ID])
  })

  it('does not reinstall a plugin the user removed until its version changes', async () => {
    const { seedBundledPlugins } = await import('./bundled')
    seedBundledPlugins()
    mockFs.files.set(join(PLUGINS, 'installed.json'), '[]')
    seedBundledPlugins()
    expect(installed()).toEqual([])

    mockFs.files.set(join(PLUGINS, 'bundled.json'), JSON.stringify({ [ID]: '0.0.0-old' }))
    seedBundledPlugins()
    expect(installed()).toEqual([ID])
  })

  it('keeps other installed plugins', async () => {
    mockFs.files.set(join(PLUGINS, 'installed.json'), JSON.stringify(['other-plugin']))
    const { seedBundledPlugins } = await import('./bundled')
    seedBundledPlugins()
    expect(installed()).toEqual(['other-plugin', ID])
  })
})
