import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POE_NINJA_STASH_OVERVIEW } from '@shared/endpoints'
import { _resetGemListingsForTests, getGemListings } from './gem-listings'

const PAYLOAD = {
  lines: [
    {
      name: 'Enhance Support',
      variant: '1',
      gemLevel: 1,
      corrupted: false,
      chaosValue: 8,
      listingCount: 417,
      sparkLine: { data: [] },
    },
    { name: 'Empower Support', variant: '3c', gemLevel: 3, corrupted: true, chaosValue: 30, listingCount: 804 },
    { name: 42, chaosValue: 1 },
  ],
}

beforeEach(() => {
  _resetGemListingsForTests()
})

describe('getGemListings', () => {
  it('requests the skill-gem stash overview for the league', async () => {
    const fetchJson = vi.fn().mockResolvedValue(PAYLOAD)
    await getGemListings('Hardcore Allflame', fetchJson)
    expect(fetchJson).toHaveBeenCalledWith(`${POE_NINJA_STASH_OVERVIEW}?league=Hardcore%20Allflame&type=SkillGem`)
  })

  it('keeps name, variant, level, corruption, price and listing count; drops malformed lines', async () => {
    const r = await getGemListings('Allflame', vi.fn().mockResolvedValue(PAYLOAD))
    expect(r.lines).toEqual([
      {
        name: 'Enhance Support',
        variant: '1',
        gemLevel: 1,
        gemQuality: 0,
        corrupted: false,
        chaosValue: 8,
        listingCount: 417,
      },
      {
        name: 'Empower Support',
        variant: '3c',
        gemLevel: 3,
        gemQuality: 0,
        corrupted: true,
        chaosValue: 30,
        listingCount: 804,
      },
    ])
  })

  it('serves repeat calls from cache', async () => {
    const fetchJson = vi.fn().mockResolvedValue(PAYLOAD)
    await getGemListings('Allflame', fetchJson)
    await getGemListings('Allflame', fetchJson)
    expect(fetchJson).toHaveBeenCalledTimes(1)
  })

  it('returns the stale cache with an error when a refetch fails', async () => {
    const fetchJson = vi.fn().mockResolvedValueOnce(PAYLOAD)
    await getGemListings('Allflame', fetchJson)
    const r = await getGemListings('Other', vi.fn().mockRejectedValue(new Error('down')))
    expect(r).toMatchObject({ lines: [], error: 'Could not reach poe.ninja.' })
  })
})
