// ---------- Tipos base do sistema D&D 2024 (PT-BR) ----------

export type AbilityKey = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car'

export const ABILITIES: AbilityKey[] = ['for', 'des', 'con', 'int', 'sab', 'car']

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
}

export type AbilityScores = Record<AbilityKey, number>

export interface Skill {
  id: string
  name: string
  ability: AbilityKey
}

// ---------- Escolhas (traços de espécie, características de classe) ----------
export interface ChoiceOption {
  id: string
  name: string
  desc: string
  /** perícia concedida por esta opção (id de Skill) */
  grantsSkill?: string
}

/** Um grupo de escolha ("Ancestral Dracônico", "Estilo de Luta", ...) com suas opções. */
export interface OptionGroup {
  id: string
  name: string
  /** texto explicativo do grupo */
  desc?: string
  /** nível em que a escolha é feita (padrão: 1) */
  level?: number
  options: ChoiceOption[]
}

// ---------- Equipamento inicial ----------
export interface EquipmentGrant {
  itemId: string
  qty?: number
}

/** Uma das opções (A/B/C) de equipamento inicial de classe ou antecedente. */
export interface EquipmentOption {
  id: string
  label: string
  items: EquipmentGrant[]
  gold: number
}

// ---------- Espécies ----------
export interface Species {
  id: string
  name: string
  size: string
  speed: number
  darkvision?: number
  traits: { name: string; desc: string }[]
  /** escolhas obrigatórias do traço (ex.: cor do dragão, dádiva de gigante) */
  choices?: OptionGroup[]
  /** quantas perícias extras a espécie concede à escolha (Humano: 1) */
  extraSkills?: number
  /** a espécie concede um talento de Origem adicional (Humano) */
  extraOriginFeat?: boolean
}

// ---------- Antecedentes ----------
export interface Background {
  id: string
  name: string
  abilities: AbilityKey[] // as 3 habilidades às quais o antecedente permite atribuir +2/+1 ou +1/+1/+1
  featId: string // talento de origem
  skills: string[] // proficiências em perícias
  tool: string
  equipment: string
  /** opções A/B de equipamento inicial (PHB 2024) */
  equipmentOptions: EquipmentOption[]
  desc: string
}

// ---------- Talentos ----------
export type FeatCategory = 'origem' | 'geral' | 'estilo'
export interface Feat {
  id: string
  name: string
  category: FeatCategory
  desc: string
  abilityIncrease?: AbilityKey[] // talentos gerais que dão +1 em uma das habilidades listadas
  repeatable?: boolean
}

// ---------- Classes ----------
export type CasterType = 'nenhum' | 'completo' | 'meio' | 'pacto'

export interface ClassResource {
  id: string
  name: string
  /** máximo de usos em função do nível e modificadores */
  max: (level: number, mods: AbilityScores) => number
  recharge: 'curto' | 'longo'
  /**
   * Recursos com recarga em descanso longo que ainda assim devolvem alguns usos
   * em descanso curto (ex.: Retomar o Fôlego recupera 1 uso no curto e todos no longo).
   */
  shortRestUses?: number
  /** nível em que o recurso é adquirido */
  fromLevel: number
}

export interface ClassFeature {
  level: number
  name: string
  desc: string
}

export interface Subclass {
  id: string
  name: string
  desc: string
  features: ClassFeature[]
}

export interface DndClass {
  id: string
  name: string
  hitDie: 6 | 8 | 10 | 12
  primary: string
  saves: AbilityKey[]
  armor: string[]
  weapons: string[]
  skillChoices: string[]
  skillCount: number
  caster: CasterType
  spellAbility?: AbilityKey
  /** magias preparadas conforme tabela da classe (PHB 2024) por nível */
  preparedByLevel?: number[]
  /** truques conhecidos por nível */
  cantripsByLevel?: number[]
  features: ClassFeature[]
  subclasses: Subclass[]
  resources: ClassResource[]
  startingEquipment: string
  /** opções A/B/C de equipamento inicial (PHB 2024) */
  equipmentOptions: EquipmentOption[]
  /** escolhas de características (Estilo de Luta, Ordem Divina, ...) */
  choices?: OptionGroup[]
  /**
   * Quantas armas o personagem escolhe para a característica Maestria em Armas
   * (Guerreiro: 3 no 1º nível; Bárbaro, Paladino, Patrulheiro e Ladino: 2).
   */
  masteryCount?: (level: number) => number
}

// ---------- Magias ----------
export interface Spell {
  id: string
  name: string
  level: number // 0 = truque
  school: string
  classes: string[] // ids de classes
  castingTime: string
  range: string
  components: string
  duration: string
  concentration?: boolean
  ritual?: boolean
  desc: string
}

