// Teste de fumaça das regras. Executado via esbuild + node; não faz parte do app.
import type { Character } from './types'
import { RARITY_NAMES, RARITY_ORDER } from './types'
import { newCharacter, normalizeCharacter } from './store/store'
import {
  armorClass, attackActions, characterFeats, maxHp, spellSlots, pactSlots, preparedLimit, cantripLimit,
  characterResources, innateSpells, levelUpSummary, finalAbilities, pendingChoices, saves, skillValues,
  speciesLabel, spellcasting, spellPickGroups,
} from './engine/rules'
import { pagar, parseCost, purseInCopper } from './engine/money'
import { CLASSES } from './data/classes'
import { SPECIES } from './data/species'
import { SPELLS, spellById } from './data/spells'
import { BACKGROUNDS } from './data/backgrounds'
import { ALL_ITEMS, MAGIC_ITEMS, itemById } from './data/equipment'
import { FEATS, featById } from './data/feats'
import { skillById } from './data/skills'

// Roda no Node via scripts/run-tests.cjs; o projeto não depende de @types/node.
declare const process: { exitCode?: number }

let falhas = 0
const ok = (cond: boolean, msg: string) => {
  if (!cond) { falhas++; console.log('  X ' + msg) } else console.log('  . ' + msg)
}

