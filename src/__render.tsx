// Teste de renderizacao: monta cada tela e detecta erros de runtime. Nao faz parte do app.
import { renderToString } from 'react-dom/server'
import type { Character } from './types'
import { newCharacter, useStore } from './store/store'
import App from './App'
import { CharacterCreator } from './screens/CharacterCreator'
import { CharacterSheet } from './screens/CharacterSheet'
import { CharacterList } from './screens/CharacterList'
import { CloudTab } from './screens/CloudTab'
import { PatchNotes, VersionBadge } from './screens/PatchNotes'
import { APP_VERSION, PATCH_NOTES } from './data/patch-notes'
import { LevelUpWizard } from './screens/LevelUpWizard'
import { SheetTab } from './screens/tabs/SheetTab'
import { SkillsTab } from './screens/tabs/SkillsTab'
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

/** Como `tenta`, mas exige que o HTML contenha (e não contenha) certos trechos. */
const exige = (nome: string, fn: () => string, contem: string[], naoContem: string[] = []) => {
  try {
    const html = fn()
    const faltando = contem.filter((t) => !html.includes(t))
    const sobrando = naoContem.filter((t) => html.includes(t))
    if (faltando.length || sobrando.length) {
      falhas++
      console.log(`  X ${nome}: falta [${faltando.join(', ')}] sobra [${sobrando.join(', ')}]`)
    } else console.log(`  . ${nome}`)
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
tenta('CharacterList', () => renderToString(<CharacterList onNew={() => {}} onOpen={() => {}} onNovidades={() => {}} />))
tenta('CharacterCreator', () => renderToString(<CharacterCreator onDone={() => {}} onCancel={() => {}} />))
tenta('CloudTab', () => renderToString(<CloudTab online={true} />))
tenta('DiceRollerSheet', () => renderToString(<DiceRollerSheet onClose={() => {}} />))

// Novidades: todas as versoes na tela, a mais nova em cima e marcada como atual.
exige('PatchNotes (todas as versoes)',
  () => renderToString(<PatchNotes />),
  [...PATCH_NOTES.map((n) => `v${n.version}`), PATCH_NOTES[0].titulo, 'versão atual'])
exige('VersionBadge (versao nunca vista mostra o selo)',
  () => renderToString(<VersionBadge onClick={() => {}} />), [`v${APP_VERSION}`, '✨'])
tenta('PatchNotes (ordem: a versao atual vem primeiro)', () => {
  const html = renderToString(<PatchNotes />)
  const posicoes = PATCH_NOTES.map((n) => html.indexOf(`v${n.version}`))
  const ausente = posicoes.findIndex((p) => p < 0)
  if (ausente >= 0) throw new Error(`v${PATCH_NOTES[ausente].version} nao aparece na tela`)
  for (let i = 1; i < posicoes.length; i++) {
    if (posicoes[i] < posicoes[i - 1]) throw new Error(`v${PATCH_NOTES[i].version} aparece antes da anterior`)
  }
  return html
})

console.log('\n== Ficha completa (guerreiro nv12) ==')
tenta('CharacterSheet', () => renderToString(<CharacterSheet char={guerreiro} onBack={() => {}} />))
tenta('SheetTab', () => renderToString(<SheetTab char={guerreiro} />))
tenta('SkillsTab (pericias e proficiencias)', () => renderToString(<SkillsTab char={guerreiro} />))
tenta('ActionsTab', () => renderToString(<ActionsTab char={guerreiro} />))
tenta('ItemsTab', () => renderToString(<ItemsTab char={guerreiro} />))
tenta('SpellsTab (nao conjurador)', () => renderToString(<SpellsTab char={guerreiro} />))
tenta('LevelUpWizard nv13', () => renderToString(<LevelUpWizard char={guerreiro} onClose={() => {}} />))

// Abas com navegacao lateral: papeis de acessibilidade e atalho para as vizinhas.
exige('CharacterSheet (abas navegaveis)',
  () => renderToString(<CharacterSheet char={guerreiro} onBack={() => {}} />),
  ['role="tablist"', 'role="tab"', 'role="tabpanel"', 'aria-selected="true"', 'aria-controls="painel-ficha"',
    'Perícias ›',       // a aba seguinte fica a um clique (e a um arrasto)
    'tab-panel'])
// A ficha abre na primeira aba, entao nao ha vizinha a esquerda para oferecer.
exige('CharacterSheet (primeira aba nao oferece anterior)',
  () => renderToString(<CharacterSheet char={guerreiro} onBack={() => {}} />),
  ['disabled'], ['‹ '])

console.log('\n== Conjuradores ==')
tenta('SpellsTab (mago nv11)', () => renderToString(<SpellsTab char={mago} />))
tenta('ActionsTab (mago)', () => renderToString(<ActionsTab char={mago} />))
tenta('SheetTab (mago)', () => renderToString(<SheetTab char={mago} />))
tenta('LevelUpWizard (mago nv12)', () => renderToString(<LevelUpWizard char={mago} onClose={() => {}} />))
tenta('SpellsTab (bruxo - pacto)', () => renderToString(<SpellsTab char={bruxo} />))
tenta('LevelUpWizard (bruxo nv8)', () => renderToString(<LevelUpWizard char={bruxo} onClose={() => {}} />))

// Clerigo com dominio: as magias de dominio precisam aparecer na aba de Magias
const clerigo: Character = newCharacter({
  name: 'Sera', classId: 'clerigo', speciesId: 'humano', backgroundId: 'acolito', level: 7,
  subclassId: 'vida', classChoices: { 'ordem-divina': 'protetor' },
  hpRolls: Array(6).fill(null),
  spellsKnown: ['chama-sagrada', 'orientacao', 'luz', 'comando', 'escudo-da-fe'],
  spellsPrepared: ['comando', 'escudo-da-fe'],
  inventory: [{ uid: '1', itemId: 'cota-de-malha', qty: 1, equipped: true }],
})
tenta('SpellsTab (clerigo nv7: magias de dominio)', () => renderToString(<SpellsTab char={clerigo} />))
tenta('ItemsTab (clerigo protetor com cota de malha)', () => renderToString(<ItemsTab char={clerigo} />))
tenta('SkillsTab (clerigo protetor)', () => renderToString(<SkillsTab char={clerigo} />))
tenta('LevelUpWizard (clerigo nv8)', () => renderToString(<LevelUpWizard char={clerigo} onClose={() => {}} />))

// Druida da Terra: as magias vem do terreno escolhido
const druida: Character = newCharacter({
  name: 'Faun', classId: 'druida', level: 5, subclassId: 'terra',
  classChoices: { 'ordem-primal': 'mago-primal', 'terreno-druidico': 'tropical' },
  hpRolls: Array(4).fill(null),
})
tenta('SpellsTab (druida do Circulo da Terra)', () => renderToString(<SpellsTab char={druida} />))
tenta('CharacterSheet (druida: escolha de terreno)', () => renderToString(<CharacterSheet char={druida} onBack={() => {}} />))

// Subclasses que concedem conjuracao (1/3 de conjurador)
const cavaleiro: Character = newCharacter({
  name: 'Ivor', classId: 'guerreiro', level: 8, subclassId: 'cavaleiro-arcano',
  classChoices: { 'estilo-de-luta': 'estilo-defesa' },
  hpRolls: Array(7).fill(null),
  spellsKnown: ['raio-de-gelo', 'toque-chocante', 'escudo-arcano', 'misseis-magicos'],
  spellsPrepared: ['escudo-arcano', 'misseis-magicos'],
})
const trapaceiro: Character = newCharacter({
  name: 'Fio', classId: 'ladino', level: 9, subclassId: 'trapaceiro-arcano',
  hpRolls: Array(8).fill(null),
})
tenta('SpellsTab (cavaleiro mistico nv8)', () => renderToString(<SpellsTab char={cavaleiro} />))
tenta('LevelUpWizard (cavaleiro mistico nv9)', () => renderToString(<LevelUpWizard char={cavaleiro} onClose={() => {}} />))
tenta('SpellsTab (trapaceiro arcano nv9)', () => renderToString(<SpellsTab char={trapaceiro} />))

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

// Guerreiro drow: nao conjura pela classe, mas a especie concede truque e magias
const drow: Character = newCharacter({
  name: 'Zirel', classId: 'guerreiro', speciesId: 'elfo', backgroundId: 'soldado', level: 5,
  speciesChoices: { 'linhagem-elfica': 'drow', 'sentidos-agucados': 'percepcao' },
  hpRolls: [null, null, null, null],
})
tenta('SpellsTab (guerreiro drow: magias de especie)', () => renderToString(<SpellsTab char={drow} />))

// Lista unica: magias de classe, de subclasse e de talento no mesmo cartao, por circulo.
const clerigoIniciado: Character = newCharacter({
  name: 'Miri', classId: 'clerigo', speciesId: 'humano', backgroundId: 'acolito', level: 5,
  subclassId: 'vida', classChoices: { 'ordem-divina': 'protetor' },
  originFeats: ['iniciado-em-magia'],
  hpRolls: Array(4).fill(null),
  spellsKnown: ['chama-sagrada', 'orientacao', 'comando'],
  spellsPrepared: ['comando'],
  spellPicks: { 'iniciado-em-magia-truques': ['reparar', 'luz'], 'iniciado-em-magia-magia': ['escudo-da-fe'] },
})
exige('SpellsTab (lista unica: classe + dominio + talento)',
  () => renderToString(<SpellsTab char={clerigoIniciado} />),
  [
    'Comando',            // preparada pela classe
    'Curar Ferimentos',   // sempre preparada pelo Dominio da Vida
    'Escudo da F',        // magia do talento, conjurada sem gastar espaco
    'sempre preparada', 'sem espa',
    '1º Nível', '2º Nível',
    'Uso gratuito 1 de Escudo da Fé',   // marcador do uso por descanso longo
  ],
  // A separacao por cartoes de origem sumiu: tudo vive na lista unica.
  ['Magias de Espécie e Talentos', 'Magias Sempre Preparadas'])

// A mesma magia vinda do dominio E do talento aparece uma unica vez.
const clerigoBencaoDupla: Character = {
  ...clerigoIniciado,
  spellPicks: { ...clerigoIniciado.spellPicks, 'iniciado-em-magia-magia': ['bencao'] },
}
tenta('SpellsTab (Bencao pelo dominio e pelo talento)', () => {
  const html = renderToString(<SpellsTab char={clerigoBencaoDupla} />)
  const vezes = html.split('>Bênção<').length - 1
  if (vezes !== 1) throw new Error(`Bencao aparece ${vezes}x na lista (esperado 1)`)
  if (!html.includes('Iniciado em Magia')) throw new Error('a origem do talento sumiu do rotulo')
  return html
})
tenta('SheetTab (guerreiro drow: linhagem na ficha)', () => renderToString(<SheetTab char={drow} />))
tenta('CharacterSheet (guerreiro drow)', () => renderToString(<CharacterSheet char={drow} onBack={() => {}} />))
tenta('CharacterSheet (editar escolhas)', () => renderToString(<CharacterSheet char={goliasPendente} onBack={() => {}} />))
tenta('LevelUpWizard (aasimar nv3: revelacao celestial)', () =>
  renderToString(<LevelUpWizard char={newCharacter({ classId: 'bardo', speciesId: 'aasimar', level: 2, hpRolls: [null] })} onClose={() => {}} />))

console.log('\n== Recursos de subclasse e multiclasse ==')
const mestreDeBatalha: Character = newCharacter({
  classId: 'guerreiro', level: 7, subclassId: 'mestre-de-batalha', hpRolls: Array(6).fill(null),
  featureChoices: { manobras: ['ataque-preciso', 'ataque-rasteira', 'aparar', 'resposta', 'finta'] },
  inventory: [{ uid: '1', itemId: 'espada-longa', qty: 1, equipped: true }],
})
tenta('ActionsTab (Mestre de Batalha com manobras)', () => renderToString(<ActionsTab char={mestreDeBatalha} />))
tenta('CharacterSheet (editar manobras)', () =>
  renderToString(<CharacterSheet char={mestreDeBatalha} onBack={() => {}} />))
tenta('LevelUpWizard (guerreiro nv2 -> escolher Mestre de Batalha)', () =>
  renderToString(<LevelUpWizard char={newCharacter({ classId: 'guerreiro', level: 2, hpRolls: [null] })} onClose={() => {}} />))

const bruxoPactos: Character = newCharacter({
  classId: 'bruxo', level: 5, hpRolls: Array(4).fill(null),
  featureChoices: { 'invocacoes-misticas': ['pacto-da-lamina', 'explosao-agonizante'] },
})
tenta('ActionsTab (bruxo com pactos)', () => renderToString(<ActionsTab char={bruxoPactos} />))
tenta('CharacterSheet (editar invocacoes)', () =>
  renderToString(<CharacterSheet char={bruxoPactos} onBack={() => {}} />))
tenta('LevelUpWizard (bruxo nv1: invocacao pendente)', () =>
  renderToString(<LevelUpWizard char={newCharacter({ classId: 'bruxo', level: 1 })} onClose={() => {}} />))

const feiticeiroMeta: Character = newCharacter({
  classId: 'feiticeiro', level: 10, hpRolls: Array(9).fill(null),
  featureChoices: { metamagia: ['acelerada', 'sutil', 'duplicada'] },
})
tenta('ActionsTab (feiticeiro com metamagia)', () => renderToString(<ActionsTab char={feiticeiroMeta} />))
tenta('ActionsTab (clerigo: canalizar divindade)', () => renderToString(
  <ActionsTab char={newCharacter({ classId: 'clerigo', level: 6, subclassId: 'luz', hpRolls: Array(5).fill(null) })} />,
))

const multi: Character = newCharacter({
  classId: 'guerreiro', level: 8, subclassId: 'campeao',
  baseAbilities: { for: 15, des: 14, con: 14, int: 10, sab: 10, car: 15 },
  hpRolls: Array(7).fill(null),
  classes: [
    { classId: 'guerreiro', subclassId: 'campeao', level: 5 },
    { classId: 'bruxo', subclassId: 'infernal', level: 3 },
  ],
  levelClasses: ['guerreiro', 'guerreiro', 'guerreiro', 'guerreiro', 'guerreiro', 'bruxo', 'bruxo', 'bruxo'],
  featureChoices: { 'invocacoes-misticas': ['pacto-da-lamina', 'explosao-agonizante', 'visao-diabolica'] },
  inventory: [{ uid: '1', itemId: 'espada-longa', qty: 1, equipped: true }],
})
for (const [nome, el] of [
  ['SheetTab', <SheetTab char={multi} />],
  ['SkillsTab', <SkillsTab char={multi} />],
  ['ActionsTab', <ActionsTab char={multi} />],
  ['ItemsTab', <ItemsTab char={multi} />],
  ['SpellsTab', <SpellsTab char={multi} />],
  ['CharacterSheet', <CharacterSheet char={multi} onBack={() => {}} />],
  ['LevelUpWizard', <LevelUpWizard char={multi} onClose={() => {}} />],
] as [string, JSX.Element][]) {
  tenta(`${nome} (Guerreiro 5 / Bruxo 3)`, () => renderToString(el))
}

console.log('\n== Todas as 12 classes, do nivel 1 ao 20 ==')
for (const c of CLASSES) {
  let erros = 0
  for (let lv = 1; lv <= 20; lv++) {
    const ch: Character = newCharacter({
      classId: c.id, level: lv,
      // Alterna entre todas as subclasses ao longo dos niveis para cobrir todas elas.
      subclassId: lv >= 3 ? c.subclasses[lv % c.subclasses.length].id : undefined,
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
      renderToString(<SkillsTab char={ch} />)
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
