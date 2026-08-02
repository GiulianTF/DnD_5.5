import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AbilityScores, Character, RollEntry } from '../types'
import { emptyScores } from '../engine/pointbuy'
import { emptyPurse, purseFromGold } from '../engine/money'
import { classById } from '../data/classes'
import { roll, rollHitDie } from '../engine/dice'
import { uid } from '../engine/uid'
import { abilityMods, characterResources, maxHp, pactSlots, preparationMode } from '../engine/rules'

export const newCharacter = (partial: Partial<Character> = {}): Character => ({
  id: uid(),
  name: 'Novo Personagem',
  speciesId: 'humano',
  backgroundId: 'soldado',
  backgroundBonuses: {},
  classId: 'guerreiro',
  level: 1,
  abilityMethod: 'array',
  baseAbilities: emptyScores(10),
  skillProfs: [],
  asiChoices: [],
  speciesChoices: {},
  classChoices: {},
  featureChoices: {},
  originFeats: [],
  weaponMasteries: [],
  damageTaken: 0,
  tempHp: 0,
  deathSaves: { successes: 0, failures: 0 },
  hpRolls: [],
  hitDiceSpent: 0,
  inventory: [],
  gold: 0,
  coins: emptyPurse(),
  spellsKnown: [],
  spellsPrepared: [],
  spellSwaps: 0,
  spellPicks: {},
  slotsSpent: {},
  pactSlotsSpent: 0,
  resourcesUsed: {},
  notes: '',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...partial,
})

/**
 * Completa campos que não existiam em versões anteriores da ficha.
 * Usado ao carregar do armazenamento local, ao importar backups e ao sincronizar.
 */
export const normalizeCharacter = (c: Character): Character => ({
  ...c,
  speciesChoices: c.speciesChoices ?? {},
  classChoices: c.classChoices ?? {},
  featureChoices: c.featureChoices ?? {},
  // Fichas de uma classe só ganham a lista de classes explícita ao carregar.
  classes: c.classes?.length ? c.classes : [{ classId: c.classId, subclassId: c.subclassId, level: c.level }],
  levelClasses: c.levelClasses?.length ? c.levelClasses : Array.from({ length: Math.max(1, c.level) }, () => c.classId),
  originFeats: c.originFeats ?? [],
  weaponMasteries: c.weaponMasteries ?? [],
  asiChoices: c.asiChoices ?? [],
  skillProfs: c.skillProfs ?? [],
  inventory: c.inventory ?? [],
  hpRolls: c.hpRolls ?? [],
  spellsKnown: c.spellsKnown ?? [],
  spellsPrepared: c.spellsPrepared ?? [],
  spellSwaps: c.spellSwaps ?? 0,
  spellPicks: c.spellPicks ?? {},
  slotsSpent: c.slotsSpent ?? {},
  resourcesUsed: c.resourcesUsed ?? {},
  backgroundBonuses: c.backgroundBonuses ?? {},
  deathSaves: c.deathSaves ?? { successes: 0, failures: 0 },
  // Fichas antigas guardavam só o ouro; viram uma bolsa completa de moedas.
  coins: c.coins ?? purseFromGold(c.gold ?? 0),
})

interface AppState {
  characters: Character[]
  activeId: string | null
  rollLog: RollEntry[]
  supabaseUrl: string
  supabaseKey: string
  lastSync: number | null
  /** última versão cujas notas o jogador abriu — controla o selo de novidade */
  versaoVista: string

  addCharacter: (c: Character) => void
  updateCharacter: (id: string, patch: Partial<Character> | ((c: Character) => Partial<Character>)) => void
  deleteCharacter: (id: string) => void
  setActive: (id: string | null) => void
  replaceAll: (chars: Character[]) => void

  pushRoll: (r: RollEntry) => void
  clearRolls: () => void

  setSupabase: (url: string, key: string) => void
  setLastSync: (t: number | null) => void
  marcarVersaoVista: (v: string) => void

