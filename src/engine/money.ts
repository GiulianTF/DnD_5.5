import type { CoinKey, CoinPurse } from '../types'
import { COIN_VALUE } from '../types'

/** Da menor para a maior — usada para gastar as moedinhas antes de quebrar as grandes. */
const CRESCENTE: CoinKey[] = ['pc', 'pp', 'pe', 'po', 'pl']
/** Moedas usadas para devolver troco (electro é evitado: quase nenhuma mesa usa). */
const TROCO: CoinKey[] = ['pl', 'po', 'pp', 'pc']

export const emptyPurse = (): CoinPurse => ({ pc: 0, pp: 0, pe: 0, po: 0, pl: 0 })

export const purseFromGold = (po: number): CoinPurse => ({ ...emptyPurse(), po: Math.max(0, Math.floor(po)) })

/** Valor total da bolsa em peças de cobre. */
export const purseInCopper = (p: CoinPurse): number =>
  CRESCENTE.reduce((sum, k) => sum + (p[k] ?? 0) * COIN_VALUE[k], 0)

/** Total convertido em peças de ouro, para exibição resumida. */
export const purseInGold = (p: CoinPurse): number => purseInCopper(p) / 100

/**
 * Lê o custo textual do catálogo ("25 PO", "5 PP", "1 PC") em peças de cobre.
 * Retorna null quando o item não tem preço definido.
 */
export function parseCost(cost?: string): number | null {
  if (!cost) return null
  const m = /^\s*([\d.,]+)\s*(PC|PP|PE|PO|PL)\s*$/i.exec(cost)
  if (!m) return null
  const valor = Number(m[1].replace(',', '.'))
  if (!Number.isFinite(valor)) return null
  return Math.round(valor * COIN_VALUE[m[2].toLowerCase() as CoinKey])
}

/** Distribui um valor em cobre entre as moedas de troco, das maiores para as menores. */
function distribuirTroco(copper: number): CoinPurse {
  const out = emptyPurse()
  let resto = copper
  for (const k of TROCO) {
    out[k] = Math.floor(resto / COIN_VALUE[k])
    resto -= out[k] * COIN_VALUE[k]
  }
  return out
}

/**
 * Paga `custoEmCobre` a partir da bolsa, gastando primeiro as moedas pequenas e
 * quebrando uma moeda maior (com troco) só quando necessário.
 * Retorna a bolsa nova, ou null se não houver dinheiro suficiente.
 */
export function pagar(bolsa: CoinPurse, custoEmCobre: number): CoinPurse | null {
  if (custoEmCobre <= 0) return { ...bolsa }
  if (purseInCopper(bolsa) < custoEmCobre) return null

  const resto: CoinPurse = { ...bolsa }
  let falta = custoEmCobre

  // 1. Gasta o que dá sem precisar de troco, começando pelas menores.
  for (const k of CRESCENTE) {
    if (falta <= 0) break
    const usar = Math.min(resto[k], Math.floor(falta / COIN_VALUE[k]))
    resto[k] -= usar
    falta -= usar * COIN_VALUE[k]
  }

  // 2. Ainda falta: quebra a menor moeda disponível que cubra o restante.
  if (falta > 0) {
    const k = CRESCENTE.find((c) => resto[c] > 0 && COIN_VALUE[c] >= falta)
    if (!k) return null
    resto[k] -= 1
    const troco = distribuirTroco(COIN_VALUE[k] - falta)
    for (const c of TROCO) resto[c] += troco[c]
  }

  return resto
}

/** "3 PO, 5 PP" — formato curto para mensagens. */
export function formatCopper(copper: number): string {
  if (copper <= 0) return '0 PC'
  const p = distribuirTroco(copper)
  return TROCO.filter((k) => p[k] > 0).map((k) => `${p[k]} ${k.toUpperCase()}`).join(', ')
}
