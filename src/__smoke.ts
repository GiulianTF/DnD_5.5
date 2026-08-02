// Teste de fumaça das regras. Executado via esbuild + node; não faz parte do app.
import type { Character } from './types'
import { RARITY_NAMES, RARITY_ORDER } from './types'
import { newCharacter, normalizeCharacter, useStore } from './store/store'
import {
  armorClass, attackActions, characterFeats, maxHp, spellSlots, pactSlots, preparedLimit, cantripLimit,
  characterResources, innateSpells, levelUpSummary, finalAbilities, pendingChoices, saves, skillValues,
  speciesLabel, spellcasting, spellPickGroups, alwaysPreparedSpells, isProficientWithArmor, maxSpellLevel,
  isProficientWithWeapon, preparableSpells, preparationMode, preparedSpellIds, proficiencyGroups,
  spellListClasses, armorTraining, classLabel, classLevel, featureOptionBlocked, featurePickGroups,
  isMulticlass, multiclassBlockers, multiclassOptions, proficiencyBonus, withLevelIn,
  innateFreeUses, innateSpellResourceId, innateUsesLabel,
} from './engine/rules'
import { pagar, parseCost, purseInCopper } from './engine/money'
import { CLASSES, classById } from './data/classes'
import { SPECIES } from './data/species'
import { SPELLS, spellById } from './data/spells'
import { BACKGROUNDS } from './data/backgrounds'
import { ALL_ITEMS, ARMORS, MAGIC_ITEMS, itemById } from './data/equipment'
import { FEATS, featById } from './data/feats'
import { skillById } from './data/skills'
import { APP_VERSION, PATCH_NOTES, formatarData, notaAtual } from './data/patch-notes'
import {
  FOLGA, LIMIAR, decidirTroca, definirEixo, deslocamento, proximoIndice,
} from './engine/swipe'
import {
  cargasDoItem, circulosDisponiveis, dadosDaMagia, dadosNoTexto, ehConsumivel, ehUsavel,
} from './engine/uso'

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

// A magia de 1o circulo do talento fica sempre pronta e nao gasta espaco: 1 uso por descanso longo.
const iniciadoEscolhido: Character = {
  ...iniciado,
  spellPicks: {
    'iniciado-em-magia-truques': ['orientacao', 'chama-sagrada'],
    'iniciado-em-magia-magia': ['bencao'],
  },
}
const inatasIniciado = innateSpells(iniciadoEscolhido)
const bencao = inatasIniciado.find((m) => m.spell.id === 'bencao')
ok(!!bencao, 'a magia do Iniciado em Magia entra nas magias do personagem')
ok(bencao!.freeUses === 'longo', 'a magia do talento tem uso gratuito por descanso longo')
ok(innateFreeUses(iniciadoEscolhido, bencao!.freeUses) === 1,
  `1 conjuracao gratuita (${innateFreeUses(iniciadoEscolhido, bencao!.freeUses)})`)
ok(innateUsesLabel(iniciadoEscolhido, bencao!.freeUses) === '1×/descanso longo',
  `rotulo dos usos: ${innateUsesLabel(iniciadoEscolhido, bencao!.freeUses)}`)
const truqueIniciado = inatasIniciado.find((m) => m.spell.id === 'orientacao')
ok(!!truqueIniciado && innateFreeUses(iniciadoEscolhido, truqueIniciado.freeUses) === 0,
  'truque do talento e a vontade, sem usos para marcar')
// Os usos gastos moram em `resourcesUsed`, entao o descanso longo (que zera o registro) os devolve.
ok(innateSpellResourceId('bencao') === 'magia-inata:bencao',
  `chave dos usos gratuitos: ${innateSpellResourceId('bencao')}`)
ok(!characterResources(iniciadoEscolhido).some((r) => r.id === innateSpellResourceId('bencao')),
  'usos de magia inata nao aparecem entre os recursos da ficha')
// O drow tem PB usos de Falar com Animais quando a linhagem concede 'prof-longo'.
ok(innateFreeUses(drowGuerreiro, 'prof-longo') === proficiencyBonus(drowGuerreiro.level),
  `'prof-longo' vale o bonus de proficiencia (${innateFreeUses(drowGuerreiro, 'prof-longo')})`)

