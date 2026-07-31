import type {
  AbilityKey, AbilityScores, Character, Item, InventoryEntry,
} from '../types'
import { ABILITIES } from '../types'
import { classById, FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, PACT_SLOTS } from '../data/classes'
import { speciesById } from '../data/species'
import { backgroundById } from '../data/backgrounds'
import { itemById } from '../data/equipment'
import { SKILLS } from '../data/skills'
import { featById } from '../data/feats'

export const abilityMod = (score: number) => Math.floor((score - 10) / 2)
export const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

export const proficiencyBonus = (level: number) => 2 + Math.floor((level - 1) / 4)

/** Item resolvido de uma entrada do inventário (aplica bônus mágico +1/+2/+3 sobre a base). */
export interface ResolvedItem {
  entry: InventoryEntry
  item: Item
  bonus: number
  name: string
}

export function resolveInventory(char: Character): ResolvedItem[] {
  return char.inventory
    .map((entry) => {
      const item = itemById(entry.itemId)
      if (!item) return null
      const bonus = entry.bonus ?? 0
      const name = entry.customName ?? (bonus > 0 ? `${item.name} +${bonus}` : item.name)
      return { entry, item, bonus, name }
    })
    .filter((x): x is ResolvedItem => x !== null)
}

const activeMagicItems = (char: Character): ResolvedItem[] =>
  resolveInventory(char).filter((r) => r.entry.equipped || r.entry.attuned)

/**
 * Valores finais das habilidades: base + antecedente + ASIs/talentos,
 * limitados a 20; itens que FIXAM um valor (Amuleto da Saúde) sobrescrevem se forem maiores.
 */
export function finalAbilities(char: Character): AbilityScores {
  const result = { ...char.baseAbilities }

  // Bônus do antecedente (D&D 2024: +2/+1 ou +1/+1/+1)
  for (const [k, v] of Object.entries(char.backgroundBonuses)) {
    result[k as AbilityKey] += v ?? 0
  }

  // Incrementos de habilidade e talentos com aumento
  for (const choice of char.asiChoices) {
    if (choice.abilities) {
      for (const [k, v] of Object.entries(choice.abilities)) {
        result[k as AbilityKey] = Math.min(20, result[k as AbilityKey] + (v ?? 0))
      }
    }
  }

  for (const k of ABILITIES) result[k] = Math.min(20, result[k])

  // Itens que substituem o valor da habilidade (só se for maior)
  for (const { item, entry } of activeMagicItems(char)) {
    const set = item.magic?.setAbility
    if (!set) continue
    // Itens de sintonização só funcionam sintonizados
    if (item.magic?.attunement && !entry.attuned) continue
    for (const [k, v] of Object.entries(set)) {
      const key = k as AbilityKey
      if ((v ?? 0) > result[key]) result[key] = v!
    }
  }

  return result
}

export const abilityMods = (char: Character): AbilityScores => {
  const abs = finalAbilities(char)
  return ABILITIES.reduce((acc, k) => {
    acc[k] = abilityMod(abs[k])
    return acc
  }, {} as AbilityScores)
}

/** Bônus mágico agregado de itens equipados/sintonizados. */
export function magicBonuses(char: Character) {
  let ac = 0
  let save = 0
  const wearingArmor = resolveInventory(char).some((r) => r.entry.equipped && r.item.kind === 'armadura')
  const wearingShield = resolveInventory(char).some((r) => r.entry.equipped && r.item.kind === 'escudo')

  for (const { item, entry, bonus } of resolveInventory(char)) {
    if (!entry.equipped && !entry.attuned) continue
    const m = item.magic
    if (m) {
      if (m.attunement && !entry.attuned) continue
      if (m.requiresNoArmor && (wearingArmor || wearingShield)) continue
      ac += m.acBonus ?? 0
      save += m.saveBonus ?? 0
    }
    // Bônus +1/+2/+3 aplicado a armaduras/escudos comuns
    if (entry.equipped && bonus > 0 && (item.kind === 'armadura' || item.kind === 'escudo')) {
      ac += bonus
    }
  }
  return { ac, save }
}

