import type { RollEntry } from '../types'
import { uid } from './uid'

const rnd = (sides: number) => {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return (buf[0] % sides) + 1
}

export type Advantage = 'normal' | 'vantagem' | 'desvantagem'

export interface RollOptions {
  label: string
  count?: number
  sides: number
  modifier?: number
  advantage?: Advantage
  /** marca acerto crítico / falha crítica em rolagens de d20 */
  isD20Test?: boolean
}

export function roll({ label, count = 1, sides, modifier = 0, advantage = 'normal', isD20Test }: RollOptions): RollEntry {
  let rolls: number[] = []
  let discarded: number[] = []

  if (isD20Test && advantage !== 'normal') {
    const a = rnd(20)
    const b = rnd(20)
    const keep = advantage === 'vantagem' ? Math.max(a, b) : Math.min(a, b)
    const drop = advantage === 'vantagem' ? Math.min(a, b) : Math.max(a, b)
    rolls = [keep]
    discarded = [drop]
  } else {
    rolls = Array.from({ length: count }, () => rnd(sides))
  }

  const sum = rolls.reduce((a, b) => a + b, 0)
  const total = sum + modifier
  let crit: RollEntry['crit'] = null
  if (isD20Test) {
    if (rolls[0] === 20) crit = 'critico'
    else if (rolls[0] === 1) crit = 'falha'
  }

  const dicePart = isD20Test && advantage !== 'normal'
    ? `1d20 (${advantage})`
    : `${count}d${sides}`

  return {
    id: uid(),
    label,
    formula: `${dicePart}${modifier ? (modifier > 0 ? ` +${modifier}` : ` ${modifier}`) : ''}`,
    rolls,
    discarded: discarded.length ? discarded : undefined,
    modifier,
    total,
    crit,
    time: Date.now(),
  }
}

/** Rola "2d6" / "1d8" e devolve os dados individuais. */
export function rollDamageDice(dice: string, opts: { critical?: boolean } = {}): number[] {
  const m = /^(\d+)d(\d+)$/.exec(dice.trim())
  if (!m) return []
  let count = parseInt(m[1], 10)
  const sides = parseInt(m[2], 10)
  if (opts.critical) count *= 2 // acerto crítico: dobra os dados de dano
  return Array.from({ length: count }, () => rnd(sides))
}

export function rollDamage(label: string, dice: string, modifier: number, damageType: string, critical = false): RollEntry {
  const rolls = rollDamageDice(dice, { critical })
  const sum = rolls.reduce((a, b) => a + b, 0)
  const m = /^(\d+)d(\d+)$/.exec(dice.trim())
  const shown = critical && m ? `${parseInt(m[1], 10) * 2}d${m[2]}` : dice
  return {
    id: uid(),
    label: `${label} — ${damageType}${critical ? ' (CRÍTICO)' : ''}`,
    formula: `${shown}${modifier ? (modifier > 0 ? ` +${modifier}` : ` ${modifier}`) : ''}`,
    rolls,
    modifier,
    total: sum + modifier,
    crit: null,
    time: Date.now(),
  }
}

/** 4d6 descartando o menor — para o método de atributos rolados. */
export function roll4d6DropLowest(): { total: number; dice: number[] } {
  const dice = [rnd(6), rnd(6), rnd(6), rnd(6)].sort((a, b) => b - a)
  return { total: dice[0] + dice[1] + dice[2], dice }
}

export const rollHitDie = (sides: number) => rnd(sides)