// O uso gratuito sobrevive ao descanso curto e volta no longo.
const chaveBencao = innateSpellResourceId('bencao')
useStore.setState({ characters: [], activeId: null })
useStore.getState().addCharacter(iniciadoEscolhido)
const usosDe = (id: string) => useStore.getState().characters.find((c) => c.id === id)?.resourcesUsed[chaveBencao] ?? 0
useStore.getState().useResource(iniciadoEscolhido.id, chaveBencao, 1)
ok(usosDe(iniciadoEscolhido.id) === 1, 'marcar o uso gratuito registra 1 conjuracao gasta')
useStore.getState().shortRest(iniciadoEscolhido.id)
ok(usosDe(iniciadoEscolhido.id) === 1, 'descanso curto NAO devolve o uso gratuito')
useStore.getState().longRest(iniciadoEscolhido.id)
ok(usosDe(iniciadoEscolhido.id) === 0, 'descanso longo devolve o uso gratuito')
useStore.setState({ characters: [], activeId: null })

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

console.log('\n== Proficiencias concedidas por escolhas e subclasses ==')
const cotaDeMalha = itemById('cota-de-malha')!
const clerigoProtetor: Character = newCharacter({
  classId: 'clerigo', level: 1, classChoices: { 'ordem-divina': 'protetor' },
})
const clerigoTaumaturgo: Character = { ...clerigoProtetor, classChoices: { 'ordem-divina': 'taumaturgo' } }
ok(isProficientWithArmor(clerigoProtetor, cotaDeMalha),
  'Clerigo Protetor e proficiente com armadura pesada (cota de malha)')
ok(!isProficientWithArmor(clerigoTaumaturgo, cotaDeMalha),
  'Clerigo Taumaturgo NAO e proficiente com armadura pesada')
ok(isProficientWithWeapon(clerigoProtetor, itemById('espada-longa')!),
  'Clerigo Protetor e proficiente com armas marciais')
ok(!isProficientWithWeapon(clerigoTaumaturgo, itemById('espada-longa')!),
  'Clerigo Taumaturgo NAO e proficiente com armas marciais')
ok(proficiencyGroups(clerigoProtetor).armaduras.some((a) => a.startsWith('Pesada')),
  'a aba de Pericias lista a armadura pesada da Ordem Divina')
// A lista da aba de Pericias e o calculo de proficiencia nao podem divergir
for (const cat of ['leve', 'média', 'pesada'] as const) {
  const rotulo = cat === 'leve' ? 'Leve' : cat === 'média' ? 'Média' : 'Pesada'
  const armadura = ARMORS.find((a) => a.armor?.category === cat)!
  ok(isProficientWithArmor(clerigoProtetor, armadura)
    === proficiencyGroups(clerigoProtetor).armaduras.some((a) => a === rotulo || a.startsWith(`${rotulo} (`)),
    `armadura ${rotulo}: aviso de proficiencia e lista da ficha concordam`)
}
// Ladino continua limitado a marciais com Leve ou Acuidade
const ladino: Character = newCharacter({ classId: 'ladino', level: 1 })
ok(isProficientWithWeapon(ladino, itemById('espada-curta')!), 'Ladino usa espada curta (Leve/Acuidade)')
ok(!isProficientWithWeapon(ladino, itemById('espada-grande')!), 'Ladino nao usa espada grande')
// Colegio da Bravura concede armadura media e escudos no nivel 3
const bardoBravura: Character = newCharacter({
  classId: 'bardo', level: 3, subclassId: 'bravura', hpRolls: [null, null],
})
ok(isProficientWithArmor(bardoBravura, itemById('brunea')! ?? ARMORS.find((a) => a.armor?.category === 'média')!),
  'Bardo do Colegio da Bravura usa armadura media')

console.log('\n== Magias sempre preparadas de subclasse ==')
// Toda magia declarada nas subclasses precisa existir no catalogo
for (const c of CLASSES) {
  for (const s of c.subclasses) {
    for (const m of s.alwaysPrepared ?? []) {
      ok(!!spellById(m.spellId), `${c.name}/${s.name}: magia "${m.spellId}" existe no catalogo`)
    }
    for (const g of s.choices ?? []) {
      for (const o of g.options) {
        for (const m of o.alwaysPrepared ?? []) {
          ok(!!spellById(m.spellId), `${c.name}/${s.name}/${o.name}: magia "${m.spellId}" existe`)
        }
      }
    }
  }
}
const clerigoVida: Character = newCharacter({
  classId: 'clerigo', level: 5, subclassId: 'vida', hpRolls: [null, null, null, null],
  classChoices: { 'ordem-divina': 'protetor' },
})
const dominioVida = alwaysPreparedSpells(clerigoVida).map((m) => m.spell.id)
ok(dominioVida.includes('bencao') && dominioVida.includes('curar-ferimentos'),
  'Dominio da Vida deixa Bencao e Curar Ferimentos sempre preparadas')
ok(dominioVida.includes('revivificar'), 'no nivel 5 o dominio acrescenta Revivificar')
ok(!dominioVida.includes('aura-de-vida'), 'as magias de nivel 7 ainda nao aparecem no nivel 5')
ok(preparedSpellIds({ ...clerigoVida, spellsPrepared: ['bencao', 'orientacao', 'comando'] }).length === 1,
  'magias de dominio e truques nao ocupam vaga no limite de preparadas')
