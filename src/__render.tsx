// Teste de renderizacao: monta cada tela e detecta erros de runtime. Nao faz parte do app.
import { renderToString } from 'react-dom/server'
import type { Character } from './types'
import { newCharacter, useStore } from './store/store'
import App from './App'
import { CharacterCreator } from './screens/CharacterCreator'
import { CharacterSheet } from './screens/CharacterSheet'
import { CharacterList } from './screens/CharacterList'
import { CloudTab } from './screens/CloudTab'
import { LevelUpWizard } from './screens/LevelUpWizard'
import { SheetTab } from './screens/tabs/SheetTab'
import { ActionsTab } from './screens/tabs/ActionsTab'
import { ItemsTab } from './screens/tabs/ItemsTab'
import { SpellsTab } from './screens/tabs/SpellsTab'
import { DiceRollerSheet } from './components/DiceRoller'
import { CLASSES } from './data/classes'
import { SPELLS } from './data/spells'

// Roda no Node via scripts/run-tests.cjs; o projeto não depende de @types/node.
declare const process: { exitCode?: number }

let falhas = 0
const tenta = (nome: string, fn: () => string) => {
  try {
    const html = fn()
    if (!html || html.length < 20) { falhas++; console.log(`  X ${nome}: saida vazia`) }
    else console.log(`  . ${nome} (${html.length} bytes)`)
  } catch (e) {
    falhas++
    console.log(`  X ${nome}: ${(e as Error).message}`)
  }
}

// Personagem completo: guerreiro nv12 com equipamento, itens magicos e subclasse
const guerreiro: Character = newCharacter({
  name: 'Thalia', classId: 'guerreiro', speciesId: 'anao', backgroundId: 'soldado',
  subclassId: 'campeao', level: 12,
  baseAbilities: { for: 15, des: 14, con: 14, int: 10, sab: 12, car: 8 },
  backgroundBonuses: { for: 2, con: 1 },
  hpRolls: Array(11).fill(null),
  skillProfs: ['atletismo', 'intimidacao', 'percepcao'],
  asiChoices: [
    { level: 4, type: 'asi', abilities: { for: 2 } },
    { level: 6, type: 'feat', featId: 'atleta', abilities: { for: 1 } },
    { level: 8, type: 'asi', abilities: { con: 1, des: 1 } },
  ],
  inventory: [
    { uid: '1', itemId: 'cota-de-malha', qty: 1, equipped: true, bonus: 1 },
    { uid: '2', itemId: 'escudo', qty: 1, equipped: true },
    { uid: '3', itemId: 'espada-longa', qty: 1, equipped: true, bonus: 2 },
    { uid: '4', itemId: 'arco-longo', qty: 1, equipped: true },
    { uid: '5', itemId: 'anel-de-protecao', qty: 1, equipped: true, attuned: true },
    { uid: '6', itemId: 'pocao-de-cura', qty: 3 },
  ],
})

// Conjurador completo com magias em varios niveis
const magoSpells = SPELLS.filter((s) => s.classes.includes('mago')).slice(0, 25).map((s) => s.id)
const mago: Character = newCharacter({
  name: 'Elandor', classId: 'mago', speciesId: 'elfo', backgroundId: 'sabio',
  subclassId: 'evocador', level: 11,
  baseAbilities: { for: 8, des: 14, con: 14, int: 15, sab: 12, car: 10 },
  backgroundBonuses: { int: 2, con: 1 },
  hpRolls: Array(10).fill(null),
  spellsKnown: magoSpells, spellsPrepared: magoSpells,
  slotsSpent: { 1: 2, 3: 1 },
  inventory: [{ uid: '1', itemId: 'adaga', qty: 2, equipped: true }, { uid: '2', itemId: 'grimorio', qty: 1 }],
})

// Bruxo (espacos de pacto)
const bruxo: Character = newCharacter({
  name: 'Karn', classId: 'bruxo', level: 7, subclassId: 'infernal',
  spellsKnown: SPELLS.filter((s) => s.classes.includes('bruxo')).slice(0, 12).map((s) => s.id),
  spellsPrepared: SPELLS.filter((s) => s.classes.includes('bruxo')).slice(0, 12).map((s) => s.id),
  hpRolls: Array(6).fill(null),
})

useStore.setState({ characters: [guerreiro, mago, bruxo], activeId: guerreiro.id })

console.log('\n== Telas principais ==')
tenta('App (lista de fichas)', () => renderToString(<App />))
tenta('CharacterList', () => renderToString(<CharacterList onNew={() => {}} onOpen={() => {}} />))
tenta('CharacterCreator', () => renderToString(<CharacterCreator onDone={() => {}} onCancel={() => {}} />))
tenta('CloudTab', () => renderToString(<CloudTab online={true} />))
tenta('DiceRollerSheet', () => renderToString(<DiceRollerSheet onClose={() => {}} />))

