import type { StatFilter } from '../../trade'
import { matchModToStat } from '../mod-matcher'

type EnchantItemInfo = {
  enchants?: string[]
  baseType?: string
}

// Process enchant lines (cluster jewel enchantments, weapon/armour corruption
// enchantments). `preferLocal` is set for items that carry local affixes
// (weapons/armour): their enchants -- e.g. a "Corruption Enhancement" granting
// "increased Attack Speed" -- live under the trade API's "(Local)" enchant stat,
// which matchModToStat otherwise discards in favour of a global lookalike (#399).
export function buildEnchantFilters(itemInfo: EnchantItemInfo | undefined, preferLocal = false): StatFilter[] {
  const enchantFilters: StatFilter[] = []
  if (itemInfo?.enchants) {
    const enchants = itemInfo.enchants
    for (let i = 0; i < enchants.length; i++) {
      let enchant = enchants[i]
      let matched = matchModToStat(enchant, preferLocal, 'enchant')
      // A two-line enchant prints each half as its own "(enchant)" line, e.g. the
      // boots enchant "+5% chance to Suppress Spell Damage if you've" / "taken Spell
      // Damage Recently" (enchant.stat_1503864797). When a line matches nothing on its
      // own, retry it joined with the next one; a line that matches alone is never
      // merged, so independent enchants (cluster jewel "Adds N Passive Skills" + its
      // grant line) stay separate rows.
      if (!matched && i + 1 < enchants.length) {
        const joined = `${enchant}\n${enchants[i + 1]}`
        const joinedMatch = matchModToStat(joined, preferLocal, 'enchant')
        if (joinedMatch) {
          matched = joinedMatch
          enchant = joined
          i++
        }
      }
      if (matched) {
        let minVal: number | null = matched.option ? null : matched.value
        let maxVal: number | null = null
        // Cluster jewel "Adds N Passive Skills": passive count drives price more
        // than any other roll, so the bracketed defaults below override the usual
        // "min = value" rule for the disjoint price tiers:
        //   Medium 4/5 -- functionally identical; a 6 is either cheap filler or
        //     a stat-stacker target, so 4-5 inclusive excludes both ends.
        //   Large 8 -- 8s and 12s are price-disjoint with no in-between, so an
        //     8-search wants max 8 (else every 12 surfaces).
        const isAddsPassives = enchant.includes('Adds') && matched.value != null
        if (isAddsPassives && itemInfo.baseType === 'Medium Cluster Jewel') {
          if (matched.value === 4 || matched.value === 5) {
            minVal = 4
            maxVal = 5
          }
        } else if (isAddsPassives && itemInfo.baseType === 'Large Cluster Jewel') {
          if (matched.value === 8) {
            minVal = null
            maxVal = 8
          }
        }
        enchantFilters.push({
          id: matched.statId,
          text: enchant,
          value: matched.value,
          min: minVal,
          max: maxVal,
          enabled: true,
          type: 'enchant',
          option: matched.option,
          aggregated: matched.aggregated,
        })
      }
    }
  }
  return enchantFilters
}