// Bruxo: as magias do patrono tambem precisam aparecer
const bruxoInfernal: Character = newCharacter({
  classId: 'bruxo', level: 3, subclassId: 'infernal', hpRolls: [null, null],
})
const patrono = alwaysPreparedSpells(bruxoInfernal).map((m) => m.spell.id)
ok(patrono.includes('maos-flamejantes') && patrono.includes('sugestao'),
  'Patrono Infero deixa Maos Flamejantes e Sugestao sempre preparadas')
// Druida da Terra: o terreno escolhido define as magias
const druidaTerra: Character = newCharacter({
  classId: 'druida', level: 3, subclassId: 'terra', hpRolls: [null, null],
  classChoices: { 'ordem-primal': 'guardiao', 'terreno-druidico': 'polar' },
})
const terrenoPolar = alwaysPreparedSpells(druidaTerra).map((m) => m.spell.id)
ok(terrenoPolar.includes('raio-de-gelo') && terrenoPolar.includes('paralisar-pessoa'),
  'Circulo da Terra (Polar) prepara Raio de Gelo e Paralisar Pessoa')
ok(pendingChoices(newCharacter({ classId: 'druida', level: 3, subclassId: 'terra', hpRolls: [null, null] }))
  .some((c) => c.group.id === 'terreno-druidico'),
  'o terreno druidico aparece como escolha pendente ate ser feito')

console.log('\n== Formas de preparar magias (PHB 2024) ==')
const MODOS: Record<string, string> = {
  bardo: 'nivel-uma', bruxo: 'nivel-uma', feiticeiro: 'nivel-uma',
  clerigo: 'descanso-todas', druida: 'descanso-todas',
  paladino: 'descanso-uma', patrulheiro: 'descanso-uma',
  mago: 'grimorio',
}
for (const [classId, esperado] of Object.entries(MODOS)) {
  ok(preparationMode(newCharacter({ classId, level: 1 })) === esperado,
    `${classById(classId)!.name}: ${esperado}`)
}
ok(preparationMode(newCharacter({ classId: 'barbaro', level: 1 })) === null, 'Barbaro nao prepara magias')
// Clerigo escolhe entre TODA a lista da classe; o Mago so entre as do grimorio
const clerigoNv1 = newCharacter({ classId: 'clerigo', level: 1 })
ok(preparableSpells(clerigoNv1).length === SPELLS.filter((s) => s.classes.includes('clerigo') && s.level === 1).length,
  `Clerigo prepara entre todas as ${preparableSpells(clerigoNv1).length} magias de 1o circulo da classe`)
const magoComLivro: Character = newCharacter({
  classId: 'mago', level: 1, spellsKnown: ['misseis-magicos', 'escudo-arcano'],
})
ok(preparableSpells(magoComLivro).every((s) => magoComLivro.spellsKnown.includes(s.id)),
  'Mago so prepara magias que estao no grimorio')
// Bardo nivel 10 (Segredos Magicos) passa a alcancar outras listas
const bardo10: Character = newCharacter({ classId: 'bardo', level: 10, hpRolls: Array(9).fill(null) })
ok(spellListClasses(bardo10).includes('mago'), 'Bardo nivel 10 pode preparar magias de Mago (Segredos Magicos)')
ok(!spellListClasses({ ...bardo10, level: 9 }).includes('mago'), 'antes do nivel 10, so a lista de Bardo')
// Arcanum Mistico: o Bruxo escolhe uma magia de 6o a 9o circulo nos niveis 11, 13, 15 e 17
const bruxo11: Character = newCharacter({ classId: 'bruxo', level: 11, hpRolls: Array(10).fill(null) })
const arcanum = spellPickGroups(bruxo11).filter((g) => g.pick.id.startsWith('arcanum-mistico'))
ok(arcanum.length === 1 && arcanum[0].pick.spellLevel === 6,
  `no nivel 11 abre so o Arcanum Mistico de 6o circulo (${arcanum.length} grupo)`)
ok(arcanum[0].options.length > 0 && arcanum[0].options.every((s) => s.level === 6 && s.classes.includes('bruxo')),
  `oferece ${arcanum[0].options.length} magias de Bruxo de 6o circulo`)
ok(spellPickGroups(newCharacter({ classId: 'bruxo', level: 17, hpRolls: Array(16).fill(null) }))
  .filter((g) => g.pick.id.startsWith('arcanum-mistico')).length === 4,
  'no nivel 17 os quatro Arcanums estao disponiveis')