  // Ações de jogo
  spendSlot: (id: string, level: number, delta: number) => void
  spendPactSlot: (id: string, delta: number) => void
  useResource: (id: string, resourceId: string, delta: number) => void
  /** gasta (ou devolve) cargas de um item da mochila, preso entre 0 e o máximo */
  useCharges: (id: string, entryUid: string, delta: number, max: number) => void
  /** consome uma unidade de um item que se gasta; some da mochila ao acabar */
  consumeItem: (id: string, entryUid: string) => void
  applyDamage: (id: string, amount: number) => void
  heal: (id: string, amount: number) => void
  setTempHp: (id: string, amount: number) => void
  setDeathSaves: (id: string, saves: Character['deathSaves']) => void
  /** Rola 1d20 de Teste de Morte e aplica o resultado (regras do PHB 2024). */
  rollDeathSave: (id: string) => RollEntry | null
  shortRest: (id: string) => void
  longRest: (id: string) => void
  /** `die` permite escolher o Dado de Vida numa ficha multiclasse (d10, d8...) */
  spendHitDie: (id: string, die?: number) => number | null
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      characters: [],
      activeId: null,
      rollLog: [],
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
      lastSync: null,
      versaoVista: '',

      addCharacter: (c) => set((s) => ({ characters: [...s.characters, normalizeCharacter(c)], activeId: c.id })),

