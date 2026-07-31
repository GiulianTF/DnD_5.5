import type { Item } from '../types'

const w = (
  id: string,
  name: string,
  category: 'simples' | 'marcial',
  damage: string,
  damageType: string,
  mastery: string,
  opts: Partial<Item['weapon'] & { cost: string; weight: number }> = {},
): Item => {
  const { cost, weight, ...weapon } = opts as any
  return {
    id,
    name,
    kind: 'arma',
    cost,
    weight,
    weapon: { category, damage, damageType, mastery, properties: (weapon.properties as string[]) ?? [], ...weapon },
  }
}

export const WEAPONS: Item[] = [
  // ---------- Armas Simples (corpo a corpo) ----------
  w('adaga', 'Adaga', 'simples', '1d4', 'Perfurante', 'Ágil', { finesse: true, light: true, thrown: true, range: '6/18 m', properties: ['Acuidade', 'Leve', 'Arremesso (6/18 m)'], cost: '2 PO', weight: 0.5 }),
  w('azagaia', 'Azagaia', 'simples', '1d6', 'Perfurante', 'Lenta', { thrown: true, range: '9/36 m', properties: ['Arremesso (9/36 m)'], cost: '5 PP', weight: 1 }),
  w('bordao', 'Bordão (Cajado)', 'simples', '1d6', 'Concussão', 'Derrubar', { versatile: '1d8', properties: ['Versátil (1d8)'], cost: '2 PP', weight: 2 }),
  w('cacetete', 'Cacetete', 'simples', '1d4', 'Concussão', 'Lenta', { light: true, properties: ['Leve'], cost: '1 PP', weight: 1 }),
  w('foice-curta', 'Foice Curta', 'simples', '1d4', 'Cortante', 'Derrubar', { light: true, properties: ['Leve'], cost: '1 PO', weight: 1 }),
  w('lanca', 'Lança', 'simples', '1d6', 'Perfurante', 'Sacrificar (Sap)', { thrown: true, versatile: '1d8', range: '6/18 m', properties: ['Arremesso (6/18 m)', 'Versátil (1d8)'], cost: '1 PO', weight: 1.5 }),
  w('maca', 'Maça', 'simples', '1d6', 'Concussão', 'Sacrificar (Sap)', { cost: '5 PO', weight: 2 }),
  w('machadinha', 'Machadinha', 'simples', '1d6', 'Cortante', 'Vex (Provocar)', { light: true, thrown: true, range: '6/18 m', properties: ['Leve', 'Arremesso (6/18 m)'], cost: '5 PO', weight: 1 }),
  w('martelo-leve', 'Martelo Leve', 'simples', '1d4', 'Concussão', 'Nick (Golpe Duplo)', { light: true, thrown: true, range: '6/18 m', properties: ['Leve', 'Arremesso (6/18 m)'], cost: '2 PO', weight: 1 }),
  w('porrete-grande', 'Porrete Grande', 'simples', '1d8', 'Concussão', 'Empurrar', { twoHanded: true, properties: ['Duas Mãos'], cost: '2 PP', weight: 5 }),
  // ---------- Armas Simples (à distância) ----------
  w('arco-curto', 'Arco Curto', 'simples', '1d6', 'Perfurante', 'Vex (Provocar)', { ranged: true, twoHanded: true, range: '24/96 m', properties: ['Munição', 'Duas Mãos'], cost: '25 PO', weight: 1 }),
  w('besta-leve', 'Besta Leve', 'simples', '1d8', 'Perfurante', 'Lenta', { ranged: true, twoHanded: true, range: '24/96 m', properties: ['Munição', 'Recarga', 'Duas Mãos'], cost: '25 PO', weight: 2.5 }),
  w('dardo', 'Dardo', 'simples', '1d4', 'Perfurante', 'Vex (Provocar)', { ranged: true, finesse: true, thrown: true, range: '6/18 m', properties: ['Acuidade', 'Arremesso (6/18 m)'], cost: '5 PC', weight: 0.1 }),
  w('funda', 'Funda', 'simples', '1d4', 'Concussão', 'Lenta', { ranged: true, range: '9/36 m', properties: ['Munição'], cost: '1 PP', weight: 0 }),
  // ---------- Armas Marciais (corpo a corpo) ----------
  w('alabarda', 'Alabarda', 'marcial', '1d10', 'Cortante', 'Varredura (Cleave)', { twoHanded: true, heavy: true, properties: ['Pesada', 'Alcance', 'Duas Mãos'], cost: '20 PO', weight: 3 }),
  w('chicote', 'Chicote', 'marcial', '1d4', 'Cortante', 'Lenta', { finesse: true, properties: ['Acuidade', 'Alcance'], cost: '2 PO', weight: 1.5 }),
  w('cimitarra', 'Cimitarra', 'marcial', '1d6', 'Cortante', 'Nick (Golpe Duplo)', { finesse: true, light: true, properties: ['Acuidade', 'Leve'], cost: '25 PO', weight: 1.5 }),
  w('espada-curta', 'Espada Curta', 'marcial', '1d6', 'Perfurante', 'Vex (Provocar)', { finesse: true, light: true, properties: ['Acuidade', 'Leve'], cost: '10 PO', weight: 1 }),
  w('espada-grande', 'Espada Grande (Montante)', 'marcial', '2d6', 'Cortante', 'Enfraquecer (Graze)', { twoHanded: true, heavy: true, properties: ['Pesada', 'Duas Mãos'], cost: '50 PO', weight: 3 }),
  w('espada-longa', 'Espada Longa', 'marcial', '1d8', 'Cortante', 'Sacrificar (Sap)', { versatile: '1d10', properties: ['Versátil (1d10)'], cost: '15 PO', weight: 1.5 }),
  w('glaive', 'Glaive', 'marcial', '1d10', 'Cortante', 'Enfraquecer (Graze)', { twoHanded: true, heavy: true, properties: ['Pesada', 'Alcance', 'Duas Mãos'], cost: '20 PO', weight: 3 }),
  w('lanca-de-cavalaria', 'Lança de Cavalaria', 'marcial', '1d10', 'Perfurante', 'Derrubar', { properties: ['Alcance', 'Duas Mãos (fora de montaria)'], cost: '10 PO', weight: 3 }),
  w('lanca-longa', 'Pique', 'marcial', '1d10', 'Perfurante', 'Empurrar', { twoHanded: true, heavy: true, properties: ['Pesada', 'Alcance', 'Duas Mãos'], cost: '5 PO', weight: 8 }),
  w('machado-de-batalha', 'Machado de Batalha', 'marcial', '1d8', 'Cortante', 'Derrubar', { versatile: '1d10', properties: ['Versátil (1d10)'], cost: '10 PO', weight: 2 }),
  w('machado-grande', 'Machado Grande', 'marcial', '1d12', 'Cortante', 'Varredura (Cleave)', { twoHanded: true, heavy: true, properties: ['Pesada', 'Duas Mãos'], cost: '30 PO', weight: 3.5 }),
  w('malho', 'Malho', 'marcial', '2d6', 'Concussão', 'Derrubar', { twoHanded: true, heavy: true, properties: ['Pesada', 'Duas Mãos'], cost: '10 PO', weight: 5 }),
  w('mangual', 'Mangual', 'marcial', '1d8', 'Concussão', 'Sacrificar (Sap)', { cost: '10 PO', weight: 1 }),
  w('martelo-de-guerra', 'Martelo de Guerra', 'marcial', '1d8', 'Concussão', 'Empurrar', { versatile: '1d10', properties: ['Versátil (1d10)'], cost: '15 PO', weight: 1 }),
  w('picareta-de-guerra', 'Picareta de Guerra', 'marcial', '1d8', 'Perfurante', 'Sacrificar (Sap)', { versatile: '1d10', properties: ['Versátil (1d10)'], cost: '5 PO', weight: 1 }),
  w('rapieira', 'Rapieira (Florete)', 'marcial', '1d8', 'Perfurante', 'Vex (Provocar)', { finesse: true, properties: ['Acuidade'], cost: '25 PO', weight: 1 }),
  w('tridente', 'Tridente', 'marcial', '1d8', 'Perfurante', 'Derrubar', { thrown: true, versatile: '1d10', range: '6/18 m', properties: ['Arremesso (6/18 m)', 'Versátil (1d10)'], cost: '5 PO', weight: 2 }),
  // ---------- Armas Marciais (à distância) ----------
  w('arco-longo', 'Arco Longo', 'marcial', '1d8', 'Perfurante', 'Lenta', { ranged: true, twoHanded: true, heavy: true, range: '45/180 m', properties: ['Munição', 'Pesada', 'Duas Mãos'], cost: '50 PO', weight: 1 }),
  w('besta-de-mao', 'Besta de Mão', 'marcial', '1d6', 'Perfurante', 'Vex (Provocar)', { ranged: true, light: true, range: '9/36 m', properties: ['Munição', 'Recarga', 'Leve'], cost: '75 PO', weight: 1.5 }),
  w('besta-pesada', 'Besta Pesada', 'marcial', '1d10', 'Perfurante', 'Empurrar', { ranged: true, twoHanded: true, heavy: true, range: '30/120 m', properties: ['Munição', 'Recarga', 'Pesada', 'Duas Mãos'], cost: '50 PO', weight: 4.5 }),
  w('mosquete', 'Mosquete', 'marcial', '1d12', 'Perfurante', 'Lenta', { ranged: true, twoHanded: true, range: '12/36 m', properties: ['Munição', 'Recarga', 'Duas Mãos'], cost: '500 PO', weight: 5 }),
  w('pistola', 'Pistola', 'marcial', '1d10', 'Perfurante', 'Vex (Provocar)', { ranged: true, range: '9/27 m', properties: ['Munição', 'Recarga'], cost: '250 PO', weight: 1.5 }),
]