// Segredos Magicos do Colegio do Conhecimento: qualquer circulo acessivel, sempre preparadas
const bardoLore: Character = newCharacter({
  classId: 'bardo', level: 6, subclassId: 'conhecimento', hpRolls: Array(5).fill(null),
})
const segredos = spellPickGroups(bardoLore).find((g) => g.pick.id === 'conhecimento-segredos-magicos')
ok(!!segredos && segredos.options.some((s) => s.classes.includes('mago')),
  'Segredos Magicos alcanca a lista de Mago')
ok(!!segredos && segredos.options.every((s) => s.level <= maxSpellLevel(bardoLore)),
  'Segredos Magicos so oferece circulos para os quais o Bardo tem espacos')
const bardoComSegredos: Character = {
  ...bardoLore, spellPicks: { 'conhecimento-segredos-magicos': ['bola-de-fogo', 'curar-ferimentos'] },
}
ok(alwaysPreparedSpells(bardoComSegredos).some((m) => m.spell.id === 'bola-de-fogo'),
  'as magias dos Segredos Magicos ficam sempre preparadas')
ok(!innateSpells(bardoComSegredos).some((m) => m.spell.id === 'bola-de-fogo'),
  'e nao entram como magias inatas com usos gratis')

console.log('\n== Subclasses conjuradoras (1/3 de conjurador) ==')
const cavaleiro: Character = newCharacter({
  classId: 'guerreiro', level: 3, subclassId: 'cavaleiro-arcano', hpRolls: [null, null],
})
const scCavaleiro = spellcasting(cavaleiro)
ok(!!scCavaleiro && scCavaleiro.ability === 'int', 'Cavaleiro Mistico conjura com Inteligencia')
ok(spellSlots(cavaleiro)[0] === 2, `2 espacos de 1o circulo no nivel 3 (${spellSlots(cavaleiro)[0]})`)
ok(preparedLimit(cavaleiro) === 3, `3 magias preparadas no nivel 3 (${preparedLimit(cavaleiro)})`)
ok(cantripLimit(cavaleiro) === 2, `2 truques no nivel 3 (${cantripLimit(cavaleiro)})`)
ok(preparableSpells(cavaleiro).every((s) => s.classes.includes('mago')), 'so magias da lista de Mago')
ok(preparationMode(cavaleiro) === 'nivel-uma', 'Cavaleiro Mistico troca uma magia por nivel')
ok(spellcasting(newCharacter({ classId: 'guerreiro', level: 2 })) === null,
  'Guerreiro sem subclasse conjuradora nao tem conjuracao')
const trapaceiro: Character = newCharacter({
  classId: 'ladino', level: 3, subclassId: 'trapaceiro-arcano', hpRolls: [null, null],
})
ok(alwaysPreparedSpells(trapaceiro).some((m) => m.spell.id === 'maos-magicas'),
  'Trapaceiro Arcano sempre tem Maos Magicas')
ok(cantripLimit(trapaceiro) + 1 === 3, 'Trapaceiro Arcano: 2 truques a escolher + Maos Magicas = 3')

console.log('\n== Invocacoes Misticas do Bruxo (com os Pactos) ==')
const bruxo1: Character = newCharacter({ classId: 'bruxo', level: 1 })
const invocacoes = featurePickGroups(bruxo1).find((g) => g.pick.id === 'invocacoes-misticas')
ok(!!invocacoes, 'Bruxo nv1 ja tem o grupo de Invocacoes Misticas')
ok(invocacoes?.count === 1, `1 invocacao no nivel 1 (${invocacoes?.count})`)
ok(['pacto-da-lamina', 'pacto-da-corrente', 'pacto-do-tomo']
  .every((id) => invocacoes!.options.some((o) => o.id === id)), 'os tres Pactos aparecem entre as opcoes')
ok(invocacoes!.pending, 'com nada escolhido o grupo fica pendente')
ok(!invocacoes!.options.some((o) => o.id === 'lamina-sedenta'),
  'invocacoes de nivel alto nao aparecem no nivel 1')
const bruxo5 = newCharacter({
  classId: 'bruxo', level: 5, hpRolls: [null, null, null, null],
  featureChoices: { 'invocacoes-misticas': ['pacto-da-lamina', 'visao-diabolica', 'explosao-agonizante'] },
})
const inv5 = featurePickGroups(bruxo5).find((g) => g.pick.id === 'invocacoes-misticas')!
ok(inv5.count === 5, `5 invocacoes no nivel 5 (${inv5.count})`)
ok(inv5.options.some((o) => o.id === 'lamina-sedenta'), 'Lamina Sedenta liberada no nivel 5')
ok(!inv5.options.some((o) => o.id === 'lamina-devoradora'), 'Lamina Devoradora so no nivel 12')
ok(!featureOptionBlocked(inv5.options.find((o) => o.id === 'lamina-sedenta')!, inv5.chosen),
  'Lamina Sedenta liberada porque o Pacto da Lamina esta escolhido')
