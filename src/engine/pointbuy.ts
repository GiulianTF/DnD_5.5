import type { AbilityScores } from '../types'
import { ABILITIES } from '../types'

export const POINT_BUY_TOTAL = 27
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export const pointBuySpent = (scores: AbilityScores): number =>
  ABILITIES.reduce((sum, k) => sum + (POINT_BUY_COST[scores[k]] ?? 0), 0)

export const pointBuyRemaining = (scores: AbilityScores) => POINT_BUY_TOTAL - pointBuySpent(scores)

export const emptyScores = (v = 8): AbilityScores => ({ for: v, des: v, con: v, int: v, sab: v, car: v })