      updateCharacter: (id, patch) =>
        set((s) => ({
          characters: s.characters.map((c) =>
            c.id === id ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch), updatedAt: Date.now() } : c,
          ),
        })),

      deleteCharacter: (id) =>
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),

      setActive: (id) => set({ activeId: id }),
      replaceAll: (chars) => set({ characters: chars.map(normalizeCharacter) }),

      pushRoll: (r) => set((s) => ({ rollLog: [r, ...s.rollLog].slice(0, 60) })),
      clearRolls: () => set({ rollLog: [] }),

      setSupabase: (supabaseUrl, supabaseKey) => set({ supabaseUrl, supabaseKey }),
      setLastSync: (lastSync) => set({ lastSync }),
      marcarVersaoVista: (versaoVista) => set({ versaoVista }),

      spendSlot: (id, level, delta) =>
        get().updateCharacter(id, (c) => {
          const cur = c.slotsSpent[level] ?? 0
          return { slotsSpent: { ...c.slotsSpent, [level]: Math.max(0, cur + delta) } }
        }),

      spendPactSlot: (id, delta) =>
        get().updateCharacter(id, (c) => ({ pactSlotsSpent: Math.max(0, c.pactSlotsSpent + delta) })),

      useResource: (id, resourceId, delta) =>
        get().updateCharacter(id, (c) => {
          const cur = c.resourcesUsed[resourceId] ?? 0
          return { resourcesUsed: { ...c.resourcesUsed, [resourceId]: Math.max(0, cur + delta) } }
        }),

      useCharges: (id, entryUid, delta, max) =>
        get().updateCharacter(id, (c) => ({
          inventory: c.inventory.map((e) => (e.uid === entryUid
            ? { ...e, chargesUsed: Math.max(0, Math.min(max, (e.chargesUsed ?? 0) + delta)) }
            : e)),
        })),

      consumeItem: (id, entryUid) =>
        get().updateCharacter(id, (c) => ({
          inventory: c.inventory.flatMap((e) => {
            if (e.uid !== entryUid) return [e]
            // A última unidade sai da mochila em vez de ficar zerada lá.
            return e.qty > 1 ? [{ ...e, qty: e.qty - 1 }] : []
          }),
        })),

      applyDamage: (id, amount) =>
        get().updateCharacter(id, (c) => {
          let remaining = amount
          let temp = c.tempHp
          if (temp > 0) {
            const absorbed = Math.min(temp, remaining)
            temp -= absorbed
            remaining -= absorbed
          }
          // Dano sofrido enquanto já está a 0 PV conta como uma falha no Teste de Morte.
          const jaCaido = c.damageTaken >= maxHp(c)
          const deathSaves = jaCaido && remaining > 0
            ? { ...c.deathSaves, failures: Math.min(3, c.deathSaves.failures + 1) }
            : c.deathSaves
          return { tempHp: temp, damageTaken: Math.min(maxHp(c), c.damageTaken + remaining), deathSaves }
        }),

      heal: (id, amount) =>
        get().updateCharacter(id, (c) => ({
          damageTaken: Math.max(0, c.damageTaken - amount),
          // Recuperar PV encerra os Testes de Morte: os marcadores zeram.
          deathSaves: amount > 0 ? { successes: 0, failures: 0 } : c.deathSaves,
        })),

      setTempHp: (id, amount) => get().updateCharacter(id, { tempHp: Math.max(0, amount) }),

      setDeathSaves: (id, saves) =>
        get().updateCharacter(id, {
          deathSaves: {
            successes: Math.max(0, Math.min(3, saves.successes)),
            failures: Math.max(0, Math.min(3, saves.failures)),
          },
        }),

      rollDeathSave: (id) => {
        const char = get().characters.find((c) => c.id === id)
        if (!char) return null
        const entry = roll({ label: 'Teste de Morte', sides: 20, isD20Test: true })
        get().pushRoll(entry)
        const dado = entry.rolls[0]
        get().updateCharacter(id, (c) => {
          // 20 natural: recupera 1 PV e volta à consciência (zera os marcadores).
          if (dado === 20) return { damageTaken: maxHp(c) - 1, deathSaves: { successes: 0, failures: 0 } }
          const ds = { ...c.deathSaves }
          if (dado === 1) ds.failures = Math.min(3, ds.failures + 2) // 1 natural: duas falhas
          else if (dado >= 10) ds.successes = Math.min(3, ds.successes + 1)
          else ds.failures = Math.min(3, ds.failures + 1)
          return { deathSaves: ds }
        })
        return entry
      },

      shortRest: (id) =>
        get().updateCharacter(id, (c) => {
          const resources = characterResources(c)
          const used = { ...c.resourcesUsed }
          for (const r of resources) {
            if (r.recharge === 'curto') used[r.id] = 0
            // Recursos de descanso longo que devolvem alguns usos no curto (Retomar o Fôlego)
            else if (r.shortRestUses) used[r.id] = Math.max(0, (used[r.id] ?? 0) - r.shortRestUses)
          }
          // Bruxo recupera espaços de Pacto em descanso curto — inclusive multiclasse
          return {
            resourcesUsed: used,
            pactSlotsSpent: pactSlots(c) ? 0 : c.pactSlotsSpent,
          }
        }),

      longRest: (id) =>
        get().updateCharacter(id, (c) => {
          const used: Record<string, number> = {}
          for (const r of characterResources(c)) used[r.id] = 0
          // Descanso longo recupera metade dos Dados de Vida (mínimo 1)
          const recovered = Math.max(1, Math.floor(c.level / 2))
          return {
            damageTaken: 0,
            tempHp: 0,
            deathSaves: { successes: 0, failures: 0 },
            slotsSpent: {},
            pactSlotsSpent: 0,
            resourcesUsed: used,
            hitDiceSpent: Math.max(0, c.hitDiceSpent - recovered),
            // Paladino e Patrulheiro trocam uma magia preparada por descanso longo.
            spellSwaps: preparationMode(c) === 'descanso-uma' ? 1 : c.spellSwaps,
          }
        }),

      spendHitDie: (id, die) => {
        const char = get().characters.find((c) => c.id === id)
        if (!char) return null
        if (char.hitDiceSpent >= char.level) return null
        // Sem escolha explícita, usa o dado da classe inicial.
        const lados = die ?? classById(char.classId)?.hitDie
        if (!lados) return null
        const rolled = rollHitDie(lados)
        const healed = Math.max(1, rolled + abilityMods(char).con)
        get().updateCharacter(id, (c) => ({
          hitDiceSpent: c.hitDiceSpent + 1,
          damageTaken: Math.max(0, c.damageTaken - healed),
        }))
        return healed
      },
    }),
    {
      name: 'fichas-dnd-2024',
      partialize: (s) => ({
        characters: s.characters,
        activeId: s.activeId,
        supabaseUrl: s.supabaseUrl,
        supabaseKey: s.supabaseKey,
        lastSync: s.lastSync,
        versaoVista: s.versaoVista,
      }),
      // Fichas salvas antes das escolhas de espécie/classe voltam sem esses campos.
      onRehydrateStorage: () => (state) => {
        if (state) state.characters = state.characters.map(normalizeCharacter)
      },
    },
  ),
)

export const useActiveCharacter = (): Character | null => {
  const { characters, activeId } = useStore()
  return characters.find((c) => c.id === activeId) ?? null
}

export const abilityScoresOf = (c: Character): AbilityScores => c.baseAbilities