ok(featureOptionBlocked(inv5.options.find((o) => o.id === 'lamina-sedenta')!, ['visao-diabolica']),
  'sem o Pacto da Lamina, a Lamina Sedenta fica bloqueada')

console.log('\n== Manobras do Mestre de Batalha ==')
const mestre: Character = newCharacter({
  classId: 'guerreiro', level: 3, subclassId: 'mestre-de-batalha', hpRolls: [null, null],
})
const manobras = featurePickGroups(mestre).find((g) => g.pick.id === 'manobras')
ok(!!manobras, 'escolher Mestre de Batalha ja libera o grupo de Manobras')
ok(manobras?.count === 3, `3 manobras no nivel 3 (${manobras?.count})`)
ok(manobras?.die === 'd8', `Dado de Superioridade d8 no nivel 3 (${manobras?.die})`)
ok(manobras?.resourceId === 'dados-de-superioridade', 'as manobras gastam Dados de Superioridade')
const dadosSup = characterResources(mestre).find((r) => r.id === 'dados-de-superioridade')
ok(dadosSup?.max === 4, `4 Dados de Superioridade no nivel 3 (${dadosSup?.max})`)
ok(dadosSup?.recharge === 'curto', 'os Dados de Superioridade voltam em descanso curto')
const mestre10 = newCharacter({
  classId: 'guerreiro', level: 10, subclassId: 'mestre-de-batalha', hpRolls: Array(9).fill(null),
})
const manobras10 = featurePickGroups(mestre10).find((g) => g.pick.id === 'manobras')!
ok(manobras10.count === 7 && manobras10.die === 'd10', 'nivel 10: 7 manobras e dado d10')
const campeao = newCharacter({ classId: 'guerreiro', level: 3, subclassId: 'campeao', hpRolls: [null, null] })
ok(!featurePickGroups(campeao).some((g) => g.pick.id === 'manobras'), 'Campeao nao tem Manobras')

console.log('\n== Assistente de evolucao: subclasse ja libera as escolhas dela ==')
const guerreiro2: Character = newCharacter({ classId: 'guerreiro', level: 2, hpRolls: [null] })
const rMestre = levelUpSummary(guerreiro2, 3, 'guerreiro')!
ok(rMestre.needsSubclass, 'nivel 3 de Guerreiro pede a subclasse')
// É o que o assistente faz ao clicar em "Mestre de Batalha": o rascunho ja tem a subclasse.
const draftMestre = withLevelIn(guerreiro2, 'guerreiro', 'mestre-de-batalha')
const manobrasNoWizard = featurePickGroups(draftMestre).find((g) => g.pick.id === 'manobras')
ok(!!manobrasNoWizard && manobrasNoWizard.pending && manobrasNoWizard.count === 3,
  'escolher Mestre de Batalha no assistente ja pede as 3 manobras')
ok(!featurePickGroups(withLevelIn(guerreiro2, 'guerreiro', 'campeao')).some((g) => g.pick.id === 'manobras'),
  'escolher Campeao nao pede manobras')
// Bruxo 1 -> 2: o total de invocacoes vai de 1 para 3, entao faltam 2.
const bruxoSubindo = withLevelIn(
  newCharacter({ classId: 'bruxo', level: 1, featureChoices: { 'invocacoes-misticas': ['pacto-do-tomo'] } }),
  'bruxo',
)
const invSubindo = featurePickGroups(bruxoSubindo).find((g) => g.pick.id === 'invocacoes-misticas')!
ok(invSubindo.count === 3 && invSubindo.chosen.length === 1 && invSubindo.pending,
  'subir para Bruxo 2 pede 2 invocacoes novas e mantem a ja escolhida')

console.log('\n== Metamagia e Canalizar Divindade ==')
const feiticeiro = newCharacter({ classId: 'feiticeiro', level: 2, hpRolls: [null] })
const metamagia = featurePickGroups(feiticeiro).find((g) => g.pick.id === 'metamagia')!
ok(metamagia.count === 2, `2 opcoes de Metamagia no nivel 2 (${metamagia.count})`)
ok(metamagia.options.find((o) => o.id === 'acelerada')?.cost === 2,
  'Magia Acelerada custa 2 Pontos de Feiticaria')
const clerigoCD = newCharacter({ classId: 'clerigo', level: 3, subclassId: 'vida', hpRolls: [null, null] })
const gruposCD = featurePickGroups(clerigoCD).filter((g) => g.resourceId === 'canalizar-divindade')
ok(gruposCD.length === 2, 'Clerigo nv3 tem as opcoes basicas de Canalizar Divindade e a do dominio')
ok(gruposCD.every((g) => !g.pending), 'opcoes concedidas nao geram escolha pendente')
ok(gruposCD.some((g) => g.active.some((o) => o.id === 'preservar-a-vida')),
  'Dominio da Vida traz Preservar a Vida como uso de Canalizar Divindade')

