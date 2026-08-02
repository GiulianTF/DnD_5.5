import type {
  AbilityKey, AbilityScores, AlwaysPreparedSpell, Character, ChoiceOption, InnateSpell, Item,
  InventoryEntry, OptionGroup, PreparationMode, Spell, SpellPick, Subclass,
} from '../types'
import { ABILITIES } from '../types'
import {
  classById, FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, PACT_SLOTS, THIRD_CASTER_SLOTS,
} from '../data/classes'
import { speciesById } from '../data/species'
import { backgroundById } from '../data/backgrounds'
import { WEAPONS, itemById } from '../data/equipment'
import { SKILLS } from '../data/skills'
import { SPELLS, spellById } from '../data/spells'
import { featById } from '../data/feats'

export const abilityMod = (score: number) => Math.floor((score - 10) / 2)
export const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

export const proficiencyBonus = (level: number) => 2 + Math.floor((level - 1) / 4)

/** A subclasse escolhida, quando já existe. */
export const subclassOf = (char: Character): Subclass | null =>
  classById(char.classId)?.subclasses.find((s) => s.id === char.subclassId) ?? null

// ---------- Escolhas de espécie, de classe e de subclasse ----------
/** Um grupo de escolha junto com a opção que o personagem selecionou (se houver). */
export interface ResolvedChoice {
  source: 'especie' | 'classe' | 'subclasse'
  group: OptionGroup
  chosen: ChoiceOption | null
}

/** Grupos de escolha já desbloqueados pelo nível atual, com a opção selecionada. */
export function characterChoices(char: Character, uptoLevel = char.level): ResolvedChoice[] {
  const out: ResolvedChoice[] = []
  const push = (source: ResolvedChoice['source'], groups: OptionGroup[] | undefined, picks: Record<string, string>) => {
    for (const group of groups ?? []) {
      if ((group.level ?? 1) > uptoLevel) continue
      out.push({ source, group, chosen: group.options.find((o) => o.id === picks[group.id]) ?? null })
    }
  }
  push('especie', speciesById(char.speciesId)?.choices, char.speciesChoices ?? {})
  push('classe', classById(char.classId)?.choices, char.classChoices ?? {})
  // Escolhas da subclasse (terreno do Círculo da Terra) moram no mesmo balde da classe.
  push('subclasse', subclassOf(char)?.choices, char.classChoices ?? {})
  return out
}

/** Escolhas obrigatórias ainda não feitas — usado para avisar na ficha. */
export const pendingChoices = (char: Character, uptoLevel = char.level) =>
  characterChoices(char, uptoLevel).filter((c) => !c.chosen)

/** Só as escolhas de espécie já feitas (linhagem élfica, ancestral dracônico...). */
export const speciesVariants = (char: Character) =>
  characterChoices(char)
    .filter((c) => c.source === 'especie' && c.chosen)
    .map((c) => ({ group: c.group.name, option: c.chosen!.name }))

/**
 * Rótulo curto da variação da espécie, para o cabeçalho da ficha:
 * "Elfo (Drow)" em vez de só "Elfo".
 */
export function speciesLabel(char: Character): string {
  const nome = speciesById(char.speciesId)?.name ?? char.speciesId
  const variante = speciesVariants(char)[0]?.option
  return variante ? `${nome} (${variante})` : nome
}

/** Perícias concedidas por opções escolhidas (ex.: Sentidos Aguçados do Elfo). */
export function grantedSkills(char: Character): string[] {
  return characterChoices(char)
    .map((c) => c.chosen?.grantsSkill)
    .filter((s): s is string => !!s)
}

/** Todas as perícias treinadas: escolhidas na criação + concedidas por traços. */
export const allSkillProfs = (char: Character): string[] =>
  [...new Set([...(char.skillProfs ?? []), ...grantedSkills(char)])]

/**
 * Ids de todos os talentos ativos: o de origem do antecedente, os de origem
 * extras (Humano), os escolhidos em ASI e os Estilos de Luta escolhidos.
 */
