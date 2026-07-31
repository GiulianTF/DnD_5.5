import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AbilityScores, Character, RollEntry } from '../types'
import { emptyScores } from '../engine/pointbuy'
import { classById } from '../data/classes'
import { rollHitDie } from '../engine/dice'
import { uid } from '../engine/uid'
import { abilityMods, characterResources, maxHp } from '../engine/rules'

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
  originFeats: [],
  weaponMasteries: [],
  damageTaken: 0,
  tempHp: 0,
  hpRolls: [],
  hitDiceSpent: 0,
  inventory: [],
  gold: 0,
  spellsKnown: [],
  spellsPrepared: [],
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
  originFeats: c.originFeats ?? [],
  weaponMasteries: c.weaponMasteries ?? [],
  asiChoices: c.asiChoices ?? [],
  skillProfs: c.skillProfs ?? [],
  inventory: c.inventory ?? [],
  hpRolls: c.hpRolls ?? [],
  spellsKnown: c.spellsKnown ?? [],
  spellsPrepared: c.spellsPrepared ?? [],
  slotsSpent: c.slotsSpent ?? {},
  resourcesUsed: c.resourcesUsed ?? {},
  backgroundBonuses: c.backgroundBonuses ?? {},
})

interface AppState {
  characters: Character[]
  activeId: string | null
  rollLog: RollEntry[]
  supabaseUrl: string
  supabaseKey: string
  lastSync: number | null

  addCharacter: (c: Character) => void
  updateCharacter: (id: string, patch: Partial<Character> | ((c: Character) => Partial<Character>)) => void
  deleteCharacter: (id: string) => void
  setActive: (id: string | null) => void
  replaceAll: (chars: Character[]) => void

  pushRoll: (r: RollEntry) => void
  clearRolls: () => void

  setSupabase: (url: string, key: string) => void
  setLastSync: (t: number | null) => void

  // Ações de jogo
  spendSlot: (id: string, level: number, delta: number) => void
  spendPactSlot: (id: string, delta: number) => void
  useResource: (id: string, resourceId: string, delta: number) => void
  applyDamage: (id: string, amount: number) => void
  heal: (id: string, amount: number) => void
  setTempHp: (id: string, amount: number) => void
  shortRest: (id: string) => void
  longRest: (id: string) => void
  spendHitDie: (id: string) => number | null
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

      applyDamage: (id, amount) =>
        get().updateCharacter(id, (c) => {
          let remaining = amount
          let temp = c.tempHp
          if (temp > 0) {
            const absorbed = Math.min(temp, remaining)
            temp -= absorbed
            remaining -= absorbed
          }
          return { tempHp: temp, damageTaken: Math.min(maxHp(c), c.damageTaken + remaining) }
        }),

      heal: (id, amount) =>
        get().updateCharacter(id, (c) => ({ damageTaken: Math.max(0, c.damageTaken - amount) })),

      setTempHp: (id, amount) => get().updateCharacter(id, { tempHp: Math.max(0, amount) }),

      shortRest: (id) =>
        get().updateCharacter(id, (c) => {
          const resources = characterResources(c)
          const used = { ...c.resourcesUsed }
          for (const r of resources) {
            if (r.recharge === 'curto') used[r.id] = 0
            // Recursos de descanso longo que devolvem alguns usos no curto (Retomar o Fôlego)
            else if (r.shortRestUses) used[r.id] = Math.max(0, (used[r.id] ?? 0) - r.shortRestUses)
          }
          // Bruxo recupera espaços de Pacto em descanso curto
          const cls = classById(c.classId)
          return {
            resourcesUsed: used,
            pactSlotsSpent: cls?.caster === 'pacto' ? 0 : c.pactSlotsSpent,
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
            slotsSpent: {},
            pactSlotsSpent: 0,
            resourcesUsed: used,
            hitDiceSpent: Math.max(0, c.hitDiceSpent - recovered),
          }
        }),

      spendHitDie: (id) => {
        const char = get().characters.find((c) => c.id === id)
        if (!char) return null
        if (char.hitDiceSpent >= char.level) return null
        const cls = classById(char.classId)
        if (!cls) return null
        const rolled = rollHitDie(cls.hitDie)
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