/** Classe de Armadura, considerando armadura equipada, escudo, itens mágicos e defesas sem armadura. */
export function armorClass(char: Character): { total: number; breakdown: string } {
  const mods = abilityMods(char)
  const inv = resolveInventory(char)
  const armorEntry = inv.find((r) => r.entry.equipped && r.item.kind === 'armadura')
  const shieldEntry = inv.find((r) => r.entry.equipped && r.item.kind === 'escudo')
  const magic = magicBonuses(char)
  const cls = classById(char.classId)

  let base: number
  let label: string

  if (armorEntry?.item.armor) {
    const a = armorEntry.item.armor
    const dexPart = a.dexMax === undefined ? mods.des : Math.min(mods.des, a.dexMax)
    base = a.baseAC + dexPart
    label = `${armorEntry.name} ${a.baseAC}${dexPart ? ` ${fmtMod(dexPart)} DES` : ''}`
  } else {
    // Defesas sem armadura por classe (Bárbaro: DES+CON; Monge: DES+SAB)
    if (cls?.id === 'barbaro') {
      base = 10 + mods.des + mods.con
      label = `Defesa sem Armadura 10 ${fmtMod(mods.des)} DES ${fmtMod(mods.con)} CON`
    } else if (cls?.id === 'monge' && !shieldEntry) {
      base = 10 + mods.des + mods.sab
      label = `Defesa sem Armadura 10 ${fmtMod(mods.des)} DES ${fmtMod(mods.sab)} SAB`
    } else {
      base = 10 + mods.des
      label = `Sem armadura 10 ${fmtMod(mods.des)} DES`
    }
  }

  let total = base
  if (shieldEntry) {
    const shieldAC = (shieldEntry.item.armor?.baseAC ?? 2)
    total += shieldAC
    label += ` +${shieldAC} escudo`
  }
  if (magic.ac) {
    total += magic.ac
    label += ` ${fmtMod(magic.ac)} mágico`
  }

  return { total, breakdown: label }
}

/** PV máximo: nível 1 = dado cheio + CON; demais = média (ou rolagem) + CON. */
export function maxHp(char: Character): number {
  const cls = classById(char.classId)
  if (!cls) return 1
  const conMod = abilityMods(char).con
  const die = cls.hitDie
  const avg = die / 2 + 1

  let total = die + conMod
  for (let lv = 2; lv <= char.level; lv++) {
    const rolled = char.hpRolls[lv - 2]
    total += (rolled ?? avg) + conMod
  }

  // Robustez Anã: +1 PV por nível
  if (char.speciesId === 'anao') total += char.level
  // Talento Durão: +2 PV por nível
  const hasTough = char.asiChoices.some((c) => c.featId === 'durao')
    || backgroundById(char.backgroundId)?.featId === 'durao'
  if (hasTough) total += char.level * 2
  // Resiliência Dracônica (Feiticeiro Dracônico)
  if (char.subclassId === 'draconica') total += 3 + char.level

  return Math.max(1, total)
}

export const currentHp = (char: Character) => Math.max(0, maxHp(char) - char.damageTaken)

/** Iniciativa = mod. DES (+ prof. com o talento Alerta). */
export function initiative(char: Character): number {
  const mods = abilityMods(char)
  const bg = backgroundById(char.backgroundId)
  const hasAlerta = bg?.featId === 'alerta' || char.asiChoices.some((c) => c.featId === 'alerta')
  return mods.des + (hasAlerta ? proficiencyBonus(char.level) : 0)
}

export function speed(char: Character): number {
  const sp = speciesById(char.speciesId)?.speed ?? 9
  const cls = classById(char.classId)
  let bonus = 0
  const inv = resolveInventory(char)
  const heavyArmor = inv.some((r) => r.entry.equipped && r.item.armor?.category === 'pesada')
  if (cls?.id === 'barbaro' && char.level >= 5 && !heavyArmor) bonus += 3
  if (cls?.id === 'monge') {
    const noArmor = !inv.some((r) => r.entry.equipped && (r.item.kind === 'armadura' || r.item.kind === 'escudo'))
    if (noArmor) bonus += char.level >= 18 ? 9 : char.level >= 14 ? 7.5 : char.level >= 10 ? 6 : char.level >= 6 ? 4.5 : 3
  }
  if (cls?.id === 'patrulheiro' && char.level >= 6) bonus += 3
  return sp + bonus
}