export function allFeatIds(char: Character): string[] {
  const ids: string[] = []
  const bg = backgroundById(char.backgroundId)
  if (bg) ids.push(bg.featId)
  ids.push(...(char.originFeats ?? []))
  for (const c of char.asiChoices ?? []) if (c.featId) ids.push(c.featId)
  // Estilos de Luta são talentos escolhidos por características de classe
  for (const { chosen } of characterChoices(char)) {
    if (chosen && featById(chosen.id)) ids.push(chosen.id)
  }
  return [...new Set(ids)]
}

export const hasFeat = (char: Character, featId: string) => allFeatIds(char).includes(featId)

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
  // Estilo de Luta: Defesa (+1 na CA usando armadura)
  if (armorEntry && hasFeat(char, 'estilo-defesa')) {
    total += 1
    label += ' +1 Defesa'
  }
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
  if (hasFeat(char, 'durao')) total += char.level * 2
  // Resiliência Dracônica (Feiticeiro Dracônico)
  if (char.subclassId === 'draconica') total += 3 + char.level

  return Math.max(1, total)
}

export const currentHp = (char: Character) => Math.max(0, maxHp(char) - char.damageTaken)

/** Iniciativa = mod. DES (+ prof. com o talento Alerta). */
export function initiative(char: Character): number {
  const mods = abilityMods(char)
  return mods.des + (hasFeat(char, 'alerta') ? proficiencyBonus(char.level) : 0)
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
  const profs = allSkillProfs(char)
  return SKILLS.map((s) => {
    const prof = profs.includes(s.id)
    return { ...s, proficient: prof, value: mods[s.ability] + (prof ? pb : 0) }
  })
}

export function passivePerception(char: Character): number {
  const perc = skillValues(char).find((s) => s.id === 'percepcao')!
  return 10 + perc.value
}

// ---------- Conjuração ----------
/**
 * Conjuração concedida pela subclasse a uma classe que não conjura
 * (Cavaleiro Místico e Trapaceiro Arcano), quando já está desbloqueada.
 */
export function subclassSpellcasting(char: Character) {
  const sc = subclassOf(char)?.spellcasting
  return sc && char.level >= sc.fromLevel ? sc : null
}

export function spellcasting(char: Character) {
  const cls = classById(char.classId)
  if (!cls) return null
  const sub = subclassSpellcasting(char)
  const ability = sub?.ability ?? (cls.caster !== 'nenhum' ? cls.spellAbility : undefined)
  if (!ability) return null
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const mod = mods[ability]
  return {
    ability,
    mod,
    attackBonus: mod + pb,
    saveDC: 8 + mod + pb,
    caster: sub ? ('terco' as const) : cls.caster,
  }
}

/** Espaços de magia por nível (1..9). Bruxo usa espaços de Pacto separados. */
export function spellSlots(char: Character): number[] {
  const cls = classById(char.classId)
  if (!cls) return []
  const lv = Math.min(20, Math.max(1, char.level))
  if (subclassSpellcasting(char)) return [...THIRD_CASTER_SLOTS[lv - 1], 0, 0, 0, 0, 0]
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
  const tabela = subclassSpellcasting(char)?.preparedByLevel ?? classById(char.classId)?.preparedByLevel
  if (!tabela) return null
  return tabela[Math.min(20, char.level) - 1]
}

/** Opções de classe que concedem um truque extra da própria lista da classe. */
const TRUQUE_EXTRA_DE_CLASSE = ['taumaturgo', 'mago-primal']

export function cantripLimit(char: Character): number {
  const tabela = subclassSpellcasting(char)?.cantripsByLevel ?? classById(char.classId)?.cantripsByLevel
  if (!tabela) return 0
  const base = tabela[Math.min(20, char.level) - 1]
  // Ordem Divina (Taumaturgo) e Ordem Primal (Xamã) dão mais um truque.
  const extra = characterChoices(char).some(
    (c) => c.source === 'classe' && c.chosen && TRUQUE_EXTRA_DE_CLASSE.includes(c.chosen.id),
  ) ? 1 : 0
  return base + extra
}

