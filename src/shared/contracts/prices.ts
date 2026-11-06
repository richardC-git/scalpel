export interface PriceInfo {
  chaosValue: number
  divineValue?: number
  dustValue?: number
  graph?: (number | null)[]
  ninjaCategory?: string
}

export interface PriceEntry {
  name: string
  category: string
  chaosValue: number
  divineValue?: number
  graph?: (number | null)[]
  /** poe.ninja's raw overview type for this entry ('DivinationCard', 'Ritual').
   *  Distinct from `category`, which is the kebab URL segment -- the exchange
   *  details endpoint only accepts the raw form. Captured live on each refresh
   *  so a new GGG category needs no code change. */
  ninjaType?: string
  /** poe.ninja's variant label for items it splits across several lines,
   *  e.g. '20/20' or '21/23c' for skill gems, or a base type / link count for
   *  uniques. Absent when the line has no variant. Lets plugins tell apart
   *  same-named entries. */
  variant?: string
}

/** One poe.ninja skill-gem line with its listing count (PoE1). */
export interface GemListing {
  name: string
  /** poe.ninja's level/quality label, e.g. '1', '3c', '20/20' */
  variant?: string
  gemLevel: number
  gemQuality: number
  corrupted: boolean
  chaosValue: number
  /** Listings poe.ninja saw for this line: a proxy for how easy it is to buy */
  listingCount: number
}

export interface GemListingsResult {
  lines: GemListing[]
  league: string
  /** Epoch ms of the last successful fetch, or null if there has never been one. */
  updatedAt: number | null
  /** Set when the latest attempt failed; `lines` may still hold stale data. */
  error?: string
}