/** Salvaguardas com proficiência da classe + bônus mágicos gerais. */
export function saves(char: Character) {
  const cls = classById(char.classId)
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const magic = magicBonuses(char).save
  return ABILITIES.map((k) => {
    const prof = cls?.saves.includes(k) ?? false
    return { ability: k, proficient: prof, value: mods[k] + (prof ? pb : 0) + magic }
  })
}

export function skillValues(char: Character) {
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  return SKILLS.map((s) => {
    const prof = char.skillProfs.includes(s.id)
    return { ...s, proficient: prof, value: mods[s.ability] + (prof ? pb : 0) }
  })
}

export function passivePerception(char: Character): number {
  const perc = skillValues(char).find((s) => s.id === 'percepcao')!
  return 10 + perc.value
}

// ---------- Conjuração ----------
export function spellcasting(char: Character) {
  const cls = classById(char.classId)
  if (!cls || cls.caster === 'nenhum' || !cls.spellAbility) return null
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const mod = mods[cls.spellAbility]
  return {
    ability: cls.spellAbility,
    mod,
    attackBonus: mod + pb,
    saveDC: 8 + mod + pb,
    caster: cls.caster,
  }
}

/** Espaços de magia por nível (1..9). Bruxo usa espaços de Pacto separados. */
export function spellSlots(char: Character): number[] {
  const cls = classById(char.classId)
  if (!cls) return []
  const lv = Math.min(20, Math.max(1, char.level))
  if (cls.caster === 'completo') return FULL_CASTER_SLOTS[lv - 1]
  if (cls.caster === 'meio') return [...HALF_CASTER_SLOTS[lv - 1], 0, 0, 0, 0]
  return []
}

export function pactSlots(char: Character): { count: number; level: number } | null {
  const cls = classById(char.classId)
  if (cls?.caster !== 'pacto') return null
  const [count, level] = PACT_SLOTS[Math.min(20, char.level) - 1]
  return { count, level }
}

export function preparedLimit(char: Character): number | null {
  const cls = classById(char.classId)
  if (!cls?.preparedByLevel) return null
  return cls.preparedByLevel[Math.min(20, char.level) - 1]
}

export function cantripLimit(char: Character): number {
  const cls = classById(char.classId)
  if (!cls?.cantripsByLevel) return 0
  return cls.cantripsByLevel[Math.min(20, char.level) - 1]
}

/** Nível máximo de magia acessível (para filtrar o catálogo). */
export function maxSpellLevel(char: Character): number {
  const slots = spellSlots(char)
  const pact = pactSlots(char)
  if (pact) return pact.level
  for (let i = slots.length - 1; i >= 0; i--) if (slots[i] > 0) return i + 1
  return 0
}

// ---------- Ações de ataque ----------
export interface AttackAction {
  uid: string
  name: string
  attackBonus: number
  damageDice: string
  damageBonus: number
  damageType: string
  properties: string[]
  range: string
  mastery: string
  versatileDice?: string
  ability: AbilityKey
}