console.log('\n== Guerreiro nv1: cota de malha + escudo + espada longa ==')
const g: Character = newCharacter({
  name: 'Test', classId: 'guerreiro', speciesId: 'humano', backgroundId: 'soldado',
  baseAbilities: { for: 15, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  backgroundBonuses: { for: 2, con: 1 },
  inventory: [
    { uid: 'a', itemId: 'cota-de-malha', qty: 1, equipped: true },
    { uid: 'b', itemId: 'escudo', qty: 1, equipped: true },
    { uid: 'c', itemId: 'espada-longa', qty: 1, equipped: true },
  ],
})
const abs = finalAbilities(g)
ok(abs.for === 17 && abs.con === 15, `atributos c/ antecedente: FOR ${abs.for}, CON ${abs.con} (esperado 17/15)`)
ok(armorClass(g).total === 18, `CA = ${armorClass(g).total} (cota 16 + escudo 2)`)
ok(maxHp(g) === 12, `PV = ${maxHp(g)} (d10 + 2 CON)`)
const atk = attackActions(g)[0]
ok(atk.attackBonus === 5, `ataque espada longa = +${atk.attackBonus} (3 FOR + 2 prof)`)
ok(atk.damageBonus === 3 && atk.damageDice === '1d8', `dano = ${atk.damageDice}+${atk.damageBonus}`)

console.log('\n== Arma magica +2 e anel de protecao ==')
const g2: Character = {
  ...g,
  inventory: [
    ...g.inventory.map((e) => (e.uid === 'c' ? { ...e, bonus: 2 } : e)),
    { uid: 'd', itemId: 'anel-de-protecao', qty: 1, equipped: true, attuned: true },
  ],
}
const atk2 = attackActions(g2)[0]
ok(atk2.attackBonus === 7 && atk2.damageBonus === 5, `espada +2: ataque +${atk2.attackBonus}, dano +${atk2.damageBonus}`)
ok(armorClass(g2).total === 19, `CA com anel = ${armorClass(g2).total}`)
ok(saves(g2)[0].value === 6, `salvaguarda FOR = +${saves(g2)[0].value} (3 FOR + 2 prof + 1 anel = 6)`)

console.log('\n== Amuleto da Saude recalcula CON e PV ==')
const g3: Character = {
  ...g, level: 5, hpRolls: [null, null, null, null],
  inventory: [...g.inventory, { uid: 'e', itemId: 'amuleto-da-saude', qty: 1, equipped: true, attuned: true }],
}
const semAmuleto: Character = { ...g3, inventory: g.inventory }
ok(finalAbilities(g3).con === 19, `CON com amuleto = ${finalAbilities(g3).con} (esperado 19)`)
ok(maxHp(g3) === maxHp(semAmuleto) + 10, `PV subiu ${maxHp(g3) - maxHp(semAmuleto)} (+2 mod x 5 niveis)`)

console.log('\n== Bracadeiras de Defesa so funcionam sem armadura ==')
const semArm: Character = { ...g, inventory: [{ uid: 'x', itemId: 'bracadeiras-de-defesa', qty: 1, equipped: true, attuned: true }] }
const comArm: Character = { ...g, inventory: [...g.inventory, { uid: 'x', itemId: 'bracadeiras-de-defesa', qty: 1, equipped: true, attuned: true }] }
ok(armorClass(semArm).total === 14, `CA c/ bracadeiras sem armadura = ${armorClass(semArm).total} (10+2 DES+2)`)
ok(armorClass(comArm).total === 18, `CA c/ bracadeiras + armadura = ${armorClass(comArm).total} (bonus ignorado)`)

console.log('\n== Item de sintonizacao nao sintonizado nao aplica bonus ==')
const naoSint: Character = { ...g, inventory: [...g.inventory, { uid: 'z', itemId: 'anel-de-protecao', qty: 1, equipped: true }] }
ok(armorClass(naoSint).total === 18, `CA sem sintonizar o anel = ${armorClass(naoSint).total} (sem +1)`)

console.log('\n== Defesas sem armadura ==')
const b: Character = newCharacter({ classId: 'barbaro', baseAbilities: { for: 16, des: 14, con: 16, int: 8, sab: 10, car: 10 } })
ok(armorClass(b).total === 15, `CA barbaro = ${armorClass(b).total} (10 + 2 DES + 3 CON)`)
const m: Character = newCharacter({ classId: 'monge', baseAbilities: { for: 12, des: 16, con: 14, int: 10, sab: 15, car: 8 } })
ok(armorClass(m).total === 15, `CA monge = ${armorClass(m).total} (10 + 3 DES + 2 SAB)`)

console.log('\n== Armadura media limita bonus de DES a +2 ==')
const med: Character = newCharacter({
  classId: 'clerigo', baseAbilities: { for: 10, des: 18, con: 12, int: 10, sab: 16, car: 10 },
  inventory: [{ uid: 'p', itemId: 'peitoral', qty: 1, equipped: true }],
})
ok(armorClass(med).total === 16, `CA peitoral c/ DES 18 = ${armorClass(med).total} (14 + 2, nao 14 + 4)`)

console.log('\n== Espacos de magia ==')
const mago: Character = newCharacter({ classId: 'mago', level: 5 })
ok(JSON.stringify(spellSlots(mago).slice(0, 3)) === '[4,3,2]', `mago nv5 = ${spellSlots(mago).slice(0, 3)}`)
const pal: Character = newCharacter({ classId: 'paladino', level: 5 })
ok(spellSlots(pal)[0] === 4 && spellSlots(pal)[1] === 2, `paladino nv5 = ${spellSlots(pal).slice(0, 2)}`)
const bruxo: Character = newCharacter({ classId: 'bruxo', level: 5 })
ok(pactSlots(bruxo)?.count === 2 && pactSlots(bruxo)?.level === 3, `bruxo nv5 = ${JSON.stringify(pactSlots(bruxo))}`)
ok(preparedLimit(mago) === 9 && cantripLimit(mago) === 4, `mago nv5: ${preparedLimit(mago)} preparadas, ${cantripLimit(mago)} truques`)

console.log('\n== Recursos limitados ==')
const barb5: Character = newCharacter({ classId: 'barbaro', level: 5 })
ok(characterResources(barb5).find((r) => r.id === 'furia')?.max === 3, `furias nv5 = ${characterResources(barb5).find((r) => r.id === 'furia')?.max}`)
const gue: Character = newCharacter({ classId: 'guerreiro', level: 2 })
const surto = characterResources(gue).find((r) => r.id === 'surto-de-acao')
ok(surto?.max === 1 && surto.recharge === 'curto', `surto de acao: ${surto?.max} uso, recarga ${surto?.recharge}`)
const bardo: Character = newCharacter({ classId: 'bardo', level: 3, baseAbilities: { for: 8, des: 14, con: 12, int: 10, sab: 10, car: 16 } })
ok(characterResources(bardo).find((r) => r.id === 'inspiracao-bardica')?.max === 3, `inspiracao bardica = ${characterResources(bardo).find((r) => r.id === 'inspiracao-bardica')?.max}`)

console.log('\n== Assistente de evolucao ==')
const r3 = levelUpSummary(newCharacter({ classId: 'guerreiro', level: 2 }), 3)!
ok(r3.needsSubclass, 'guerreiro nv3 pede subclasse')
const r4 = levelUpSummary(newCharacter({ classId: 'guerreiro', level: 3, subclassId: 'campeao' }), 4)!
ok(r4.needsAsi, 'guerreiro nv4 pede incremento/talento')
ok(r4.features.length > 0, `nv4 lista ${r4.features.length} caracteristica(s)`)
const r5 = levelUpSummary(newCharacter({ classId: 'mago', level: 4 }), 5)!
ok(r5.newSlots.some((s) => s.level === 3 && s.gained === 2), `mago nv5 ganha espacos de 3o: ${JSON.stringify(r5.newSlots)}`)
const r9 = levelUpSummary(newCharacter({ classId: 'mago', level: 8 }), 9)!
ok(r9.proficiencyBonus === 4 && r9.proficiencyChanged, 'prof sobe para +4 no nv9')
const rSub = levelUpSummary(newCharacter({ classId: 'clerigo', level: 5, subclassId: 'vida' }), 6)!
ok(rSub.features.some((f) => f.name === 'Curandeiro Abencoado' || f.name.includes('Curandeiro')), `nv6 clerigo da Vida traz caracteristica de subclasse: ${rSub.features.map((f) => f.name).join(', ')}`)

console.log('\n== Integridade dos dados ==')
for (const c of CLASSES) {
  const niveis = c.features.map((f) => f.level)
  ok(niveis.every((n) => n >= 1 && n <= 20), `${c.name}: niveis validos`)
  ok(c.subclasses.length >= 4, `${c.name}: ${c.subclasses.length} subclasses`)
  if (c.preparedByLevel) ok(c.preparedByLevel.length === 20, `${c.name}: tabela de preparadas com 20 entradas`)
  if (c.cantripsByLevel) ok(c.cantripsByLevel.length === 20, `${c.name}: tabela de truques com 20 entradas`)
  const ch = newCharacter({ classId: c.id, level: 20 })
  ok(maxHp(ch) > 0 && armorClass(ch).total > 0 && skillValues(ch).length === 18, `${c.name} nv20: calculos ok`)
  if (c.caster !== 'nenhum') ok(spellcasting(ch) !== null, `${c.name}: conjuracao ok`)
  // toda classe conjuradora precisa ter magias no catalogo
  if (c.caster !== 'nenhum') {
    const n = SPELLS.filter((s) => s.classes.includes(c.id)).length
    ok(n >= 10, `${c.name}: ${n} magias no catalogo`)
  }
}

const ids = new Set<string>()
let dup = 0
for (const s of SPELLS) { if (ids.has(s.id)) dup++; ids.add(s.id) }
ok(dup === 0, `magias sem ids duplicados (${SPELLS.length} magias)`)
const itemIds = new Set<string>()
let dupI = 0
for (const i of ALL_ITEMS) { if (itemIds.has(i.id)) dupI++; itemIds.add(i.id) }
ok(dupI === 0, `itens sem ids duplicados (${ALL_ITEMS.length} itens)`)
for (const bg of BACKGROUNDS) {
  ok(!!featById(bg.featId), `antecedente ${bg.name}: talento "${bg.featId}" existe`)
  ok(bg.abilities.length === 3, `antecedente ${bg.name}: 3 habilidades`)
}

console.log('\n== Escolhas de especie e de classe ==')
for (const sp of SPECIES) {
  for (const gr of sp.choices ?? []) {
    ok(gr.options.length >= 2, `${sp.name} / ${gr.name}: ${gr.options.length} opcoes`)
    for (const o of gr.options) {
      if (o.grantsSkill) ok(!!skillById(o.grantsSkill), `${gr.name} / ${o.name}: pericia "${o.grantsSkill}" existe`)
    }
  }
}
/** Só as escolhas da espécie — a classe tem as suas (ex.: estilo de luta do guerreiro). */
const pendentesDaEspecie = (c: Character) => pendingChoices(c).filter((p) => p.source === 'especie')
const golias = newCharacter({ speciesId: 'golias' })
ok(pendentesDaEspecie(golias).some((c) => c.group.id === 'dadiva-de-gigante'), 'golias sem escolha: dadiva de gigante fica pendente')
ok(pendentesDaEspecie({ ...golias, speciesChoices: { 'dadiva-de-gigante': 'pedra' } }).length === 0, 'golias com dadiva escolhida: nada pendente na especie')
const draco = newCharacter({ speciesId: 'draconato' })
ok(pendentesDaEspecie(draco).some((c) => c.group.id === 'ancestral-draconico'), 'draconato sem escolha: ancestral fica pendente')
ok(pendentesDaEspecie(newCharacter({ speciesId: 'aasimar' })).length === 0, 'aasimar nv1: revelacao celestial so aparece no nv3')
ok(pendentesDaEspecie(newCharacter({ speciesId: 'aasimar', level: 3 })).length === 1, 'aasimar nv3: revelacao celestial fica pendente')
const elfo = newCharacter({ speciesId: 'elfo', speciesChoices: { 'linhagem-elfica': 'drow', 'sentidos-agucados': 'percepcao' } })
ok(skillValues(elfo).find((s) => s.id === 'percepcao')?.proficient === true, 'elfo: Sentidos Agucados concede a pericia escolhida')

console.log('\n== Estilo de Luta ==')
const guerreiro1 = newCharacter({ classId: 'guerreiro' })
ok(pendingChoices(guerreiro1).some((c) => c.group.id === 'estilo-de-luta'), 'guerreiro nv1: estilo de luta fica pendente')
ok(!pendingChoices(newCharacter({ classId: 'paladino' })).some((c) => c.group.id === 'estilo-de-luta'), 'paladino nv1: estilo de luta so no nv2')
ok(pendingChoices(newCharacter({ classId: 'paladino', level: 2 })).some((c) => c.group.id === 'estilo-de-luta'), 'paladino nv2: estilo de luta fica pendente')
for (const c of CLASSES) {
  for (const gr of c.choices ?? []) {
    for (const o of gr.options) {
      if (gr.id === 'estilo-de-luta') ok(!!featById(o.id), `${c.name} / estilo "${o.name}": talento existe`)
    }
  }
}
const comDefesa: Character = {
  ...newCharacter({ classId: 'guerreiro', classChoices: { 'estilo-de-luta': 'estilo-defesa' } }),
  inventory: [{ uid: 'a', itemId: 'cota-de-malha', qty: 1, equipped: true }],
}
const semDefesa: Character = { ...comDefesa, classChoices: { 'estilo-de-luta': 'estilo-duelismo' } }
ok(armorClass(comDefesa).total === armorClass(semDefesa).total + 1, `estilo Defesa da +1 CA (${armorClass(comDefesa).total} vs ${armorClass(semDefesa).total})`)
ok(characterFeats(comDefesa).some((f) => f.id === 'estilo-defesa'), 'estilo escolhido aparece na lista de talentos')

console.log('\n== Talento de origem adicional (Humano) ==')
const humano = newCharacter({ speciesId: 'humano', backgroundId: 'soldado', originFeats: ['durao'] })
ok(characterFeats(humano).some((f) => f.id === 'durao'), 'talento de origem extra aparece na ficha')
ok(characterFeats(humano).some((f) => f.id === 'atacante-selvagem'), 'talento do antecedente continua na ficha')
ok(maxHp(humano) === maxHp({ ...humano, originFeats: [] }) + 2, 'talento Durao extra soma +2 PV por nivel')
for (const f of characterFeats(humano)) ok(!!f.origem && !!f.desc, `talento ${f.name}: tem origem e descricao`)

console.log('\n== Equipamento inicial ==')
for (const c of CLASSES) {
  ok(c.equipmentOptions.length >= 2, `${c.name}: ${c.equipmentOptions.length} opcoes de equipamento`)
  for (const opt of c.equipmentOptions) {
    for (const it of opt.items) ok(!!itemById(it.itemId), `${c.name} opcao ${opt.id}: item "${it.itemId}" existe`)
    ok(opt.items.length > 0 || opt.gold > 0, `${c.name} opcao ${opt.id}: da itens ou moedas`)
  }
}
for (const bg of BACKGROUNDS) {
  ok(bg.equipmentOptions.length >= 2, `${bg.name}: ${bg.equipmentOptions.length} opcoes de equipamento`)
  for (const opt of bg.equipmentOptions) {
    for (const it of opt.items) ok(!!itemById(it.itemId), `${bg.name} opcao ${opt.id}: item "${it.itemId}" existe`)
  }
}

console.log('\n== Magias concedidas pela especie ==')
const drowGuerreiro: Character = newCharacter({
  classId: 'guerreiro', speciesId: 'elfo', backgroundId: 'soldado', level: 5,
  speciesChoices: { 'linhagem-elfica': 'drow', 'sentidos-agucados': 'percepcao' },
  hpRolls: [null, null, null, null],
})
const inatasDrow = innateSpells(drowGuerreiro)
ok(inatasDrow.some((m) => m.spell.id === 'luzes-dancantes'), 'guerreiro drow recebe o truque Luzes Dancantes')
ok(inatasDrow.some((m) => m.spell.id === 'fogo-das-fadas'), 'drow nivel 5 ja tem Fogo das Fadas (nivel 3)')
ok(inatasDrow.some((m) => m.spell.id === 'escuridao'), 'drow nivel 5 ja tem Escuridao')
ok(innateSpells({ ...drowGuerreiro, level: 1 }).length === 1, 'no nivel 1 o drow so tem o truque')
ok(inatasDrow.every((m) => m.saveDC >= 8 && m.attackBonus >= 0), 'magias de especie tem CD e ataque calculados')
ok(speciesLabel(drowGuerreiro) === 'Elfo (Drow)', `rotulo da especie mostra a linhagem: ${speciesLabel(drowGuerreiro)}`)

// Todas as espécies/linhagens que declaram magias apontam para magias existentes
for (const s of SPECIES) {
  for (const m of s.innateSpells ?? []) ok(!!spellById(m.spellId), `${s.name}: magia "${m.spellId}" existe`)
  for (const g of s.choices ?? []) {
    for (const o of g.options) {
      for (const m of o.innateSpells ?? []) ok(!!spellById(m.spellId), `${s.name}/${o.name}: magia "${m.spellId}" existe`)
    }
  }
}

console.log('\n== Magias escolhidas fora da lista da classe ==')
// Alto Elfo escolhe um truque de Mago; a escolha aparece no passo de Magias.
const altoElfo: Character = newCharacter({
  classId: 'guerreiro', speciesId: 'elfo', backgroundId: 'soldado',
  speciesChoices: { 'linhagem-elfica': 'alto-elfo', 'sentidos-agucados': 'percepcao' },
})
const gruposAltoElfo = spellPickGroups(altoElfo)
const truqueAltoElfo = gruposAltoElfo.find((g) => g.pick.id === 'alto-elfo-truque')
ok(!!truqueAltoElfo, 'alto elfo tem um grupo de escolha de truque')
ok(truqueAltoElfo!.pending, 'a escolha comeca pendente')
ok(truqueAltoElfo!.options.length > 0 && truqueAltoElfo!.options.every((s) => s.level === 0 && s.classes.includes('mago')),
  `so oferece truques de Mago (${truqueAltoElfo!.options.length} opcoes)`)
const altoElfoEscolhido: Character = { ...altoElfo, spellPicks: { 'alto-elfo-truque': ['raio-de-fogo'] } }
ok(!spellPickGroups(altoElfoEscolhido)[0].pending, 'depois de escolher, o grupo deixa de estar pendente')
ok(innateSpells(altoElfoEscolhido).some((m) => m.spell.id === 'raio-de-fogo'),
  'o truque escolhido aparece nas magias do personagem')

// Iniciado em Magia (talento de origem) tambem escolhe no passo de Magias.
const iniciado: Character = newCharacter({
  classId: 'barbaro', speciesId: 'humano', backgroundId: 'soldado', originFeats: ['iniciado-em-magia'],
})
const gruposIniciado = spellPickGroups(iniciado)
ok(gruposIniciado.length === 2, `Iniciado em Magia abre 2 grupos (${gruposIniciado.length})`)
ok(gruposIniciado[0].pick.count === 2 && gruposIniciado[0].pick.spellLevel === 0, '2 truques')
ok(gruposIniciado[1].pick.count === 1 && gruposIniciado[1].pick.spellLevel === 1, '1 magia de 1o circulo')

// Estilo de Luta Combatente Abencoado (Paladino, nivel 2): 2 truques de Clerigo.
const abencoado: Character = newCharacter({
  classId: 'paladino', level: 2, backgroundId: 'soldado', hpRolls: [null],
  classChoices: { 'estilo-de-luta': 'estilo-combatente-abencoado' },
})
const grupoAbencoado = spellPickGroups(abencoado).find((g) => g.pick.id === 'estilo-combatente-abencoado-truques')
ok(!!grupoAbencoado && grupoAbencoado.options.every((s) => s.classes.includes('clerigo')),
  'Combatente Abencoado oferece truques de Clerigo')

// Ordem Divina (Taumaturgo) da um truque a mais na lista da propria classe.
const clerigoBase: Character = newCharacter({ classId: 'clerigo', level: 1 })
const taumaturgo: Character = { ...clerigoBase, classChoices: { 'ordem-divina': 'taumaturgo' } }
ok(cantripLimit(taumaturgo) === cantripLimit(clerigoBase) + 1,
  `Taumaturgo conhece 1 truque a mais (${cantripLimit(clerigoBase)} -> ${cantripLimit(taumaturgo)})`)

// Toda escolha de magia declarada nos dados precisa ter opcoes reais.
for (const f of FEATS) {
  for (const p of f.spellPicks ?? []) {
    const disponiveis = SPELLS.filter(
      (s) => s.level === p.spellLevel && s.classes.some((c) => p.fromClasses.includes(c))
        && (!p.schools || p.schools.includes(s.school)),
    )
    ok(disponiveis.length >= p.count, `${f.name}: ha ${disponiveis.length} opcao(oes) para escolher ${p.count}`)
  }
  for (const m of f.innateSpells ?? []) ok(!!spellById(m.spellId), `${f.name}: magia "${m.spellId}" existe`)
}

console.log('\n== Catalogo de magias do Livro do Jogador ==')
ok(SPELLS.length >= 380, `catalogo completo: ${SPELLS.length} magias`)
for (let lvl = 0; lvl <= 9; lvl++) {
  ok(SPELLS.some((s) => s.level === lvl), `ha magias de ${lvl === 0 ? 'truque' : `${lvl}o circulo`}`)
}
for (const c of CLASSES.filter((c) => c.caster !== 'nenhum')) {
  ok(SPELLS.filter((s) => s.classes.includes(c.id)).length >= 40, `${c.name} tem lista de magias completa`)
}
ok(SPELLS.every((s) => s.desc.length > 0 && s.castingTime && s.range && s.components && s.duration),
  'toda magia tem descricao integral e os quatro campos do livro')
ok(!!spellById('rajada-mistica') && spellById('rajada-mistica')!.id === 'raio-mistico',
  'ids antigos continuam resolvendo pela tabela de apelidos')

console.log('\n== Catalogo de itens magicos do Livro do Mestre ==')
ok(MAGIC_ITEMS.length >= 300, `catalogo completo: ${MAGIC_ITEMS.length} itens magicos`)
for (const r of RARITY_ORDER) {
  const n = MAGIC_ITEMS.filter((i) => i.magic?.rarity === r).length
  ok(n > 0, `ha itens de raridade ${RARITY_NAMES[r]} (${n})`)
}
ok(MAGIC_ITEMS.every((i) => i.kind === 'magico'), 'todo item magico tem kind "magico"')
ok(MAGIC_ITEMS.every((i) => !!i.magic?.rarity && !!i.magic?.category), 'todo item tem raridade e categoria')
ok(MAGIC_ITEMS.every((i) => (i.magic?.text?.length ?? 0) > 0), 'todo item tem a descricao do livro')
ok(MAGIC_ITEMS.filter((i) => i.magic?.attunement).length > 100,
  `itens com sintonizacao: ${MAGIC_ITEMS.filter((i) => i.magic?.attunement).length}`)
// Itens guardados em fichas antigas continuam resolvendo
ok(!!itemById('cinto-de-forca-do-gigante-da-colina'), 'ids antigos de itens continuam resolvendo')
// Os bonus numericos continuam entrando nos calculos da ficha
const comAnel: Character = {
  ...g,
  inventory: [...g.inventory, { uid: 'ring', itemId: 'anel-de-protecao', qty: 1, equipped: true, attuned: true }],
}
ok(armorClass(comAnel).total === armorClass(g).total + 1, 'Anel de Protecao do novo catalogo soma +1 na CA')

console.log('\n== Moedas: precos do catalogo e troco ==')
for (const item of ALL_ITEMS) {
  if (item.cost) ok(parseCost(item.cost) !== null, `preco de "${item.name}" (${item.cost}) foi entendido`)
}
ok(parseCost('25 PO') === 2500, 'parseCost 25 PO = 2500 PC')
ok(parseCost('5 PP') === 50, 'parseCost 5 PP = 50 PC')
const bolsa1 = { pc: 0, pp: 0, pe: 0, po: 10, pl: 0 }
const depois1 = pagar(bolsa1, 250)!
ok(!!depois1 && purseInCopper(depois1) === 750, `pagar 2,5 PO de 10 PO deixa 7,5 PO (${purseInCopper(depois1)} PC)`)
const bolsa2 = { pc: 0, pp: 0, pe: 0, po: 1, pl: 0 }
const depois2 = pagar(bolsa2, 5)!
ok(!!depois2 && depois2.pp === 9 && depois2.pc === 5, `quebrar 1 PO para pagar 5 PC devolve troco (${depois2.pp} PP, ${depois2.pc} PC)`)
ok(pagar({ pc: 3, pp: 0, pe: 0, po: 0, pl: 0 }, 100) === null, 'sem dinheiro suficiente, pagar retorna null')
ok(purseInCopper({ pc: 1, pp: 1, pe: 1, po: 1, pl: 1 }) === 1161, 'valor total da bolsa em cobre')

console.log('\n== Fichas antigas (sem os campos novos) ==')
const antiga = JSON.parse(JSON.stringify(newCharacter({ classId: 'guerreiro' }))) as Character
delete (antiga as Partial<Character>).speciesChoices
delete (antiga as Partial<Character>).classChoices
delete (antiga as Partial<Character>).originFeats
ok(normalizeCharacter(antiga).originFeats.length === 0, 'normalizeCharacter preenche os campos que faltam')
ok(characterFeats(antiga).length > 0 && armorClass(antiga).total > 0, 'ficha antiga continua calculando sem quebrar')

console.log(falhas === 0 ? '\n>>> TODOS OS TESTES DE REGRAS PASSARAM' : `\n>>> ${falhas} FALHA(S) NAS REGRAS`)
if (falhas > 0) process.exitCode = 1
