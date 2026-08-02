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

// ---------- Magias concedidas por espécie/linhagem ----------
/**
 * Magia que a espécie (ou a opção de linhagem escolhida) concede de graça,
 * independentemente da classe. Aparece na aba de Magias mesmo para quem não conjura.
 */
export interface InnateSpell {
  /** id em SPELLS */
  spellId: string
  /** nível de personagem a partir do qual a magia fica disponível */
  level: number
  /**
   * Habilidades candidatas para a conjuração. Quando há mais de uma, o PHB 2024
   * deixa o jogador escolher — usamos a de maior valor na ficha.
   */
  abilities: AbilityKey[]
  /** como pode ser conjurada sem gastar espaço de magia */
  freeUses?: 'vontade' | 'longo' | 'prof-longo'
  /** observação exibida junto da magia */
  nota?: string
}

// ---------- Magias que uma fonte fora da classe deixa ESCOLHER ----------
/**
 * Alguns traços e talentos não dão uma magia fixa: dão o direito de escolher
 * ("um truque de Mago", "dois truques de Clérigo", "uma magia de 1º círculo de
 * Ilusão ou Necromancia"). Todas essas escolhas acontecem no passo de Magias,
 * junto com as magias da classe.
 */
export interface SpellPick {
  /** identificador do grupo dentro da ficha */
  id: string
  /** de onde vem a escolha, exibido no cartão ("Alto Elfo", "Iniciado em Magia") */
  source: string
  /** nível de personagem a partir do qual a escolha aparece */
  level: number
  /** quantas magias escolher */
  count: number
  /** listas de classe das quais as magias podem sair */
  fromClasses: string[]
  /** círculo exato das magias oferecidas (0 = truques) */
  spellLevel: number
  /**
   * Em vez de um círculo exato, oferece qualquer magia de `spellLevel` até o
   * maior círculo para o qual o personagem tem espaços (Segredos Mágicos).
   */
  upToMaxSlot?: boolean
  /**
   * As magias escolhidas ficam sempre preparadas e são conjuradas gastando
   * espaços de magia normais — e não como magias inatas com usos grátis.
   */
  alwaysPrepared?: boolean
  /** escolas permitidas, quando a fonte restringe */
  schools?: string[]
  /** habilidades candidatas para a conjuração */
  abilities: AbilityKey[]
  /** como pode ser conjurada sem gastar espaço de magia */
  freeUses?: InnateSpell['freeUses']
  /** observação exibida junto da escolha */
  nota?: string
}

// ---------- Magias sempre preparadas ----------
/**
 * Magia que uma característica (subclasse, opção de subclasse) mantém SEMPRE
 * preparada. Diferente de `InnateSpell`, ela é conjurada normalmente, gastando
 * um espaço de magia — o que a regra concede é a preparação, que não ocupa
 * vaga na lista de magias preparadas da classe (PHB 2024, "Magias Sempre
 * Preparadas").
 */
export interface AlwaysPreparedSpell {
  /** nível de personagem a partir do qual a magia fica preparada */
  level: number
  /** id em SPELLS */
  spellId: string
}