const a = (id: string, name: string, category: 'leve' | 'média' | 'pesada', baseAC: number, opts: Partial<Item['armor'] & { cost: string; weight: number }> = {}): Item => {
  const { cost, weight, ...armor } = opts as any
  return { id, name, kind: 'armadura', cost, weight, armor: { category, baseAC, ...armor } }
}

export const ARMORS: Item[] = [
  // Leve: CA + mod DES
  a('acolchoada', 'Armadura Acolchoada', 'leve', 11, { stealthDisadv: true, cost: '5 PO', weight: 4 }),
  a('couro', 'Armadura de Couro', 'leve', 11, { cost: '10 PO', weight: 5 }),
  a('couro-batido', 'Couro Batido', 'leve', 12, { cost: '45 PO', weight: 6.5 }),
  // Média: CA + mod DES (máx 2)
  a('peles', 'Armadura de Peles', 'média', 12, { dexMax: 2, cost: '10 PO', weight: 6 }),
  a('camisao-de-malha', 'Camisão de Malha', 'média', 13, { dexMax: 2, cost: '50 PO', weight: 10 }),
  a('brunea', 'Brunea (Escamas)', 'média', 14, { dexMax: 2, stealthDisadv: true, cost: '50 PO', weight: 22.5 }),
  a('peitoral', 'Peitoral', 'média', 14, { dexMax: 2, cost: '400 PO', weight: 10 }),
  a('meia-armadura', 'Meia Armadura', 'média', 15, { dexMax: 2, stealthDisadv: true, cost: '750 PO', weight: 20 }),
  // Pesada: CA fixa
  a('malha-de-aneis', 'Malha de Anéis', 'pesada', 14, { dexMax: 0, stealthDisadv: true, cost: '30 PO', weight: 20 }),
  a('cota-de-malha', 'Cota de Malha', 'pesada', 16, { dexMax: 0, strengthReq: 13, stealthDisadv: true, cost: '75 PO', weight: 27.5 }),
  a('armadura-de-talas', 'Armadura de Talas', 'pesada', 17, { dexMax: 0, strengthReq: 15, stealthDisadv: true, cost: '200 PO', weight: 30 }),
  a('armadura-de-placas', 'Armadura de Placas', 'pesada', 18, { dexMax: 0, strengthReq: 15, stealthDisadv: true, cost: '1500 PO', weight: 32.5 }),
]