/** Gera as entradas da aba de Ações a partir das armas equipadas. */
export function attackActions(char: Character): AttackAction[] {
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const cls = classById(char.classId)

  return resolveInventory(char)
    .filter((r) => r.entry.equipped && r.item.kind === 'arma' && r.item.weapon)
    .map(({ entry, item, bonus, name }) => {
      const wp = item.weapon!
      // Acuidade e armas à distância podem usar DES; escolhemos o melhor modificador
      let ability: AbilityKey = 'for'
      if (wp.ranged) ability = 'des'
      else if (wp.finesse) ability = mods.des > mods.for ? 'des' : 'for'
      // Monge: Artes Marciais permite DES em armas de monge
      if (cls?.id === 'monge' && !wp.heavy && !wp.twoHanded && mods.des > mods.for) ability = 'des'

      const proficient = isProficientWithWeapon(char, item)
      const abilityMod = mods[ability]

      return {
        uid: entry.uid,
        name,
        attackBonus: abilityMod + (proficient ? pb : 0) + bonus,
        damageDice: wp.damage,
        damageBonus: abilityMod + bonus,
        damageType: wp.damageType,
        properties: wp.properties,
        range: wp.range ?? (wp.ranged ? '—' : '1,5 m'),
        mastery: wp.mastery,
        versatileDice: wp.versatile,
        ability,
      }
    })
}

export function isProficientWithWeapon(char: Character, item: Item): boolean {
  const cls = classById(char.classId)
  if (!cls || !item.weapon) return false
  const cat = item.weapon.category
  const list = cls.weapons.join(' ').toLowerCase()
  if (cat === 'simples' && list.includes('simples')) return true
  if (cat === 'marcial') {
    if (list.includes('marciais') && !list.includes('marciais com')) return true
    // Ladino/Monge: marciais com Leve ou Acuidade
    if (list.includes('marciais com')) {
      if (cls.id === 'ladino') return !!(item.weapon.finesse || item.weapon.light)
      if (cls.id === 'monge') return !!item.weapon.light
    }
  }
  return false
}

export function isProficientWithArmor(char: Character, item: Item): boolean {
  const cls = classById(char.classId)
  if (!cls) return false
  if (item.kind === 'escudo') return cls.armor.includes('Escudos')
  const cat = item.armor?.category
  if (cat === 'leve') return cls.armor.includes('Leve')
  if (cat === 'média') return cls.armor.includes('Média')
  if (cat === 'pesada') return cls.armor.includes('Pesada')
  return false
}

/** Itens sintonizados (limite 3). */
export const attunedCount = (char: Character) => char.inventory.filter((e) => e.attuned).length

// ---------- Recursos limitados ----------
export interface ResourceState {
  id: string
  name: string
  max: number
  used: number
  recharge: 'curto' | 'longo'
}

export function characterResources(char: Character): ResourceState[] {
  const cls = classById(char.classId)
  if (!cls) return []
  const abs = finalAbilities(char)
  const list: ResourceState[] = cls.resources
    .filter((r) => char.level >= r.fromLevel)
    .map((r) => ({
      id: r.id,
      name: r.name,
      max: Math.max(0, r.max(char.level, abs)),
      used: char.resourcesUsed[r.id] ?? 0,
      recharge: r.recharge,
    }))

  // Recursos de espécie
  const pb = proficiencyBonus(char.level)
  const speciesRes: Record<string, ResourceState> = {
    aasimar: { id: 'maos-curativas', name: 'Mãos Curativas', max: 1, used: char.resourcesUsed['maos-curativas'] ?? 0, recharge: 'longo' },
    draconato: { id: 'sopro-draconico', name: 'Sopro Dracônico', max: pb, used: char.resourcesUsed['sopro-draconico'] ?? 0, recharge: 'longo' },
    anao: { id: 'conhecimento-da-pedra', name: 'Conhecimento da Pedra', max: pb, used: char.resourcesUsed['conhecimento-da-pedra'] ?? 0, recharge: 'longo' },
    golias: { id: 'dadiva-de-gigante', name: 'Dádiva de Gigante', max: pb, used: char.resourcesUsed['dadiva-de-gigante'] ?? 0, recharge: 'longo' },
    orc: { id: 'resistencia-implacavel', name: 'Resistência Implacável', max: 1, used: char.resourcesUsed['resistencia-implacavel'] ?? 0, recharge: 'longo' },
  }
  const sr = speciesRes[char.speciesId]
  if (sr) list.push(sr)

  // Talento Sortudo
  const bg = backgroundById(char.backgroundId)
  const hasLucky = bg?.featId === 'sortudo-talento' || char.asiChoices.some((c) => c.featId === 'sortudo-talento')
  if (hasLucky) {
    list.push({ id: 'pontos-de-sorte', name: 'Pontos de Sorte', max: pb, used: char.resourcesUsed['pontos-de-sorte'] ?? 0, recharge: 'longo' })
  }

  return list
}