// ---------- Preparação de magias ----------
/** Como esta ficha muda a lista de magias preparadas (PHB 2024). */
export function preparationMode(char: Character): PreparationMode | null {
  // Cavaleiro Místico e Trapaceiro Arcano trocam uma magia ao subir de nível.
  if (subclassSpellcasting(char)) return 'nivel-uma'
  return classById(char.classId)?.preparation ?? null
}

/** Texto da regra de troca, exibido junto da lista de magias preparadas. */
export const PREPARATION_RULES: Record<PreparationMode, { quando: string; quantas: string; texto: string }> = {
  'descanso-todas': {
    quando: 'Ao completar um Descanso Longo',
    quantas: 'Qualquer quantidade',
    texto: 'Sempre que completar um Descanso Longo você redefine a lista inteira, escolhendo livremente entre todas as magias da sua classe para as quais você tem espaços de magia.',
  },
  'grimorio': {
    quando: 'Ao completar um Descanso Longo',
    quantas: 'Qualquer quantidade',
    texto: 'Sempre que completar um Descanso Longo você redefine a lista inteira, escolhendo entre as magias do seu grimório.',
  },
  'descanso-uma': {
    quando: 'Ao completar um Descanso Longo',
    quantas: 'Uma magia',
    texto: 'A cada Descanso Longo você pode substituir uma magia da lista por outra da sua classe para a qual tenha espaços de magia.',
  },
  'nivel-uma': {
    quando: 'Ao subir de nível',
    quantas: 'Uma magia',
    texto: 'Sempre que ganha um nível nesta classe você pode substituir uma magia da lista por outra para a qual tenha espaços de magia.',
  },
}

/** Ids das classes cujas listas de magia esta ficha pode preparar. */
export function spellListClasses(char: Character): string[] {
  const sub = subclassSpellcasting(char)
  if (sub) return [sub.list]
  // Bardo nível 10 (Segredos Mágicos): as novas magias podem vir de outras listas.
  if (char.classId === 'bardo' && char.level >= 10) return ['bardo', 'clerigo', 'druida', 'mago']
  return [char.classId]
}

/** Truques que a ficha pode escolher (lista da classe ou da subclasse conjuradora). */
export function availableCantrips(char: Character): Spell[] {
  const listas = spellListClasses(char)
  return SPELLS.filter((s) => s.level === 0 && s.classes.some((c) => listas.includes(c)))
}

/** Todas as magias de 1º círculo ou superior da lista da classe até o círculo acessível. */
export function classSpellCatalog(char: Character): Spell[] {
  const maxLvl = maxSpellLevel(char)
  const listas = spellListClasses(char)
  return SPELLS.filter((s) => s.level >= 1 && s.level <= maxLvl && s.classes.some((c) => listas.includes(c)))
}

/**
 * Magias de 1º círculo ou superior entre as quais é possível preparar. Para o
 * Mago, só as do grimório; para as demais classes, toda a lista da classe.
 */
export function preparableSpells(char: Character): Spell[] {
  const maxLvl = maxSpellLevel(char)
  if (preparationMode(char) === 'grimorio') {
    return char.spellsKnown
      .map((id) => spellById(id))
      .filter((s): s is Spell => !!s && s.level >= 1 && s.level <= maxLvl)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  }
  return classSpellCatalog(char)
}

/** Magias preparadas que ocupam vaga no limite da classe (as automáticas não contam). */
export function preparedSpellIds(char: Character): string[] {
  const automaticas = new Set(alwaysPreparedSpells(char).map((m) => m.spell.id))
  return [...new Set(char.spellsPrepared)]
    .filter((id) => (spellById(id)?.level ?? 0) > 0 && !automaticas.has(id))
}

/** Truques conhecidos que ocupam vaga no limite de truques. */
export function knownCantripIds(char: Character): string[] {
  const automaticas = new Set(alwaysPreparedSpells(char).map((m) => m.spell.id))
  return [...new Set(char.spellsKnown)]
    .filter((id) => spellById(id)?.level === 0 && !automaticas.has(id))
}

