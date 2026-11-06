/** poe.ninja skill-gem lines with listing counts, for plugins (`ctx.prices.
 *  getGemListings`). Same reason as beast-prices.ts for not using the dense
 *  feed: it carries no `listingCount`, and volume is the point here - e.g.
 *  picking a cheap gem that enough sellers stock to buy several at once.
 *
 *  Lazy and PoE1-only: nothing fetches until a plugin asks. The TTL matches
 *  poe.ninja's own max-age on this endpoint, so polling faster gains nothing.
 *
 *  `fetchJson` is injected so this stays free of electron and unit-testable. */

import { POE_NINJA_STASH_OVERVIEW } from '@shared/endpoints'
import type { GemListing, GemListingsResult } from '@shared/contracts/prices'

export type { GemListing, GemListingsResult }

const TTL = 30 * 60 * 1000

let cachedLeague = ''
let cachedLines: GemListing[] = []
let lastFetchTime = 0

interface NinjaGemLine {
  name?: unknown
  variant?: unknown
  gemLevel?: unknown
  gemQuality?: unknown
  corrupted?: unknown
  chaosValue?: unknown
  listingCount?: unknown
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function parseGemLines(resp: unknown): GemListing[] {
  const lines = (resp as { lines?: unknown })?.lines
  if (!Array.isArray(lines)) return []
  const out: GemListing[] = []
  for (const entry of lines as NinjaGemLine[]) {
    if (typeof entry !== 'object' || entry === null) continue
    if (typeof entry.name !== 'string' || entry.name.length === 0) continue
    out.push({
      name: entry.name,
      ...(typeof entry.variant === 'string' ? { variant: entry.variant } : {}),
      gemLevel: num(entry.gemLevel),
      gemQuality: num(entry.gemQuality),
      corrupted: entry.corrupted === true,
      chaosValue: num(entry.chaosValue),
      listingCount: num(entry.listingCount),
    })
  }
  return out
}

export async function getGemListings(
  league: string,
  fetchJson: (url: string) => Promise<unknown>,
): Promise<GemListingsResult> {
  if (!league) return { lines: [], league, updatedAt: null, error: 'No league selected.' }

  const now = Date.now()
  if (cachedLeague === league && lastFetchTime > 0 && now - lastFetchTime < TTL) {
    return { lines: cachedLines, league, updatedAt: lastFetchTime }
  }

  try {
    const url = `${POE_NINJA_STASH_OVERVIEW}?league=${encodeURIComponent(league)}&type=SkillGem`
    const lines = parseGemLines(await fetchJson(url))
    cachedLines = lines
    cachedLeague = league
    lastFetchTime = now
    return { lines, league, updatedAt: now }
  } catch {
    // Hold the stale cache and leave lastFetchTime alone so the next call
    // retries, same as beast-prices.ts.
    const haveStale = cachedLeague === league && lastFetchTime > 0
    return {
      lines: haveStale ? cachedLines : [],
      league,
      updatedAt: haveStale ? lastFetchTime : null,
      error: 'Could not reach poe.ninja.',
    }
  }
}

/** Test hook: clear the module-level cache. */
export function _resetGemListingsForTests(): void {
  cachedLeague = ''
  cachedLines = []
  lastFetchTime = 0
}
