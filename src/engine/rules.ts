import type {
  AbilityKey, AbilityScores, AlwaysPreparedSpell, Character, ChoiceOption, ClassEntry, DndClass,
  FeatureOption, FeaturePick, InnateSpell, Item, InventoryEntry, OptionGroup, PreparationMode,
  Spell, SpellPick, Subclass,
} from '../types'
import { ABILITIES } from '../types'
import {
  CLASSES, classById, FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, PACT_SLOTS, THIRD_CASTER_SLOTS,
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

// ---------- Multiclasse ----------
/**
 * Uma classe do personagem já resolvida: a entrada da ficha, os dados da classe
 * e a subclasse escolhida nela. A classe inicial (`primary`) é a que define as
 * salvaguardas e o equipamento inicial.
 */
export interface ResolvedClass {
  entry: ClassEntry
  cls: DndClass
  subclass: Subclass | null
  primary: boolean
}

/**
 * Níveis por classe. Fichas de uma classe só não têm o campo `classes` — nesse
 * caso ele é derivado de `classId`/`level`. Se a soma não bater com o nível
 * total (o nível também pode ser ajustado à mão), a classe inicial absorve a
 * diferença, para nunca existir ficha com nível "perdido".
 */
export function classEntries(char: Character): ClassEntry[] {
  const total = Math.max(1, char.level)
  const bruto = (char.classes ?? []).filter((e) => e.level > 0 && !!classById(e.classId))
  if (!bruto.length) return [{ classId: char.classId, subclassId: char.subclassId, level: total }]

  const lista = bruto.map((e) => ({ ...e }))
  const dif = total - lista.reduce((a, e) => a + e.level, 0)
  if (dif !== 0) {
    const i = Math.max(0, lista.findIndex((e) => e.classId === char.classId))
    lista[i] = { ...lista[i], level: Math.max(1, lista[i].level + dif) }
  }
  return lista.filter((e) => e.level > 0)
}

export function characterClasses(char: Character): ResolvedClass[] {
  // Uma ficha em construção pode não ter classe ainda — ela simplesmente não entra.
  const entradas = classEntries(char).filter((e) => !!classById(e.classId))
  if (!entradas.length) return []
  const idPrincipal = entradas.some((e) => e.classId === char.classId) ? char.classId : entradas[0].classId
  let principalUsada = false
  return entradas.map((entry) => {
    const cls = classById(entry.classId)!
    const primary = !principalUsada && entry.classId === idPrincipal
    if (primary) principalUsada = true
    return {
      entry,
      cls,
      subclass: cls.subclasses.find((s) => s.id === entry.subclassId) ?? null,
      primary,
    }
  })
}

/** A classe inicial já resolvida — a que manda em salvaguardas e equipamento. */
export const primaryClass = (char: Character): ResolvedClass | undefined => {
  const classes = characterClasses(char)
  return classes.find((c) => c.primary) ?? classes[0]
}

/** Nível do personagem numa classe específica (0 se ele não tem essa classe). */
export const classLevel = (char: Character, classId: string): number =>
  classEntries(char).find((e) => e.classId === classId)?.level ?? 0

export const isMulticlass = (char: Character): boolean => classEntries(char).length > 1

/** "Guerreiro 5 / Bruxo 3" — o rótulo usado no cabeçalho da ficha. */
export const classLabel = (char: Character): string =>
  characterClasses(char).map((c) => `${c.cls.name} ${c.entry.level}`).join(' / ')

/**
 * Classe ganha em cada nível de personagem (índice 0 = nível 1). Fichas antigas
 * não guardam isso: reconstruímos assumindo que os níveis de cada classe foram
 * tomados em blocos, na ordem em que as classes entraram na ficha.
 */
export function levelClassIds(char: Character): string[] {
  const total = Math.max(1, char.level)
  const salvo = char.levelClasses ?? []
  if (salvo.length >= total && salvo.every((id) => !!classById(id))) return salvo.slice(0, total)

  const out: string[] = []
  for (const { entry } of characterClasses(char)) {
    for (let i = 0; i < entry.level; i++) out.push(entry.classId)
  }
  // Preserva o que já estava salvo nos níveis iniciais, se for coerente.
  for (let i = 0; i < Math.min(salvo.length, out.length); i++) {
    if (classById(salvo[i]) && classLevel(char, salvo[i]) > 0) out[i] = salvo[i]
  }
  return out.slice(0, total)
}

/** Requisitos de habilidade para entrar numa classe por multiclasse (PHB 2024). */
export function multiclassBlockers(char: Character, classId: string): AbilityKey[] {
  const req = classById(classId)?.multiclassReq
  if (!req) return []
  const abs = finalAbilities(char)
  const faltando: AbilityKey[] = []
  for (const k of req.all ?? []) if (abs[k] < 13) faltando.push(k)
  if (req.any?.length && !req.any.some((k) => abs[k] >= 13)) faltando.push(...req.any)
  return [...new Set(faltando)]
}

/**
 * Classes às quais o personagem pode adicionar um nível agora. Para entrar numa
 * classe nova o PHB 2024 exige 13 na habilidade da classe que você já tem E na
 * da classe nova — por isso os dois requisitos entram em `faltando`.
 */
export function multiclassOptions(char: Character) {
  const atuais = new Set(classEntries(char).map((e) => e.classId))
  const requisitoAtual = classEntries(char).flatMap((e) => multiclassBlockers(char, e.classId))
  return CLASSES.map((cls) => ({
    cls,
    jaTem: atuais.has(cls.id),
    faltando: atuais.has(cls.id)
      ? []
      : [...new Set([...requisitoAtual, ...multiclassBlockers(char, cls.id)])],
  }))
}

/** A subclasse da classe inicial — usada por tudo que não é multiclasse-aware. */
export const subclassOf = (char: Character): Subclass | null => primaryClass(char)?.subclass ?? null

// ---------- Escolhas de espécie, de classe e de subclasse ----------
/** Um grupo de escolha junto com a opção que o personagem selecionou (se houver). */
export interface ResolvedChoice {
  source: 'especie' | 'classe' | 'subclasse'
  group: OptionGroup
  chosen: ChoiceOption | null
  /** chave usada na ficha; classes secundárias ganham prefixo para não colidir */
  key: string
  /** classe dona do grupo (ausente nos grupos de espécie) */
  classId?: string
  /** nome da classe, exibido quando o personagem é multiclasse */
  className?: string
}

/**
 * Chave de armazenamento de um grupo de escolha de classe. A classe inicial usa
 * o id puro do grupo (é o que as fichas antigas já têm salvo); as demais ganham
 * o prefixo da classe, senão Guerreiro e Paladino disputariam 'estilo-de-luta'.
 */
export const classChoiceKey = (groupId: string, primary: boolean, classId: string) =>
  primary ? groupId : `${classId}:${groupId}`

/** Grupos de escolha já desbloqueados pelo nível atual, com a opção selecionada. */
export function characterChoices(char: Character, uptoLevel = char.level): ResolvedChoice[] {
  const out: ResolvedChoice[] = []
  const picksEspecie = char.speciesChoices ?? {}
  const picksClasse = char.classChoices ?? {}

  for (const group of speciesById(char.speciesId)?.choices ?? []) {
    if ((group.level ?? 1) > uptoLevel) continue
    out.push({
      source: 'especie', group, key: group.id,
      chosen: group.options.find((o) => o.id === picksEspecie[group.id]) ?? null,
    })
  }

  // O nível que libera uma escolha de classe é o nível NAQUELA classe.
  for (const { cls, subclass, entry, primary } of characterClasses(char)) {
    const push = (source: 'classe' | 'subclasse', groups: OptionGroup[] | undefined) => {
      for (const group of groups ?? []) {
        if ((group.level ?? 1) > entry.level) continue
        const key = classChoiceKey(group.id, primary, cls.id)
        out.push({
          source, group, key, classId: cls.id, className: cls.name,
          chosen: group.options.find((o) => o.id === picksClasse[key]) ?? null,
        })
      }
    }
    push('classe', cls.choices)
    // Escolhas da subclasse (terreno do Círculo da Terra) moram no mesmo balde da classe.
    push('subclasse', subclass?.choices)
  }
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

  let base: number
  let label: string

  if (armorEntry?.item.armor) {
    const a = armorEntry.item.armor
    const dexPart = a.dexMax === undefined ? mods.des : Math.min(mods.des, a.dexMax)
    base = a.baseAC + dexPart
    label = `${armorEntry.name} ${a.baseAC}${dexPart ? ` ${fmtMod(dexPart)} DES` : ''}`
  } else {
    // Defesas sem armadura por classe (Bárbaro: DES+CON; Monge: DES+SAB)
    if (classLevel(char, 'barbaro') > 0) {
      base = 10 + mods.des + mods.con
      label = `Defesa sem Armadura 10 ${fmtMod(mods.des)} DES ${fmtMod(mods.con)} CON`
    } else if (classLevel(char, 'monge') > 0 && !shieldEntry) {
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

/** Dado de Vida de cada nível de personagem (índice 0 = nível 1). */
export function hitDicePerLevel(char: Character): number[] {
  return levelClassIds(char).map((id) => classById(id)?.hitDie ?? 8)
}

/** Dados de Vida do personagem agrupados por tamanho: "3d10 + 2d8". */
export function hitDiceLabel(char: Character): string {
  const contagem = new Map<number, number>()
  for (const d of hitDicePerLevel(char)) contagem.set(d, (contagem.get(d) ?? 0) + 1)
  return [...contagem.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([die, qtd]) => `${qtd}d${die}`)
    .join(' + ')
}

/**
 * PV máximo: o 1º nível usa o dado cheio da classe inicial; cada nível seguinte
 * soma a média (ou o valor rolado, quando o jogador informou) do Dado de Vida da
 * classe em que aquele nível foi ganho — o que já vale para fichas multiclasse.
 */
export function maxHp(char: Character): number {
  const dados = hitDicePerLevel(char)
  if (!dados.length) return 1
  const conMod = abilityMods(char).con

  let total = dados[0] + conMod
  for (let lv = 2; lv <= dados.length; lv++) {
    const die = dados[lv - 1]
    const rolled = char.hpRolls?.[lv - 2]
    total += (rolled ?? die / 2 + 1) + conMod
  }

  // Robustez Anã: +1 PV por nível
  if (char.speciesId === 'anao') total += char.level
  // Talento Durão: +2 PV por nível
  if (hasFeat(char, 'durao')) total += char.level * 2
  // Resiliência Dracônica (Feiticeiro Dracônico): 3 + nível de Feiticeiro
  if (hasSubclass(char, 'draconica')) total += 3 + classLevel(char, 'feiticeiro')

  return Math.max(1, total)
}

/** O personagem tem esta subclasse em alguma das suas classes? */
export const hasSubclass = (char: Character, subclassId: string): boolean =>
  classEntries(char).some((e) => e.subclassId === subclassId)

export const currentHp = (char: Character) => Math.max(0, maxHp(char) - char.damageTaken)

/** Iniciativa = mod. DES (+ prof. com o talento Alerta). */
export function initiative(char: Character): number {
  const mods = abilityMods(char)
  return mods.des + (hasFeat(char, 'alerta') ? proficiencyBonus(char.level) : 0)
}

export function speed(char: Character): number {
  const sp = speciesById(char.speciesId)?.speed ?? 9
  let bonus = 0
  const inv = resolveInventory(char)
  const heavyArmor = inv.some((r) => r.entry.equipped && r.item.armor?.category === 'pesada')
  const nvBarbaro = classLevel(char, 'barbaro')
  const nvMonge = classLevel(char, 'monge')
  const nvPatrulheiro = classLevel(char, 'patrulheiro')
  if (nvBarbaro >= 5 && !heavyArmor) bonus += 3
  if (nvMonge > 0) {
    const noArmor = !inv.some((r) => r.entry.equipped && (r.item.kind === 'armadura' || r.item.kind === 'escudo'))
    if (noArmor) bonus += nvMonge >= 18 ? 9 : nvMonge >= 14 ? 7.5 : nvMonge >= 10 ? 6 : nvMonge >= 6 ? 4.5 : 3
  }
  if (nvPatrulheiro >= 6) bonus += 3
  return sp + bonus
}

/**
 * Salvaguardas: no PHB 2024 as proficiências em salvaguardas vêm SÓ da classe
 * inicial — entrar numa segunda classe não concede novas.
 */
export function saves(char: Character) {
  const cls = primaryClass(char)?.cls
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
/** Uma classe conjuradora da ficha, com tudo que ela contribui. */
export interface CasterClass {
  classId: string
  className: string
  /** nível NESSA classe */
  level: number
  ability: AbilityKey
  /** 'terco' quando a conjuração vem da subclasse (Cavaleiro Místico) */
  caster: 'completo' | 'meio' | 'pacto' | 'terco'
  /** id da lista de magias usada (o Cavaleiro Místico usa a de Mago) */
  list: string
  preparedByLevel?: number[]
  cantripsByLevel?: number[]
  preparation: PreparationMode | null
  mod: number
  attackBonus: number
  saveDC: number
}

const naTabela = (tabela: number[] | undefined, level: number) =>
  tabela ? tabela[Math.min(20, Math.max(1, level)) - 1] : undefined

/**
 * Todas as classes conjuradoras da ficha. Cada uma prepara magias da sua própria
 * lista, com o seu próprio limite e a sua própria habilidade de conjuração —
 * exatamente como o PHB 2024 descreve a multiclasse.
 */
export function casterClasses(char: Character): CasterClass[] {
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const out: CasterClass[] = []

  for (const { cls, subclass, entry } of characterClasses(char)) {
    const sub = subclass?.spellcasting
    const daSubclasse = sub && entry.level >= sub.fromLevel ? sub : null
    const ability = daSubclasse?.ability ?? (cls.caster !== 'nenhum' ? cls.spellAbility : undefined)
    if (!ability) continue
    const mod = mods[ability]
    out.push({
      classId: cls.id,
      className: cls.name,
      level: entry.level,
      ability,
      caster: daSubclasse ? 'terco' : (cls.caster as 'completo' | 'meio' | 'pacto'),
      list: daSubclasse?.list ?? cls.id,
      preparedByLevel: daSubclasse?.preparedByLevel ?? cls.preparedByLevel,
      cantripsByLevel: daSubclasse?.cantripsByLevel ?? cls.cantripsByLevel,
      // Cavaleiro Místico e Trapaceiro Arcano trocam uma magia ao subir de nível.
      preparation: daSubclasse ? 'nivel-uma' : (cls.preparation ?? null),
      mod,
      attackBonus: mod + pb,
      saveDC: 8 + mod + pb,
    })
  }
  // A conjuração "principal" é a da classe com mais níveis.
  return out.sort((a, b) => b.level - a.level)
}

/**
 * Conjuração concedida pela subclasse a uma classe que não conjura
 * (Cavaleiro Místico e Trapaceiro Arcano), quando já está desbloqueada.
 */
export function subclassSpellcasting(char: Character) {
  const { subclass, entry } = primaryClass(char) ?? {}
  const sc = subclass?.spellcasting
  return sc && (entry?.level ?? 0) >= sc.fromLevel ? sc : null
}

/** A conjuração em destaque na ficha: a da classe conjuradora de maior nível. */
export function spellcasting(char: Character) {
  const principal = casterClasses(char)[0]
  if (!principal) return null
  return {
    ability: principal.ability,
    mod: principal.mod,
    attackBonus: principal.attackBonus,
    saveDC: principal.saveDC,
    caster: principal.caster,
  }
}

/**
 * Espaços de magia por círculo (1..9). Com uma classe só, vale a tabela da
 * própria classe; com multiclasse vale o "nível de conjurador" do PHB 2024:
 * conjuradores completos contam o nível inteiro, os de meio contam a metade e
 * os de um terço contam um terço (sempre arredondando para baixo). O Bruxo fica
 * de fora — os espaços de Pacto dele são contados à parte.
 */
export function spellSlots(char: Character): number[] {
  const casters = casterClasses(char).filter((c) => c.caster !== 'pacto')
  if (!casters.length) return []

  if (!isMulticlass(char)) {
    const c = casters[0]
    const lv = Math.min(20, Math.max(1, c.level))
    if (c.caster === 'terco') return [...THIRD_CASTER_SLOTS[lv - 1], 0, 0, 0, 0, 0]
    if (c.caster === 'completo') return FULL_CASTER_SLOTS[lv - 1]
    if (c.caster === 'meio') return [...HALF_CASTER_SLOTS[lv - 1], 0, 0, 0, 0]
    return []
  }

  const nivelDeConjurador = casters.reduce((total, c) => total + (
    c.caster === 'completo' ? c.level
      : c.caster === 'meio' ? Math.floor(c.level / 2)
        : Math.floor(c.level / 3)
  ), 0)
  if (nivelDeConjurador < 1) return []
  return FULL_CASTER_SLOTS[Math.min(20, nivelDeConjurador) - 1]
}

export function pactSlots(char: Character): { count: number; level: number } | null {
  const nivel = classLevel(char, 'bruxo')
  if (nivel < 1) return null
  const [count, level] = PACT_SLOTS[Math.min(20, nivel) - 1]
  return { count, level }
}

/**
 * Limite total de magias preparadas. Na multiclasse cada classe tem o seu
 * limite, calculado pelo nível naquela classe; o número exibido é a soma.
 */
export function preparedLimit(char: Character): number | null {
  const casters = casterClasses(char).filter((c) => c.preparedByLevel)
  if (!casters.length) return null
  return casters.reduce((total, c) => total + (naTabela(c.preparedByLevel, c.level) ?? 0), 0)
}

/** Opções de classe que concedem um truque extra da própria lista da classe. */
const TRUQUE_EXTRA_DE_CLASSE = ['taumaturgo', 'mago-primal']

export function cantripLimit(char: Character): number {
  const base = casterClasses(char)
    .reduce((total, c) => total + (naTabela(c.cantripsByLevel, c.level) ?? 0), 0)
  // Ordem Divina (Taumaturgo) e Ordem Primal (Xamã) dão mais um truque.
  const extra = characterChoices(char).some(
    (c) => c.source === 'classe' && c.chosen && TRUQUE_EXTRA_DE_CLASSE.includes(c.chosen.id),
  ) ? 1 : 0
  return base > 0 ? base + extra : base
}

// ---------- Preparação de magias ----------
/** Como esta ficha muda a lista de magias preparadas (PHB 2024). */
export function preparationMode(char: Character): PreparationMode | null {
  // Na multiclasse vale a regra da classe conjuradora de maior nível.
  return casterClasses(char)[0]?.preparation ?? null
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
  const listas = casterClasses(char).map((c) => c.list)
  // Bardo nível 10 (Segredos Mágicos): as novas magias podem vir de outras listas.
  if (classLevel(char, 'bardo') >= 10) listas.push('clerigo', 'druida', 'mago')
  return [...new Set(listas)]
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
  const add = (lista: AlwaysPreparedSpell[] | undefined, source: string, nivel: number) => {
    for (const it of lista ?? []) {
      if (nivel < it.level || vistos.has(it.spellId)) continue
      const spell = spellById(it.spellId)
      if (!spell) continue
      vistos.add(spell.id)
      out.push({ spell, source })
    }
  }

  // Magias de domínio, patrono e juramento seguem o nível NAQUELA classe.
  for (const { subclass, entry } of characterClasses(char)) {
    if (subclass) add(subclass.alwaysPrepared, subclass.name, entry.level)
  }
  for (const { group, chosen, classId } of characterChoices(char)) {
    const nivel = classId ? classLevel(char, classId) : char.level
    if (chosen?.alwaysPrepared) add(chosen.alwaysPrepared, `${group.name}: ${chosen.name}`, nivel)
  }
  // Grupos de escolha marcados como "sempre preparada" (Segredos Mágicos do Colégio do Conhecimento)
  for (const { pick, chosen } of spellPickGroups(char)) {
    if (!pick.alwaysPrepared) continue
    add(chosen.map((spellId) => ({ spellId, level: pick.level })), pick.source, pick.level)
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
  if (freeUses === 'longo') return '1×/descanso longo'
  return ''
}

/**
 * Quantas conjurações gratuitas por descanso longo a magia concede. Truques à
 * vontade e magias sem uso grátis devolvem 0 — não há nada para marcar.
 */
export function innateFreeUses(char: Character, freeUses?: InnateSpell['freeUses']): number {
  if (freeUses === 'longo') return 1
  if (freeUses === 'prof-longo') return proficiencyBonus(char.level)
  return 0
}

/**
 * Chave em `resourcesUsed` onde ficam os usos gratuitos já gastos de uma magia
 * inata. Como `characterResources` não devolve essas magias, o descanso longo
 * zera a contagem naturalmente e o curto a preserva — que é a regra do PHB 2024.
 */
export const innateSpellResourceId = (spellId: string) => `magia-inata:${spellId}`

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
  /** Cada grupo é comparado com o nível certo: o da classe, quando vem dela. */
  const candidatos: { pick: SpellPick; nivel: number }[] = []
  const juntar = (lista: SpellPick[] | undefined, nivel: number) => {
    for (const p of lista ?? []) candidatos.push({ pick: p, nivel })
  }

  juntar(speciesById(char.speciesId)?.spellPicks, uptoLevel)
  for (const { cls, subclass, entry } of characterClasses(char)) {
    juntar(cls.spellPicks, entry.level)
    juntar(subclass?.spellPicks, entry.level)
  }
  for (const { chosen, classId } of characterChoices(char, uptoLevel)) {
    juntar(chosen?.spellPicks, classId ? classLevel(char, classId) : uptoLevel)
  }
  for (const id of [...allFeatIds(char), ...(opts.extraFeatIds ?? [])]) {
    juntar(featById(id)?.spellPicks, uptoLevel)
  }

  // Segredos Mágicos e afins oferecem qualquer círculo até o maior acessível.
  const teto = maxSpellLevel({ ...char, level: uptoLevel })
  const vistos = new Set<string>()
  return candidatos
    .filter(({ pick: p, nivel }) => p.level <= nivel && !vistos.has(p.id) && vistos.add(p.id) !== undefined)
    .map(({ pick }) => {
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
  let maior = 0
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i] > 0) { maior = i + 1; break }
  }
  // Um Bruxo multiclasse soma os espaços de Pacto aos espaços normais.
  return Math.max(maior, pactSlots(char)?.level ?? 0)
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
  const ehMonge = classLevel(char, 'monge') > 0

  return resolveInventory(char)
    .filter((r) => r.entry.equipped && r.item.kind === 'arma' && r.item.weapon)
    .map(({ entry, item, bonus, name }) => {
      const wp = item.weapon!
      // Acuidade e armas à distância podem usar DES; escolhemos o melhor modificador
      let ability: AbilityKey = 'for'
      if (wp.ranged) ability = 'des'
      else if (wp.finesse) ability = mods.des > mods.for ? 'des' : 'for'
      // Monge: Artes Marciais permite DES em armas de monge
      if (ehMonge && !wp.heavy && !wp.twoHanded && mods.des > mods.for) ability = 'des'

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
  const out: string[] = []
  // A classe inicial dá o treinamento completo; as demais, só o da tabela de multiclasse.
  for (const { cls, subclass, primary } of characterClasses(char)) {
    out.push(...(primary ? cls.armor : cls.multiclassArmor ?? cls.armor))
    out.push(...(subclass?.armor ?? []))
  }
  for (const { chosen } of characterChoices(char)) out.push(...(chosen?.armor ?? []))
  return [...new Set(out)]
}

/** Todas as proficiências com armas, das mesmas fontes de `armorTraining`. */
export function weaponTraining(char: Character): string[] {
  const out: string[] = []
  for (const { cls, subclass, primary } of characterClasses(char)) {
    out.push(...(primary ? cls.weapons : cls.multiclassWeapons ?? cls.weapons))
    out.push(...(subclass?.weapons ?? []))
  }
  for (const { chosen } of characterChoices(char)) out.push(...(chosen?.weapons ?? []))
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
  // As classes compartilham a mesma lista de maestrias: vale a mais generosa.
  return characterClasses(char)
    .reduce((maior, { cls, entry }) => Math.max(maior, cls.masteryCount?.(entry.level) ?? 0), 0)
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
  const principal = primaryClass(char)
  const bg = backgroundById(char.backgroundId)
  const armaduras = [...(principal?.cls.armor ?? [])]
  const armas = [...(principal?.cls.weapons ?? [])]
  const ferramentas: string[] = []
  if (bg?.tool) ferramentas.push(`${bg.tool} (antecedente ${bg.name})`)

  // Só acrescenta o que a classe ainda não dá, sempre creditando a fonte.
  const juntar = (base: string[], extras: string[] | undefined, fonte: string) => {
    for (const e of extras ?? []) {
      if (!base.some((b) => b === e || b.startsWith(`${e} (`))) base.push(`${e} (${fonte})`)
    }
  }
  for (const { cls, subclass, primary } of characterClasses(char)) {
    if (!primary) {
      juntar(armaduras, cls.multiclassArmor ?? cls.armor, `multiclasse ${cls.name}`)
      juntar(armas, cls.multiclassWeapons ?? cls.weapons, `multiclasse ${cls.name}`)
    }
    if (subclass) {
      juntar(armaduras, subclass.armor, subclass.name)
      juntar(armas, subclass.weapons, subclass.name)
    }
  }
  for (const { group, chosen } of characterChoices(char)) {
    if (!chosen) continue
    juntar(armaduras, chosen.armor, group.name)
    juntar(armas, chosen.weapons, group.name)
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
  const abs = finalAbilities(char)
  const list: ResourceState[] = []
  const vistos = new Set<string>()

  // Recursos de classe e de subclasse — cada um medido pelo nível NAQUELA classe.
  for (const { cls, subclass, entry } of characterClasses(char)) {
    for (const r of [...cls.resources, ...(subclass?.resources ?? [])]) {
      if (entry.level < r.fromLevel || vistos.has(r.id)) continue
      vistos.add(r.id)
      list.push({
        id: r.id,
        name: r.name,
        max: Math.max(0, r.max(entry.level, abs, char.level)),
        used: char.resourcesUsed[r.id] ?? 0,
        recharge: r.recharge,
        shortRestUses: r.shortRestUses,
      })
    }
  }

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

/**
 * Todas as características desbloqueadas, de todas as classes do personagem.
 * Numa ficha multiclasse o nome de cada característica leva a classe junto,
 * porque o "nível 3" de uma classe não é o nível 3 da outra.
 */
export function unlockedFeatures(char: Character, uptoLevel = char.level) {
  const classes = characterClasses(char)
  const multi = classes.length > 1
  const out: { level: number; name: string; desc: string }[] = []

  for (const { cls, subclass, entry } of classes) {
    const teto = Math.min(entry.level, uptoLevel)
    const sufixo = multi ? ` · ${cls.name}` : ''
    const subFeatures = subclass
      ? subclass.features.filter((f) => f.level <= teto).map((f) => ({ ...f, name: `${f.name} (${subclass.name})` }))
      : []
    const níveisComSubclasse = new Set(subFeatures.map((f) => f.level))
    const own = cls.features.filter(
      (f) => f.level <= teto && !(isGenericSubclassSlot(f.name) && níveisComSubclasse.has(f.level)),
    )
    for (const f of [...own, ...subFeatures]) out.push({ ...f, name: `${f.name}${sufixo}` })
  }
  return out.sort((a, b) => a.level - b.level)
}

/** A subclasse escolhida numa classe específica da ficha. */
export const subclassIdOf = (char: Character, classId: string): string | undefined =>
  classEntries(char).find((e) => e.classId === classId)?.subclassId

/**
 * Ficha resultante de ganhar um nível na classe indicada — a base de tudo que o
 * assistente de evolução mostra. Serve tanto para subir na mesma classe quanto
 * para entrar numa classe nova (multiclasse).
 */
export function withLevelIn(char: Character, classId: string, subclassId?: string): Character {
  const entradas = classEntries(char).map((e) => ({ ...e }))
  const i = entradas.findIndex((e) => e.classId === classId)
  if (i >= 0) entradas[i].level += 1
  else entradas.push({ classId, level: 1, subclassId })
  const alvo = entradas.findIndex((e) => e.classId === classId)
  if (subclassId !== undefined) entradas[alvo].subclassId = subclassId

  return {
    ...char,
    level: char.level + 1,
    classes: entradas,
    levelClasses: [...levelClassIds(char), classId],
    // `subclassId` da ficha continua sendo o da classe inicial.
    subclassId: classId === char.classId && subclassId !== undefined ? subclassId : char.subclassId,
  }
}

/**
 * O que muda ao subir para `newLevel`. `targetClassId` é a classe que ganha o
 * nível — igual à classe inicial numa ficha normal, ou outra numa multiclasse.
 */
export function levelUpSummary(
  char: Character,
  newLevel: number,
  targetClassId: string = char.classId,
  targetSubclassId?: string,
) {
  const cls = classById(targetClassId)
  if (!cls) return null
  const after = withLevelIn(char, targetClassId, targetSubclassId)
  const novoNivelDeClasse = classLevel(after, targetClassId)
  const subclassAtual = targetSubclassId ?? subclassIdOf(after, targetClassId)
  const subclass = cls.subclasses.find((s) => s.id === subclassAtual)

  const newSubFeatures = subclass ? subclass.features.filter((f) => f.level === novoNivelDeClasse) : []
  const newFeatures = cls.features.filter(
    (f) => f.level === novoNivelDeClasse && !(isGenericSubclassSlot(f.name) && newSubFeatures.length > 0),
  )

  const slotsBefore = spellSlots(char)
  const slotsAfter = spellSlots(after)
  const newSlots = slotsAfter
    .map((n, i) => ({ level: i + 1, gained: n - (slotsBefore[i] ?? 0), total: n }))
    .filter((s) => s.gained > 0)

  const prepBefore = preparedLimit(char) ?? 0
  const prepAfter = preparedLimit(after) ?? 0
  const cantripBefore = cantripLimit(char)
  const cantripAfter = cantripLimit(after)

  const needsSubclass = !subclassIdOf(char, targetClassId)
    && cls.features.some((f) => f.level === novoNivelDeClasse && f.name.startsWith('Escolha de'))
  const needsAsi = cls.features.some(
    (f) => f.level === novoNivelDeClasse && f.name === 'Incremento no Valor de Habilidade',
  )

  const pactBefore = pactSlots(char)
  const pactAfter = pactSlots(after)

  return {
    level: newLevel,
    /** nível alcançado NA classe escolhida */
    classLevel: novoNivelDeClasse,
    classId: cls.id,
    className: cls.name,
    /** é o primeiro nível numa classe nova */
    novaClasse: classLevel(char, targetClassId) === 0,
    hitDie: cls.hitDie,
    features: [...newFeatures, ...newSubFeatures],
    newSlots,
    pactChanged: pactBefore?.count !== pactAfter?.count || pactBefore?.level !== pactAfter?.level ? pactAfter : null,
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

// ---------- Características com várias opções ----------
/** Um grupo de opções de característica já resolvido para a ficha. */
export interface ResolvedFeaturePick {
  pick: FeaturePick
  /** classe dona do grupo */
  classId: string
  className: string
  /** nome da subclasse, quando o grupo vem dela */
  subclassName?: string
  /** quantas opções escolher (0 = todas as liberadas são concedidas) */
  count: number
  /** opções liberadas pelo nível de classe atual */
  options: FeatureOption[]
  /** opções em vigor: as escolhidas, ou todas quando o grupo não é de escolha */
  active: FeatureOption[]
  /** ids marcados na ficha */
  chosen: string[]
  pending: boolean
  /** dado associado no nível atual ("d8"), quando houver */
  die?: string
  /** recurso que as opções consomem */
  resourceId?: string
}

/**
 * Todos os grupos de opções de características do personagem: Manobras,
 * Invocações Místicas, Metamagia, Canalizar Divindade e afins. Um grupo sem
 * `countByLevel` não é escolha — todas as opções liberadas já valem.
 */
export function featurePickGroups(char: Character): ResolvedFeaturePick[] {
  const out: ResolvedFeaturePick[] = []

  for (const { cls, subclass, entry } of characterClasses(char)) {
    const fontes: { pick: FeaturePick; subclassName?: string }[] = [
      ...(cls.featurePicks ?? []).map((pick) => ({ pick })),
      ...(subclass?.featurePicks ?? []).map((pick) => ({ pick, subclassName: subclass!.name })),
    ]

    for (const { pick, subclassName } of fontes) {
      const count = pick.countByLevel ? (naTabela(pick.countByLevel, entry.level) ?? 0) : 0
      const options = pick.options.filter((o) => (o.level ?? 1) <= entry.level)
      // Um grupo de escolha só aparece quando o nível já libera pelo menos uma;
      // um grupo concedido aparece assim que tem opção disponível.
      if (pick.countByLevel ? count <= 0 : options.length === 0) continue

      const chosen = (char.featureChoices?.[pick.id] ?? [])
        .filter((id) => options.some((o) => o.id === id))
        .slice(0, count || undefined)
      const active = pick.countByLevel ? options.filter((o) => chosen.includes(o.id)) : options

      out.push({
        pick,
        classId: cls.id,
        className: cls.name,
        subclassName,
        count,
        options,
        active,
        chosen,
        pending: !!pick.countByLevel && chosen.length < count,
        die: pick.dieByLevel ? (pick.dieByLevel[Math.min(20, Math.max(1, entry.level)) - 1] || undefined) : undefined,
        resourceId: pick.resourceId,
      })
    }
  }
  return out
}

/** Só os grupos de escolha ainda incompletos — o aviso da ficha e o gate dos assistentes. */
export const pendingFeaturePicks = (char: Character): ResolvedFeaturePick[] =>
  featurePickGroups(char).filter((g) => g.pending)

/** Uma opção só pode ser marcada se o pré-requisito dela já estiver escolhido. */
export const featureOptionBlocked = (option: FeatureOption, chosen: string[]): boolean =>
  !!option.requires && !chosen.includes(option.requires)

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