console.log('\n== Multiclasse ==')
const gm: Character = newCharacter({
  classId: 'guerreiro', level: 5, hpRolls: [null, null, null, null],
  baseAbilities: { for: 15, des: 14, con: 14, int: 10, sab: 10, car: 15 },
})
const gmBruxo = withLevelIn(gm, 'bruxo')
ok(gmBruxo.level === 6, `nivel total 6 (${gmBruxo.level})`)
ok(classLevel(gmBruxo, 'guerreiro') === 5 && classLevel(gmBruxo, 'bruxo') === 1,
  'Guerreiro 5 / Bruxo 1')
ok(classLabel(gmBruxo) === 'Guerreiro 5 / Bruxo 1', `rotulo "${classLabel(gmBruxo)}"`)
ok(isMulticlass(gmBruxo), 'a ficha passa a ser multiclasse')
ok(proficiencyBonus(gmBruxo.level) === 3, 'bonus de proficiencia pelo nivel TOTAL')
// PV: 5 niveis de d10 + 1 de d8, todos com +2 de CON
ok(maxHp(gmBruxo) === maxHp(gm) + 5 + 2, `o nivel de Bruxo soma a media do d8 + CON (${maxHp(gmBruxo)})`)
ok(pactSlots(gmBruxo)?.count === 1, 'ganha 1 espaco de Pacto de Bruxo 1')
ok(saves(gmBruxo).find((s) => s.ability === 'for')!.proficient,
  'salvaguardas continuam sendo as da classe inicial')
ok(!saves(gmBruxo).find((s) => s.ability === 'car')!.proficient,
  'a classe nova NAO concede salvaguardas novas')
ok(cantripLimit(gmBruxo) === 2, `2 truques de Bruxo (${cantripLimit(gmBruxo)})`)
ok(spellListClasses(gmBruxo).includes('bruxo'), 'a lista de Bruxo passa a valer')

const magoPaladino = withLevelIn(
  newCharacter({ classId: 'mago', level: 6, hpRolls: Array(5).fill(null) }), 'paladino',
)
// Nivel de conjurador = 6 (mago) + 0 (paladino 1, metade arredondada para baixo)
ok(spellSlots(magoPaladino)[2] === 3 && spellSlots(magoPaladino)[3] === 0,
  'Mago 6 / Paladino 1 mantem os espacos de conjurador 6')
const magoPal2 = withLevelIn(magoPaladino, 'paladino')
// Nivel de conjurador = 6 + 1 = 7
ok(spellSlots(magoPal2)[3] === 1 && spellSlots(magoPal2)[0] === 4,
  'Paladino 2 sobe o nivel de conjurador para 7')
ok((preparedLimit(magoPal2) ?? 0) > (preparedLimit(magoPaladino) ?? 0),
  'o limite de preparadas soma o das duas classes')

const fraco = newCharacter({
  classId: 'guerreiro', level: 3, hpRolls: [null, null],
  baseAbilities: { for: 15, des: 10, con: 12, int: 10, sab: 10, car: 10 },
})
ok(multiclassBlockers(fraco, 'mago').includes('int'), 'Mago exige INT 13 para multiclassear')
ok(multiclassBlockers(fraco, 'barbaro').length === 0, 'Barbaro liberado com FOR 15')
const opcoes = multiclassOptions(fraco)
ok(opcoes.find((o) => o.cls.id === 'guerreiro')!.jaTem, 'a classe atual aparece como ja possuida')
ok(opcoes.find((o) => o.cls.id === 'mago')!.faltando.length > 0, 'Mago aparece bloqueado')
const guerreiroBruxoProf = withLevelIn(gm, 'bruxo')
ok(!armorTraining(guerreiroBruxoProf).includes('Pesada') === false,
  'o Guerreiro inicial mantem armadura Pesada')
ok(featurePickGroups(guerreiroBruxoProf).some((g) => g.pick.id === 'invocacoes-misticas'),
  'o nivel 1 de Bruxo ja pede a Invocacao Mistica')

console.log('\n== Fichas antigas (sem os campos novos) ==')
const antiga = JSON.parse(JSON.stringify(newCharacter({ classId: 'guerreiro' }))) as Character
delete (antiga as Partial<Character>).speciesChoices
delete (antiga as Partial<Character>).classChoices
delete (antiga as Partial<Character>).originFeats
ok(normalizeCharacter(antiga).originFeats.length === 0, 'normalizeCharacter preenche os campos que faltam')
ok(characterFeats(antiga).length > 0 && armorClass(antiga).total > 0, 'ficha antiga continua calculando sem quebrar')