console.log('\n== Ficha completa (guerreiro nv12) ==')
tenta('CharacterSheet', () => renderToString(<CharacterSheet char={guerreiro} onBack={() => {}} />))
tenta('SheetTab', () => renderToString(<SheetTab char={guerreiro} />))
tenta('ActionsTab', () => renderToString(<ActionsTab char={guerreiro} />))
tenta('ItemsTab', () => renderToString(<ItemsTab char={guerreiro} />))
tenta('SpellsTab (nao conjurador)', () => renderToString(<SpellsTab char={guerreiro} />))
tenta('LevelUpWizard nv13', () => renderToString(<LevelUpWizard char={guerreiro} onClose={() => {}} />))

console.log('\n== Conjuradores ==')
tenta('SpellsTab (mago nv11)', () => renderToString(<SpellsTab char={mago} />))
tenta('ActionsTab (mago)', () => renderToString(<ActionsTab char={mago} />))
tenta('SheetTab (mago)', () => renderToString(<SheetTab char={mago} />))
tenta('LevelUpWizard (mago nv12)', () => renderToString(<LevelUpWizard char={mago} onClose={() => {}} />))
tenta('SpellsTab (bruxo - pacto)', () => renderToString(<SpellsTab char={bruxo} />))
tenta('LevelUpWizard (bruxo nv8)', () => renderToString(<LevelUpWizard char={bruxo} onClose={() => {}} />))

console.log('\n== Escolhas de especie e de classe ==')
// Golias/draconato com escolha pendente e com escolha feita; humano com talento extra
const goliasPendente: Character = newCharacter({
  name: 'Krag', classId: 'guerreiro', speciesId: 'golias', backgroundId: 'soldado',
})
const goliasCompleto: Character = {
  ...goliasPendente,
  speciesChoices: { 'dadiva-de-gigante': 'pedra' },
  classChoices: { 'estilo-de-luta': 'estilo-defesa' },
}
const draconato: Character = newCharacter({
  name: 'Vyx', classId: 'paladino', speciesId: 'draconato', backgroundId: 'nobre', level: 2,
  speciesChoices: { 'ancestral-draconico': 'vermelho' },
  classChoices: { 'estilo-de-luta': 'estilo-duelismo' },
  hpRolls: [null],
})
const humano: Character = newCharacter({
  name: 'Ana', classId: 'ladino', speciesId: 'humano', backgroundId: 'criminoso',
  originFeats: ['habilidoso'],
})
tenta('SheetTab (golias com escolha pendente)', () => renderToString(<SheetTab char={goliasPendente} />))
tenta('SheetTab (golias com dadiva e estilo)', () => renderToString(<SheetTab char={goliasCompleto} />))
tenta('SheetTab (draconato paladino nv2)', () => renderToString(<SheetTab char={draconato} />))
tenta('SheetTab (humano com talento de origem extra)', () => renderToString(<SheetTab char={humano} />))
tenta('CharacterSheet (editar escolhas)', () => renderToString(<CharacterSheet char={goliasPendente} onBack={() => {}} />))
tenta('LevelUpWizard (aasimar nv3: revelacao celestial)', () =>
  renderToString(<LevelUpWizard char={newCharacter({ classId: 'bardo', speciesId: 'aasimar', level: 2, hpRolls: [null] })} onClose={() => {}} />))

console.log('\n== Todas as 12 classes, do nivel 1 ao 20 ==')
for (const c of CLASSES) {
  let erros = 0
  for (let lv = 1; lv <= 20; lv++) {
    const ch: Character = newCharacter({
      classId: c.id, level: lv,
      subclassId: lv >= 3 ? c.subclasses[0].id : undefined,
      hpRolls: Array(Math.max(0, lv - 1)).fill(null),
      spellsKnown: SPELLS.filter((s) => s.classes.includes(c.id)).slice(0, 8).map((s) => s.id),
      spellsPrepared: SPELLS.filter((s) => s.classes.includes(c.id)).slice(0, 8).map((s) => s.id),
      inventory: [
        { uid: '1', itemId: 'espada-curta', qty: 1, equipped: true },
        { uid: '2', itemId: 'couro-batido', qty: 1, equipped: true },
      ],
    })
    try {
      renderToString(<SheetTab char={ch} />)
      renderToString(<ActionsTab char={ch} />)
      renderToString(<ItemsTab char={ch} />)
      renderToString(<SpellsTab char={ch} />)
      if (lv < 20) renderToString(<LevelUpWizard char={ch} onClose={() => {}} />)
    } catch (e) {
      erros++
      if (erros === 1) console.log(`  X ${c.name} nv${lv}: ${(e as Error).message}`)
    }
  }
  if (erros === 0) console.log(`  . ${c.name}: niveis 1-20 renderizam`)
  else falhas += erros
}

console.log(falhas === 0 ? '\n>>> RENDERIZACAO OK' : `\n>>> ${falhas} FALHA(S) DE RENDERIZACAO`)
if (falhas > 0) process.exitCode = 1