/**
 * Marcador genérico usado na tabela da classe quando a subclasse concede algo naquele nível.
 * Quando a subclasse real já está escolhida, mostramos a característica dela em vez do marcador.
 */
const isGenericSubclassSlot = (name: string) => name === 'Característica de Subclasse'

/** Todas as características de classe desbloqueadas até o nível atual (inclui subclasse). */
export function unlockedFeatures(char: Character, uptoLevel = char.level) {
  const cls = classById(char.classId)
  if (!cls) return []
  const subclass = cls.subclasses.find((s) => s.id === char.subclassId)
  const subFeatures = subclass
    ? subclass.features.filter((f) => f.level <= uptoLevel).map((f) => ({ ...f, name: `${f.name} (${subclass.name})` }))
    : []
  const níveisComSubclasse = new Set(subFeatures.map((f) => f.level))
  const own = cls.features.filter(
    (f) => f.level <= uptoLevel && !(isGenericSubclassSlot(f.name) && níveisComSubclasse.has(f.level)),
  )
  return [...own, ...subFeatures].sort((a, b) => a.level - b.level)
}

/** O que muda ao subir para `newLevel` — usado pelo assistente de evolução. */
export function levelUpSummary(char: Character, newLevel: number) {
  const cls = classById(char.classId)
  if (!cls) return null
  const subclass = cls.subclasses.find((s) => s.id === char.subclassId)
  const newSubFeatures = subclass ? subclass.features.filter((f) => f.level === newLevel) : []
  const newFeatures = cls.features.filter(
    (f) => f.level === newLevel && !(isGenericSubclassSlot(f.name) && newSubFeatures.length > 0),
  )

  const before = { ...char, level: newLevel - 1 }
  const after = { ...char, level: newLevel }
  const slotsBefore = spellSlots(before)
  const slotsAfter = spellSlots(after)
  const newSlots = slotsAfter
    .map((n, i) => ({ level: i + 1, gained: n - (slotsBefore[i] ?? 0), total: n }))
    .filter((s) => s.gained > 0)

  const prepBefore = preparedLimit(before) ?? 0
  const prepAfter = preparedLimit(after) ?? 0
  const cantripBefore = cantripLimit(before)
  const cantripAfter = cantripLimit(after)

  const needsSubclass = !char.subclassId && cls.features.some((f) => f.level === newLevel && f.name.startsWith('Escolha de'))
  const needsAsi = cls.features.some((f) => f.level === newLevel && f.name === 'Incremento no Valor de Habilidade')

  const pactBefore = pactSlots(before)
  const pactAfter = pactSlots(after)

  return {
    level: newLevel,
    hitDie: cls.hitDie,
    features: [...newFeatures, ...newSubFeatures],
    newSlots,
    pactChanged: pactBefore && pactAfter && (pactBefore.count !== pactAfter.count || pactBefore.level !== pactAfter.level) ? pactAfter : null,
    newPrepared: prepAfter - prepBefore,
    preparedTotal: prepAfter,
    newCantrips: cantripAfter - cantripBefore,
    cantripTotal: cantripAfter,
    needsSubclass,
    needsAsi,
    proficiencyBonus: proficiencyBonus(newLevel),
    proficiencyChanged: proficiencyBonus(newLevel) !== proficiencyBonus(newLevel - 1),
  }
}

/** Talentos ativos do personagem (origem + escolhidos). */
export function characterFeats(char: Character) {
  const ids: string[] = []
  const bg = backgroundById(char.backgroundId)
  if (bg) ids.push(bg.featId)
  for (const c of char.asiChoices) if (c.featId) ids.push(c.featId)
  return ids.map((id) => featById(id)).filter((f): f is NonNullable<typeof f> => !!f)
}