// ---------- Magias sempre preparadas (subclasse) ----------
export interface ResolvedAlwaysPrepared {
  spell: Spell
  /** de onde veio: "Domínio da Vida", "Terreno do Círculo da Terra: Polar" */
  source: string
}

/**
 * Magias que uma característica mantém sempre preparadas — magias de domínio,
 * de patrono, de juramento, do círculo druídico e afins. Elas gastam espaços de
 * magia normalmente e NÃO ocupam vaga na lista de magias preparadas.
 */
export function alwaysPreparedSpells(char: Character): ResolvedAlwaysPrepared[] {
  const out: ResolvedAlwaysPrepared[] = []
  const vistos = new Set<string>()
  const add = (lista: AlwaysPreparedSpell[] | undefined, source: string) => {
    for (const it of lista ?? []) {
      if (char.level < it.level || vistos.has(it.spellId)) continue
      const spell = spellById(it.spellId)
      if (!spell) continue
      vistos.add(spell.id)
      out.push({ spell, source })
    }
  }

  const sub = subclassOf(char)
  if (sub) add(sub.alwaysPrepared, sub.name)
  for (const { group, chosen } of characterChoices(char)) {
    if (chosen?.alwaysPrepared) add(chosen.alwaysPrepared, `${group.name}: ${chosen.name}`)
  }
  // Grupos de escolha marcados como "sempre preparada" (Segredos Mágicos do Colégio do Conhecimento)
  for (const { pick, chosen } of spellPickGroups(char)) {
    if (!pick.alwaysPrepared) continue
    add(chosen.map((spellId) => ({ spellId, level: pick.level })), pick.source)
  }

  return out.sort((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name))
}

// ---------- Magias concedidas pela espécie ----------
export interface ResolvedInnateSpell {
  spell: Spell
  ability: AbilityKey
  attackBonus: number
  saveDC: number
  freeUses?: InnateSpell['freeUses']
  /** de onde veio: "Elfo · Linhagem Élfica (Drow)" */
  source: string
  nota?: string
}

/** Texto curto explicando como a magia pode ser conjurada de graça. */
export function innateUsesLabel(char: Character, freeUses?: InnateSpell['freeUses']): string {
  if (freeUses === 'vontade') return 'À vontade'
  if (freeUses === 'prof-longo') return `${proficiencyBonus(char.level)}×/descanso longo`
  if (freeUses === 'longo') return '1×/descanso longo (ou gastando um espaço de magia)'
  return ''
}

// ---------- Magias escolhidas fora da lista da classe ----------
/** Um grupo de escolha de magias (espécie, talento, estilo de luta) já resolvido. */
export interface ResolvedSpellPick {
  pick: SpellPick
  /** magias do catálogo que satisfazem o filtro do grupo */
  options: Spell[]
  /** ids já escolhidos na ficha */
  chosen: string[]
  /** ainda faltam escolhas neste grupo */
  pending: boolean
}

/**
 * Todos os grupos de "escolha uma magia" que NÃO vêm da lista da classe:
 * linhagens de espécie, talentos de origem, talentos gerais e Estilos de Luta.
 * O assistente de criação e o de evolução mostram todos eles junto das magias
 * da classe, para o jogador nunca precisar caçar a escolha em outro passo.
 */