console.log('\n== Itens usaveis e cargas ==')
// As cargas saem do proprio texto do livro, entao nao ha numero duplicado nos dados.
const comCargas = MAGIC_ITEMS.filter((i) => !!cargasDoItem(i))
ok(comCargas.length > 20, `${comCargas.length} itens magicos declaram cargas`)
for (const i of comCargas) {
  const c = cargasDoItem(i)!
  ok(c.max > 0 && c.max <= 100, `${i.name}: ${c.max} carga(s) num intervalo plausivel`)
}
const varinhaDeMisseis = MAGIC_ITEMS.find((i) => i.id === 'varinha-de-misseis-magicos')
if (varinhaDeMisseis) {
  const c = cargasDoItem(varinhaDeMisseis)!
  ok(c.max === 7, `Varinha de Misseis Magicos tem 7 cargas (${c.max})`)
  ok(!!c.recarga && /carga/i.test(c.recarga), `recarga lida do livro: ${c.recarga?.slice(0, 40)}`)
}
// "Estas lentes ... têm 3 cargas": o plural acentuado nao pode escapar, senao o
// numero do CUSTO ("Com 1 carga, voce conjura...") viraria o total do item.
const lentes = MAGIC_ITEMS.find((i) => i.id === 'olhos-do-encantamento')
ok(!lentes || cargasDoItem(lentes)?.max === 3, `Olhos do Encantamento: 3 cargas (${lentes && cargasDoItem(lentes)?.max})`)
// "gastar 1 das 3 cargas dele" tambem declara o total.
const tresDesejos = MAGIC_ITEMS.find((i) => i.id === 'anel-dos-tres-desejos')
ok(!tresDesejos || cargasDoItem(tresDesejos)?.max === 3, `Anel dos Tres Desejos: 3 cargas (${tresDesejos && cargasDoItem(tresDesejos)?.max})`)
// Total rolado ("a arma tem 1d3 cargas") fica sem barra: nao ha maximo fixo.
const laminaDaSorte = MAGIC_ITEMS.find((i) => i.id === 'lamina-da-sorte')
ok(!laminaDaSorte || !cargasDoItem(laminaDaSorte), 'total rolado (1d3 cargas) nao vira barra de cargas')

// Item comum nao tem carga nenhuma para controlar.
ok(!cargasDoItem(itemById('espada-longa')!), 'Espada Longa nao tem cargas')
ok(!ehUsavel(itemById('espada-longa')!), 'Espada Longa nao e um item de uso')
const pocao = MAGIC_ITEMS.find((i) => i.magic?.category === 'Poção')
ok(!!pocao && ehConsumivel(pocao), `pocao e consumivel (${pocao?.name})`)
ok(!!pocao && ehUsavel(pocao), 'pocao aparece com botao de usar')
ok(!ehConsumivel(itemById('espada-longa')!), 'arma nao e consumivel')

console.log('\n== Dado sugerido pelo texto ==')
ok(dadosNoTexto(['sofre 8d6 de dano de fogo']) === '8d6', 'le o dado do corpo do texto')
ok(dadosNoTexto(['nenhum dado aqui']) === undefined, 'texto sem dado nao sugere rolagem')
// O acrescimo por circulo superior nao pode virar a rolagem principal.
ok(dadosNoTexto(['cura o alvo.', 'Usando um Espaço de Magia de Círculo Superior. Some 1d8.']) === undefined,
  'o dado do upcast nao vira a rolagem base')
const bolaDeFogo = spellById('bola-de-fogo')
ok(!!bolaDeFogo && dadosDaMagia(bolaDeFogo) === '8d6', `Bola de Fogo sugere 8d6 (${bolaDeFogo && dadosDaMagia(bolaDeFogo)})`)

console.log('\n== Qual espaco de magia gastar ==')
// 4 espacos de 1o, 3 de 2o, 2 de 3o — com um de 2o ja gasto.
const totais = [4, 3, 2]
ok(JSON.stringify(circulosDisponiveis(1, totais, {})) === '[1,2,3]',
  'magia de 1o circulo pode subir para o 2o e o 3o')
ok(JSON.stringify(circulosDisponiveis(3, totais, {})) === '[3]', 'magia de 3o so cabe no 3o')
ok(JSON.stringify(circulosDisponiveis(1, totais, { 1: 4 })) === '[2,3]',
  'circulo esgotado sai da lista')
ok(circulosDisponiveis(1, totais, { 1: 4, 2: 3, 3: 2 }).length === 0,
  'sem espacos, nao ha por onde conjurar')