export const SHIELD: Item = { id: 'escudo', name: 'Escudo', kind: 'escudo', cost: '10 PO', weight: 3, armor: { category: 'leve', baseAC: 2 } }

export const GEAR: Item[] = [
  { id: 'mochila', name: 'Mochila', kind: 'equipamento', cost: '2 PO', weight: 2.5 },
  { id: 'corda', name: 'Corda (15 m)', kind: 'equipamento', cost: '1 PO', weight: 2.5 },
  { id: 'tocha', name: 'Tocha', kind: 'equipamento', cost: '1 PC', weight: 0.5 },
  { id: 'racao', name: 'Rações de Viagem (1 dia)', kind: 'equipamento', cost: '5 PP', weight: 1 },
  { id: 'cantil', name: 'Cantil', kind: 'equipamento', cost: '2 PP', weight: 2.5 },
  { id: 'kit-curandeiro', name: 'Kit de Curandeiro', kind: 'equipamento', cost: '5 PO', weight: 1.5, desc: 'Estabiliza uma criatura a 0 PV sem teste (10 usos).' },
  { id: 'pocao-de-cura', name: 'Poção de Cura', kind: 'equipamento', cost: '50 PO', weight: 0.25, desc: 'Ação Bônus: recupere 2d4+2 PV.' },
  { id: 'ferramentas-de-ladrao', name: 'Ferramentas de Ladrão', kind: 'equipamento', cost: '25 PO', weight: 0.5 },
  { id: 'simbolo-sagrado', name: 'Símbolo Sagrado', kind: 'equipamento', cost: '5 PO', weight: 0.5 },
  { id: 'foco-arcano', name: 'Foco Arcano', kind: 'equipamento', cost: '10 PO', weight: 1 },
  { id: 'foco-druidico', name: 'Foco Druídico', kind: 'equipamento', cost: '1 PO', weight: 0 },
  { id: 'lampiao', name: 'Lampião Coberto', kind: 'equipamento', cost: '5 PO', weight: 1 },
  { id: 'saco-de-dormir', name: 'Saco de Dormir', kind: 'equipamento', cost: '1 PO', weight: 3.5 },
  { id: 'aljava', name: 'Aljava com 20 Flechas', kind: 'equipamento', cost: '2 PO', weight: 1.5 },
  { id: 'virotes', name: '20 Virotes', kind: 'equipamento', cost: '1 PO', weight: 0.75 },
  { id: 'grimorio', name: 'Grimório', kind: 'equipamento', cost: '50 PO', weight: 1.5 },
  { id: 'algemas', name: 'Algemas', kind: 'equipamento', cost: '2 PO', weight: 3 },
  { id: 'pe-de-cabra', name: 'Pé de Cabra', kind: 'equipamento', cost: '2 PO', weight: 2.5 },
  { id: 'kit-herbalismo', name: 'Kit de Herbalismo', kind: 'equipamento', cost: '5 PO', weight: 1.5 },
]