export function spellPickGroups(
  char: Character,
  opts: { uptoLevel?: number; extraFeatIds?: string[] } = {},
): ResolvedSpellPick[] {
  const uptoLevel = opts.uptoLevel ?? char.level
  const picks: SpellPick[] = []

  const sp = speciesById(char.speciesId)
  if (sp?.spellPicks) picks.push(...sp.spellPicks)
  const cls = classById(char.classId)
  if (cls?.spellPicks) picks.push(...cls.spellPicks)
  const sub = subclassOf(char)
  if (sub?.spellPicks) picks.push(...sub.spellPicks)
  for (const { chosen } of characterChoices(char, uptoLevel)) {
    if (chosen?.spellPicks) picks.push(...chosen.spellPicks)
  }
  for (const id of [...allFeatIds(char), ...(opts.extraFeatIds ?? [])]) {
    const feat = featById(id)
    if (feat?.spellPicks) picks.push(...feat.spellPicks)
  }

  // Segredos Mágicos e afins oferecem qualquer círculo até o maior acessível.
  const teto = maxSpellLevel({ ...char, level: uptoLevel })
  const vistos = new Set<string>()
  return picks
    .filter((p) => p.level <= uptoLevel && !vistos.has(p.id) && vistos.add(p.id) !== undefined)
    .map((pick) => {
      const options = SPELLS.filter(
        (s) => (pick.upToMaxSlot ? s.level >= pick.spellLevel && s.level <= teto : s.level === pick.spellLevel)
          && s.classes.some((c) => pick.fromClasses.includes(c))
          && (!pick.schools || pick.schools.includes(s.school)),
      )
      const chosen = (char.spellPicks?.[pick.id] ?? []).filter((id) => options.some((o) => o.id === id))
      return { pick, options, chosen, pending: chosen.length < pick.count }
    })
}

/** Magias fixas concedidas por talentos (Passo Nebuloso do Tocado pelo Feérico). */
function featInnateSpells(char: Character): { lista: InnateSpell[]; source: string }[] {
  const out: { lista: InnateSpell[]; source: string }[] = []
  for (const id of allFeatIds(char)) {
    const feat = featById(id)
    if (feat?.innateSpells?.length) out.push({ lista: feat.innateSpells, source: feat.name })
  }
  return out
}

/**
 * Truques e magias que vêm de fora da lista da classe no nível atual: traços da
 * espécie, linhagem escolhida, talentos e as magias escolhidas nos grupos de
 * escolha. Valem para qualquer classe — inclusive quem não conjura, como o Guerreiro.
 */