// ---------- Itens ----------
export type ItemKind = 'arma' | 'armadura' | 'escudo' | 'equipamento' | 'magico'
export type ArmorCategory = 'leve' | 'média' | 'pesada'
export type WeaponCategory = 'simples' | 'marcial'

export interface WeaponData {
  category: WeaponCategory
  damage: string // ex: "1d8"
  damageType: string // Cortante, Perfurante, Concussão
  properties: string[]
  mastery: string // Maestria de arma (PHB 2024)
  ranged?: boolean
  range?: string
  versatile?: string // dano com duas mãos
  finesse?: boolean
  thrown?: boolean
  twoHanded?: boolean
  light?: boolean
  heavy?: boolean
}

export interface ArmorData {
  category: ArmorCategory
  baseAC: number
  dexMax?: number // limite do bônus de DES (undefined = sem limite p/ leve; 2 p/ média; 0 p/ pesada)
  strengthReq?: number
  stealthDisadv?: boolean
}

export interface MagicEffects {
  /** bônus em jogadas de ataque e dano (armas mágicas) */
  attackBonus?: number
  /** bônus na CA (armaduras/escudos/anéis/braçadeiras mágicos) */
  acBonus?: number
  /** bônus em todas as salvaguardas */
  saveBonus?: number
  /** fixa o valor de uma habilidade (ex.: Amuleto da Saúde CON 19) */
  setAbility?: Partial<Record<AbilityKey, number>>
  /** braçadeiras de defesa: só funciona sem armadura/escudo */
  requiresNoArmor?: boolean
  attunement?: boolean
  desc?: string
}

export interface Item {
  id: string
  name: string
  kind: ItemKind
  weight?: number
  cost?: string
  weapon?: WeaponData
  armor?: ArmorData
  magic?: MagicEffects
  /** para itens mágicos baseados em outro (ex.: "Espada Longa +1" -> baseId espada-longa) */
  baseId?: string
  desc?: string
}

// ---------- Ficha de Personagem ----------
export type AbilityMethod = 'pointbuy' | 'array' | 'manual'

export interface InventoryEntry {
  uid: string // id único da entrada
  itemId: string
  qty: number
  equipped?: boolean
  attuned?: boolean
  /** bônus mágico aplicado a uma arma/armadura comum (+1/+2/+3) */
  bonus?: number
  customName?: string
}

export interface AsiChoice {
  level: number
  type: 'asi' | 'feat'
  abilities?: Partial<Record<AbilityKey, number>> // +2 em uma ou +1 em duas
  featId?: string
}

export interface Character {
  id: string
  name: string
  speciesId: string
  backgroundId: string
  /** distribuição dos bônus do antecedente, ex.: { for: 2, con: 1 } */
  backgroundBonuses: Partial<Record<AbilityKey, number>>
  classId: string
  subclassId?: string
  level: number
  abilityMethod: AbilityMethod
  baseAbilities: AbilityScores
  skillProfs: string[]
  asiChoices: AsiChoice[]
  /** opção escolhida em cada grupo de escolha da espécie: { 'ancestral-draconico': 'vermelho' } */
  speciesChoices: Record<string, string>
  /** opção escolhida em cada grupo de escolha da classe: { 'estilo-de-luta': 'defesa' } */
  classChoices: Record<string, string>
  /** talentos de Origem adicionais (ex.: traço Versátil do Humano) */
  originFeats: string[]
  /** armas escolhidas para a característica Maestria em Armas (ids de Item) */
  weaponMasteries: string[]
  /**
   * Regra opcional de mesa: distribuir os bônus do antecedente em qualquer
   * habilidade, e não apenas nas três sugeridas pelo antecedente.
   */
  freeBackgroundBonuses?: boolean
  /** PV: dano sofrido (max é derivado) e PV temporário */
  damageTaken: number
  tempHp: number
  /** rolagens de PV por nível (índice 0 = nível 2). null = média */
  hpRolls: (number | null)[]
  hitDiceSpent: number
  inventory: InventoryEntry[]
  gold: number
  spellsKnown: string[]
  spellsPrepared: string[]
  slotsSpent: Record<number, number>
  pactSlotsSpent: number
  /** usos gastos de recursos limitados, por id do recurso */
  resourcesUsed: Record<string, number>
  notes: string
  createdAt: number
  updatedAt: number
}

export interface RollEntry {
  id: string
  label: string
  formula: string
  rolls: number[]
  /** rolagens descartadas (vantagem/desvantagem) */
  discarded?: number[]
  modifier: number
  total: number
  crit?: 'critico' | 'falha' | null
  time: number
}