ok(JSON.stringify(circulosDisponiveis(0, totais, {})) === '[1,2,3]',
  'truque nao trava a lista em zero')

console.log('\n== Gesto lateral entre as abas ==')
// O gesto so vale quando e claramente horizontal: rolar a pagina nao pode trocar de aba.
ok(definirEixo(40, 5) === 'horizontal', 'arrasto reto para o lado e horizontal')
ok(definirEixo(5, 40) === 'vertical', 'arrasto reto para baixo e vertical (fica com a rolagem)')
ok(definirEixo(30, 30) === 'vertical', 'na diagonal empatada a rolagem vence')
ok(definirEixo(FOLGA - 1, 0) === 'indefinido', 'antes da folga o gesto ainda nao decidiu')
ok(definirEixo(0, FOLGA - 1) === 'indefinido', 'movimento minusculo nao vira rolagem nem troca')
ok(definirEixo(-40, 5) === 'horizontal', 'o eixo nao depende do sentido')

// Os dois sentidos trocam de aba: para a esquerda avanca, para a direita volta.
ok(decidirTroca(-LIMIAR, 300) === 1, 'arrastar para a esquerda traz a proxima aba')
ok(decidirTroca(LIMIAR, 300) === -1, 'arrastar para a direita traz a aba anterior')
ok(decidirTroca(-(LIMIAR - 1), 3000) === 0, 'arrasto curto e lento nao troca de aba')
ok(decidirTroca(-30, 40) === 1, 'um piparote rapido troca mesmo sem chegar ao limiar')
ok(decidirTroca(30, 40) === -1, 'o piparote tambem funciona no sentido contrario')
ok(decidirTroca(0, 0) === 0, 'toque parado nao troca de aba')

// Nas pontas o conteudo cede pouco — o elastico avisa que a lista acabou.
ok(deslocamento(80, true, true) === 80, 'com vizinho dos dois lados o conteudo segue o dedo')
ok(deslocamento(80, false, true) === 20, `sem aba anterior o arrasto e freado (${deslocamento(80, false, true)})`)
ok(deslocamento(-80, true, false) === -20, 'sem proxima aba o arrasto tambem e freado')
ok(deslocamento(-80, false, true) === -80, 'puxar para o lado que TEM aba nao e freado')

// A navegacao nao circula: passar do fim nao volta para o comeco.
ok(proximoIndice(0, -1, 5) === 0, 'na primeira aba, voltar nao sai do lugar')
ok(proximoIndice(4, 1, 5) === 4, 'na ultima aba, avancar nao sai do lugar')
ok(proximoIndice(2, 1, 5) === 3 && proximoIndice(2, -1, 5) === 1, 'no meio anda para os dois lados')

console.log('\n== Notas de atualizacao ==')
// A primeira entrada manda: e dela que scripts/versao.cjs tira a versao do app.
ok(PATCH_NOTES.length > 0, `ha ${PATCH_NOTES.length} nota(s) de atualizacao`)
ok(APP_VERSION === PATCH_NOTES[0].version, `APP_VERSION segue a nota mais nova (${APP_VERSION})`)
ok(notaAtual()?.version === APP_VERSION, 'notaAtual() devolve a nota da versao que esta rodando')

const versaoNumero = (v: string) => v.split('.').map(Number).reduce((a, n) => a * 1000 + n, 0)
for (let i = 0; i < PATCH_NOTES.length; i++) {
  const n = PATCH_NOTES[i]
  ok(/^\d+\.\d+\.\d+$/.test(n.version), `v${n.version}: versao no formato x.y.z`)
  ok(/^\d{4}-\d{2}-\d{2}$/.test(n.date), `v${n.version}: data no formato aaaa-mm-dd`)
  ok(n.titulo.length > 0 && n.resumo.length > 0, `v${n.version}: tem titulo e resumo`)
  ok(n.destaques.length > 0 && n.destaques.every((d) => d.icone && d.texto),
    `v${n.version}: ${n.destaques.length} destaque(s), todos com icone e texto`)
  if (i > 0) {
    ok(versaoNumero(PATCH_NOTES[i - 1].version) > versaoNumero(n.version),
      `v${n.version} vem depois de v${PATCH_NOTES[i - 1].version} na lista`)
  }
}
ok(new Set(PATCH_NOTES.map((n) => n.version)).size === PATCH_NOTES.length, 'nao ha versao repetida')
ok(formatarData('2026-08-02') === '2 de agosto de 2026', `formatarData: ${formatarData('2026-08-02')}`)

console.log(falhas === 0 ? '\n>>> TODOS OS TESTES DE REGRAS PASSARAM' : `\n>>> ${falhas} FALHA(S) NAS REGRAS`)
if (falhas > 0) process.exitCode = 1