export function innateSpells(char: Character): ResolvedInnateSpell[] {
  const sp = speciesById(char.speciesId)
  const pb = proficiencyBonus(char.level)
  const mods = abilityMods(char)

  const fontes: { lista: InnateSpell[]; source: string }[] = []
  if (sp?.innateSpells?.length) fontes.push({ lista: sp.innateSpells, source: sp.name })
  for (const { source, group, chosen } of characterChoices(char)) {
    if (source !== 'especie' || !chosen?.innateSpells?.length) continue
    fontes.push({ lista: chosen.innateSpells, source: `${group.name}: ${chosen.name}` })
  }
  fontes.push(...featInnateSpells(char))
  // As magias escolhidas nos grupos entram como se fossem concedidas pela fonte.
  // As marcadas como `alwaysPrepared` são conjuradas com espaços normais e
  // aparecem em `alwaysPreparedSpells`, não aqui.
  for (const { pick, chosen } of spellPickGroups(char)) {
    if (pick.alwaysPrepared) continue
    fontes.push({
      source: pick.source,
      lista: chosen.map((spellId) => ({
        spellId, level: pick.level, abilities: pick.abilities, freeUses: pick.freeUses, nota: pick.nota,
      })),
    })
  }

  const out: ResolvedInnateSpell[] = []
  const vistos = new Set<string>()
  for (const { lista, source } of fontes) {
    for (const it of lista) {
      if (char.level < it.level) continue
      const spell = spellById(it.spellId)
      if (!spell || vistos.has(spell.id)) continue
      vistos.add(spell.id)
      // Quando a regra deixa escolher a habilidade, usamos a melhor do personagem.
      const ability = [...it.abilities].sort((a, b) => mods[b] - mods[a])[0]
      const mod = mods[ability]
      out.push({
        spell, ability, attackBonus: mod + pb, saveDC: 8 + mod + pb,
        freeUses: it.freeUses, source, nota: it.nota,
      })
    }
  }
  return out.sort((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name))
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

/**
 * Todo o treinamento com armadura: o da classe mais o concedido por escolhas
 * (Ordem Divina do Clérigo, Ordem Primal do Druida) e pela subclasse
 * (Treinamento Marcial do Colégio da Bravura).
 */
export function armorTraining(char: Character): string[] {
  const out = [...(classById(char.classId)?.armor ?? [])]
  for (const { chosen } of characterChoices(char)) out.push(...(chosen?.armor ?? []))
  out.push(...(subclassOf(char)?.armor ?? []))
  return [...new Set(out)]
}

/** Todas as proficiências com armas, das mesmas fontes de `armorTraining`. */
export function weaponTraining(char: Character): string[] {
  const out = [...(classById(char.classId)?.weapons ?? [])]
  for (const { chosen } of characterChoices(char)) out.push(...(chosen?.weapons ?? []))
  out.push(...(subclassOf(char)?.weapons ?? []))
  return [...new Set(out)]
}

export function isProficientWithWeapon(char: Character, item: Item): boolean {
  const wp = item.weapon
  if (!wp) return false
  for (const entrada of weaponTraining(char).map((w) => w.toLowerCase())) {
    if (wp.category === 'simples') {
      if (entrada.includes('simples')) return true
      continue
    }
    if (!entrada.includes('marciais')) continue
    // "Marciais com propriedade Leve (ou Acuidade)" — Ladino e Monge
    if (!entrada.includes('com propriedade')) return true
    if (entrada.includes('leve') && wp.light) return true
    if (entrada.includes('acuidade') && wp.finesse) return true
  }
  return false
}

export function isProficientWithArmor(char: Character, item: Item): boolean {
  const treino = armorTraining(char)
  if (item.kind === 'escudo') return treino.includes('Escudos')
  const cat = item.armor?.category
  if (cat === 'leve') return treino.includes('Leve')
  if (cat === 'média') return treino.includes('Média')
  if (cat === 'pesada') return treino.includes('Pesada')
  return false
}

/** Itens sintonizados (limite 3). */
export const attunedCount = (char: Character) => char.inventory.filter((e) => e.attuned).length

// ---------- Maestria em Armas ----------
/** Quantas armas o personagem pode escolher para a Maestria em Armas no nível atual. */
export function weaponMasteryCount(char: Character): number {
  const cls = classById(char.classId)
  return cls?.masteryCount?.(char.level) ?? 0
}

/** Armas com as quais a classe é proficiente — a Maestria só pode ser escolhida entre elas. */
export const masteryEligibleWeapons = (char: Character): Item[] =>
  WEAPONS.filter((w) => isProficientWithWeapon(char, w))

/** Maestrias escolhidas, limitadas ao total permitido pelo nível. */
export const activeWeaponMasteries = (char: Character): Item[] =>
  (char.weaponMasteries ?? [])
    .map((id) => itemById(id))
    .filter((i): i is Item => !!i?.weapon)
    .slice(0, weaponMasteryCount(char))

// ---------- Proficiências (armadura, armas, ferramentas) ----------
export interface ProficiencyGroups {
  armaduras: string[]
  armas: string[]
  ferramentas: string[]
}

/**
 * Proficiências que não são perícias: armadura, armas e ferramentas/instrumentos.
 * Cada item ganha a origem entre parênteses quando não vem da própria classe —
 * é esta lista que a aba de Perícias exibe.
 */
export function proficiencyGroups(char: Character): ProficiencyGroups {
  const cls = classById(char.classId)
  const bg = backgroundById(char.backgroundId)
  const armaduras = [...(cls?.armor ?? [])]
  const armas = [...(cls?.weapons ?? [])]
  const ferramentas: string[] = []
  if (bg?.tool) ferramentas.push(`${bg.tool} (antecedente ${bg.name})`)

  // Só acrescenta o que a classe ainda não dá, sempre creditando a fonte.
  const juntar = (base: string[], extras: string[] | undefined, fonte: string) => {
    for (const e of extras ?? []) {
      if (!base.some((b) => b === e || b.startsWith(`${e} (`))) base.push(`${e} (${fonte})`)
    }
  }
  for (const { group, chosen } of characterChoices(char)) {
    if (!chosen) continue
    juntar(armaduras, chosen.armor, group.name)
    juntar(armas, chosen.weapons, group.name)
  }
  const subclasse = subclassOf(char)
  if (subclasse) {
    juntar(armaduras, subclasse.armor, subclasse.name)
    juntar(armas, subclasse.weapons, subclasse.name)
  }

  return {
    armaduras: [...new Set(armaduras)],
    armas: [...new Set(armas)],
    ferramentas,
  }
}

// ---------- Recursos limitados ----------
export interface ResourceState {
  id: string
  name: string
  max: number
  used: number
  recharge: 'curto' | 'longo'
  /** usos devolvidos por um descanso curto quando a recarga completa é no longo */
  shortRestUses?: number
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
      shortRestUses: r.shortRestUses,
    }))

  // Recursos de espécie
  const pb = proficiencyBonus(char.level)
  const usado = (id: string) => char.resourcesUsed[id] ?? 0
  const speciesRes: Record<string, ResourceState[]> = {
    aasimar: [
      { id: 'maos-curativas', name: 'Mãos Curativas', max: 1, used: usado('maos-curativas'), recharge: 'longo' },
      ...(char.level >= 3
        ? [{ id: 'revelacao-celestial', name: 'Revelação Celestial', max: 1, used: usado('revelacao-celestial'), recharge: 'longo' as const }]
        : []),
    ],
    draconato: [
      { id: 'sopro-draconico', name: 'Sopro Dracônico', max: pb, used: usado('sopro-draconico'), recharge: 'longo' },
      ...(char.level >= 5
        ? [{ id: 'voo-draconico', name: 'Voo Dracônico', max: 1, used: usado('voo-draconico'), recharge: 'longo' as const }]
        : []),
    ],
    anao: [
      { id: 'conhecimento-da-pedra', name: 'Conhecimento da Pedra', max: pb, used: usado('conhecimento-da-pedra'), recharge: 'longo' },
    ],
    golias: [
      { id: 'dadiva-de-gigante', name: 'Dádiva de Gigante', max: pb, used: usado('dadiva-de-gigante'), recharge: 'longo' },
      ...(char.level >= 5
        ? [{ id: 'forma-de-gigante', name: 'Forma de Gigante', max: 1, used: usado('forma-de-gigante'), recharge: 'longo' as const }]
        : []),
    ],
    orc: [
      { id: 'investida-adrenalizada', name: 'Investida Adrenalizada', max: pb, used: usado('investida-adrenalizada'), recharge: 'curto' },
      { id: 'resistencia-implacavel', name: 'Resistência Implacável', max: 1, used: usado('resistencia-implacavel'), recharge: 'longo' },
    ],
  }
  list.push(...(speciesRes[char.speciesId] ?? []))

  // Talento Sortudo
  if (hasFeat(char, 'sortudo-talento')) {
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

/** Talentos ativos do personagem, com a origem de cada um para exibir na ficha. */
export function characterFeats(char: Character) {
  const bg = backgroundById(char.backgroundId)
  const origens = new Map<string, string>()
  if (bg) origens.set(bg.featId, `Antecedente: ${bg.name}`)
  for (const id of char.originFeats ?? []) {
    origens.set(id, `Espécie: ${speciesById(char.speciesId)?.name ?? 'talento adicional'}`)
  }
  for (const c of char.asiChoices ?? []) {
    if (c.featId) origens.set(c.featId, `Escolhido no nível ${c.level}`)
  }
  for (const { chosen, group } of characterChoices(char)) {
    if (chosen && featById(chosen.id)) origens.set(chosen.id, group.name)
  }
  return [...origens.entries()]
    .map(([id, origem]) => {
      const feat = featById(id)
      return feat ? { ...feat, origem } : null
    })
    .filter((f): f is NonNullable<typeof f> => !!f)
}