export const MAGIC_ITEMS: Item[] = [
  {
    id: 'anel-de-protecao',
    name: 'Anel de Proteção',
    kind: 'magico',
    magic: { acBonus: 1, saveBonus: 1, attunement: true, desc: '+1 na CA e em todas as salvaguardas. Requer sintonização.' },
  },
  {
    id: 'bracadeiras-de-defesa',
    name: 'Braçadeiras de Defesa',
    kind: 'magico',
    magic: { acBonus: 2, requiresNoArmor: true, attunement: true, desc: '+2 na CA enquanto não usar armadura nem escudo. Requer sintonização.' },
  },
  {
    id: 'amuleto-da-saude',
    name: 'Amuleto da Saúde',
    kind: 'magico',
    magic: { setAbility: { con: 19 }, attunement: true, desc: 'Sua Constituição passa a ser 19 enquanto usar o amuleto. Requer sintonização.' },
  },
  {
    id: 'manoplas-de-forca-do-ogro',
    name: 'Manoplas da Força do Ogro',
    kind: 'magico',
    magic: { setAbility: { for: 19 }, attunement: true, desc: 'Sua Força passa a ser 19 enquanto usar as manoplas. Requer sintonização.' },
  },
  {
    id: 'cinto-de-forca-do-gigante-da-colina',
    name: 'Cinturão de Força do Gigante da Colina',
    kind: 'magico',
    magic: { setAbility: { for: 21 }, attunement: true, desc: 'Sua Força passa a ser 21 enquanto usar o cinturão. Requer sintonização.' },
  },
  {
    id: 'cinto-de-forca-do-gigante-do-fogo',
    name: 'Cinturão de Força do Gigante do Fogo',
    kind: 'magico',
    magic: { setAbility: { for: 25 }, attunement: true, desc: 'Sua Força passa a ser 25 enquanto usar o cinturão. Requer sintonização.' },
  },
  {
    id: 'pedra-da-boa-sorte',
    name: 'Pedra da Boa Sorte',
    kind: 'magico',
    magic: { saveBonus: 1, attunement: true, desc: '+1 em salvaguardas e testes de habilidade enquanto carregar a pedra. Requer sintonização.' },
  },
  {
    id: 'manto-de-protecao',
    name: 'Manto de Proteção',
    kind: 'magico',
    magic: { acBonus: 1, saveBonus: 1, attunement: true, desc: '+1 na CA e em salvaguardas. Requer sintonização.' },
  },
  {
    id: 'amuleto-de-escudo-contra-magias',
    name: 'Amuleto de Proteção contra Magias',
    kind: 'magico',
    magic: { saveBonus: 2, attunement: true, desc: '+2 em salvaguardas contra magias. (Simplificado: +2 em salvaguardas.) Requer sintonização.' },
  },
]

export const ALL_ITEMS: Item[] = [...WEAPONS, ...ARMORS, SHIELD, ...GEAR, ...MAGIC_ITEMS]
export const itemById = (id: string) => ALL_ITEMS.find((i) => i.id === id)