// ---------- Escolhas (traços de espécie, características de classe) ----------
export interface ChoiceOption {
  id: string
  name: string
  desc: string
  /** perícia concedida por esta opção (id de Skill) */
  grantsSkill?: string
  /** magias concedidas por esta opção (linhagens élficas, legado infernal...) */
  innateSpells?: InnateSpell[]
  /** magias que esta opção deixa o jogador escolher */
  spellPicks?: SpellPick[]
  /** magias que esta opção deixa sempre preparadas (terreno do Círculo da Terra) */
  alwaysPrepared?: AlwaysPreparedSpell[]
  /** treinamento com armadura concedido pela opção (Ordem Divina: Protetor) */
  armor?: string[]
  /** proficiência com armas concedida pela opção */
  weapons?: string[]
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
  /** magias concedidas pelos traços da própria espécie (Aasimar: Luz; Tiefling: Taumaturgia) */
  innateSpells?: InnateSpell[]
  /** magias que os traços da espécie deixam escolher */
  spellPicks?: SpellPick[]
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
  /** magias fixas concedidas pelo talento (Tocado pelo Feérico: Passo Nebuloso) */
  innateSpells?: InnateSpell[]
  /** magias que o talento deixa o jogador escolher */
  spellPicks?: SpellPick[]
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

/**
 * Conjuração concedida por uma subclasse de classe não conjuradora
 * (Cavaleiro Místico e Trapaceiro Arcano: 1/3 de conjurador, lista de Mago).
 */
export interface SubclassSpellcasting {
  /** id da classe cuja lista de magias é usada */
  list: string
  ability: AbilityKey
  /** nível de personagem em que a conjuração começa */
  fromLevel: number
  /** magias preparadas por nível de personagem (índice 0 = nível 1) */
  preparedByLevel: number[]
  /** truques conhecidos por nível de personagem */
  cantripsByLevel: number[]
}

export interface Subclass {
  id: string
  name: string
  desc: string
  features: ClassFeature[]
  /** magias sempre preparadas concedidas pela subclasse (Domínio Divino, Patrono...) */
  alwaysPrepared?: AlwaysPreparedSpell[]
  /** escolhas próprias da subclasse (terreno do Círculo da Terra) */
  choices?: OptionGroup[]
  /** magias que a subclasse deixa o jogador escolher (Segredos Mágicos) */
  spellPicks?: SpellPick[]
  /** treinamento com armadura concedido pela subclasse (Colégio da Bravura) */
  armor?: string[]
  /** proficiência com armas concedida pela subclasse */
  weapons?: string[]
  /** conjuração de 1/3 concedida pela subclasse */
  spellcasting?: SubclassSpellcasting
}

/**
 * Quando e quanto o personagem pode mudar a lista de magias preparadas
 * (PHB 2024, tabela "Magias Preparadas por Classe").
 */
export type PreparationMode =
  /** Clérigo e Druida: em cada Descanso Longo, qualquer quantidade, de toda a lista da classe */
  | 'descanso-todas'
  /** Mago: em cada Descanso Longo, qualquer quantidade, entre as magias do grimório */
  | 'grimorio'
  /** Paladino e Patrulheiro: em cada Descanso Longo, uma magia */
  | 'descanso-uma'
  /** Bardo, Bruxo e Feiticeiro: ao subir de nível, uma magia */
  | 'nivel-uma'

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
  /** quando a classe pode trocar as magias preparadas */
  preparation?: PreparationMode
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
  /** magias que a própria classe deixa escolher (Arcanum Místico do Bruxo) */
  spellPicks?: SpellPick[]
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
  /** Descrição integral do Livro do Jogador, um item por parágrafo. */
  desc: string[]
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

// ---------- Itens mágicos (Livro do Mestre 2024) ----------
export type ItemRarity = 'comum' | 'incomum' | 'raro' | 'muito-raro' | 'lendario' | 'artefato' | 'varia'

export const RARITY_ORDER: ItemRarity[] = ['comum', 'incomum', 'raro', 'muito-raro', 'lendario', 'artefato', 'varia']

export const RARITY_NAMES: Record<ItemRarity, string> = {
  'comum': 'Comum',
  'incomum': 'Incomum',
  'raro': 'Raro',
  'muito-raro': 'Muito Raro',
  'lendario': 'Lendário',
  'artefato': 'Artefato',
  'varia': 'Raridade Variável',
}

/** Categoria do item mágico, como aparece na linha de tipo do Livro do Mestre. */
export type MagicCategory =
  | 'Item Maravilhoso' | 'Anel' | 'Varinha' | 'Cajado' | 'Bastão' | 'Poção' | 'Pergaminho'
  | 'Arma' | 'Armadura' | 'Munição'

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
  /** restrição de sintonização ("por um conjurador", "por um Bruxo") */
  attunementBy?: string
  /** raridade do Livro do Mestre */
  rarity?: ItemRarity
  /** categoria do Livro do Mestre ("Item Maravilhoso", "Anel", ...) */
  category?: MagicCategory
  /** detalhamento da categoria: "Qualquer Armadura Média ou Pesada", "Espada Longa"... */
  categoryDetail?: string
  /** resumo de uma linha, usado nas listas */
  desc?: string
  /** descrição integral do Livro do Mestre, um item por parágrafo */
  text?: string[]
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

// ---------- Moedas ----------
/** Cobre, prata, electro, ouro e platina — as cinco moedas do PHB. */
export type CoinKey = 'pc' | 'pp' | 'pe' | 'po' | 'pl'

export const COINS: CoinKey[] = ['pl', 'po', 'pe', 'pp', 'pc']

export const COIN_NAMES: Record<CoinKey, string> = {
  pl: 'Platina',
  po: 'Ouro',
  pe: 'Electro',
  pp: 'Prata',
  pc: 'Cobre',
}

/** Valor de cada moeda em peças de cobre. */
export const COIN_VALUE: Record<CoinKey, number> = { pc: 1, pp: 10, pe: 50, po: 100, pl: 1000 }

export type CoinPurse = Record<CoinKey, number>

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
  /** Testes de Morte marcados enquanto o personagem está a 0 PV */
  deathSaves: { successes: number; failures: number }
  /** rolagens de PV por nível (índice 0 = nível 2). null = média */
  hpRolls: (number | null)[]
  hitDiceSpent: number
  inventory: InventoryEntry[]
  /** @deprecated mantido só para fichas antigas; a bolsa real é `coins` */
  gold: number
  /** bolsa completa: cobre, prata, electro, ouro e platina */
  coins: CoinPurse
  spellsKnown: string[]
  spellsPrepared: string[]
  /**
   * Trocas de magia preparada disponíveis agora. Classes que trocam uma magia
   * por Descanso Longo (Paladino, Patrulheiro) recebem 1 a cada descanso longo;
   * as que trocam ao subir de nível (Bardo, Bruxo, Feiticeiro) recebem 1 a cada
   * nível. Clérigo, Druida e Mago trocam à vontade e não usam este contador.
   */
  spellSwaps: number
  /**
   * Magias escolhidas em cada grupo concedido fora da classe (espécie, talentos,
   * estilos de luta): { 'alto-elfo-truque': ['prestidigitacao-arcana'] }.
   */
  spellPicks: Record<string, string[]>
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
