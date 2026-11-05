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
