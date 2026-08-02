import { useState } from 'react'
import type { Character } from '../types'
import { speciesById } from '../data/species'
import { SheetTab } from './tabs/SheetTab'
import { SkillsTab } from './tabs/SkillsTab'
import { ActionsTab } from './tabs/ActionsTab'
import { ItemsTab } from './tabs/ItemsTab'
import { SpellsTab } from './tabs/SpellsTab'
import { LevelUpWizard } from './LevelUpWizard'
import { Card, Choice, ChoiceAccordion, ChoiceGroup, FeaturePickCard, Sheet } from '../components/ui'
import { SwipeTabs, type SwipeTab } from '../components/SwipeTabs'
import { useStore } from '../store/store'
import {
  characterChoices, characterClasses, classEntries, classLabel, featurePickGroups, speciesLabel,
  type ResolvedChoice,
} from '../engine/rules'
import { ORIGIN_FEATS, featById } from '../data/feats'
import { backgroundById } from '../data/backgrounds'

type Tab = 'ficha' | 'pericias' | 'acoes' | 'itens' | 'magias'

const TABS: SwipeTab<Tab>[] = [
  { id: 'ficha', label: 'Ficha', icon: '📜' },
  { id: 'pericias', label: 'Perícias', icon: '🎯' },
  { id: 'acoes', label: 'Ações', icon: '⚔' },
  { id: 'itens', label: 'Itens', icon: '🎒' },
  { id: 'magias', label: 'Magias', icon: '✨' },
]

export function CharacterSheet({ char, onBack }: { char: Character; onBack: () => void }) {
  const update = useStore((s) => s.updateCharacter)
  const [tab, setTab] = useState<Tab>('ficha')
  const [levelUp, setLevelUp] = useState(false)
  const [editando, setEditando] = useState(false)

  const classes = characterClasses(char)
  const species = speciesById(char.speciesId)
  const escolhas = characterChoices(char)
  const gruposDeFeature = featurePickGroups(char).filter((g) => g.count > 0)
  const bg = backgroundById(char.backgroundId)
  const subLabel = classes.map((c) => c.subclass?.name).filter(Boolean).join(' · ')

  // Escolhas de subclasse (terreno do Círculo da Terra) moram no mesmo balde da classe.
  const escolher = (source: ResolvedChoice['source'], key: string, optionId: string) => {
    if (source === 'especie') {
      update(char.id, (c) => ({ speciesChoices: { ...(c.speciesChoices ?? {}), [key]: optionId } }))
    } else {
      update(char.id, (c) => ({ classChoices: { ...(c.classChoices ?? {}), [key]: optionId } }))
    }
  }

  /** Marca/desmarca uma opção de característica (manobra, invocação, metamagia). */
  const alternarFeature = (grupoId: string, optionId: string, limite: number) => {
    update(char.id, (c) => {
      const lista = c.featureChoices?.[grupoId] ?? []
      const nova = lista.includes(optionId)
        ? lista.filter((x) => x !== optionId)
        : lista.length >= limite ? lista : [...lista, optionId]
      return { featureChoices: { ...(c.featureChoices ?? {}), [grupoId]: nova } }
    })
  }

  /** Troca a subclasse de uma das classes da ficha, mantendo `classes` coerente. */
  const trocarSubclasse = (classId: string, subclassId: string | undefined) => {
    update(char.id, (c) => {
      const entradas = classEntries(c).map((e) => (e.classId === classId ? { ...e, subclassId } : e))
      return {
        classes: entradas,
        subclassId: classId === c.classId ? subclassId : c.subclassId,
      }
    })
  }

  /** Ajuste manual do nível: numa ficha de uma classe só, a classe acompanha. */
  const ajustarNivel = (nivel: number) => {
    update(char.id, (c) => {
      const entradas = classEntries(c)
      if (entradas.length > 1) return { level: nivel }
      return {
        level: nivel,
        classes: [{ ...entradas[0], level: nivel }],
        levelClasses: Array.from({ length: nivel }, () => entradas[0].classId),
      }
    })
  }

  return (
    <div>
      <div className="topbar">
        <button className="ghost icon" onClick={onBack}>←</button>
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setEditando(true)}>
          <h1>{char.name}</h1>
          <div className="sub">
            {speciesLabel(char)} · {classLabel(char)}
            {subLabel && ` · ${subLabel}`}
          </div>
        </div>
        <button className="gold sm" onClick={() => setLevelUp(true)} disabled={char.level >= 20}>
          ⬆ Nível
        </button>
      </div>

      {/* Arrastar para o lado troca de aba nos dois sentidos; no computador,
          as setas ← → e a rolagem horizontal do trackpad fazem o mesmo. */}
      <SwipeTabs tabs={TABS} value={tab} onChange={setTab} travado={levelUp || editando}>
        {tab === 'ficha' && <SheetTab char={char} />}
        {tab === 'pericias' && <SkillsTab char={char} />}
        {tab === 'acoes' && <ActionsTab char={char} />}
        {tab === 'itens' && <ItemsTab char={char} />}
        {tab === 'magias' && <SpellsTab char={char} />}
      </SwipeTabs>

      {levelUp && <LevelUpWizard char={char} onClose={() => setLevelUp(false)} />}

      {editando && (
        <Sheet title="Editar personagem" onClose={() => setEditando(false)}>
          <label>Nome</label>
          <input value={char.name} onChange={(e) => update(char.id, { name: e.target.value })} />

          {/* Uma subclasse por classe: numa ficha multiclasse cada uma tem a sua. */}
          {classes.filter((c) => c.cls.subclasses.length > 0 && c.entry.level >= 3).map(({ cls: c, entry }) => (
            <div key={c.id}>
              <label style={{ marginTop: 12 }}>
                Subclasse de {c.name} <span className="muted tiny">· nível {entry.level}</span>
              </label>
              <select
                value={entry.subclassId ?? ''}
                onChange={(e) => trocarSubclasse(c.id, e.target.value || undefined)}
              >
                <option value="">— nenhuma —</option>
                {c.subclasses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ))}

          <label style={{ marginTop: 12 }}>Nível (ajuste manual)</label>
          <input
            type="number" inputMode="numeric" min={1} max={20} value={char.level}
            onChange={(e) => ajustarNivel(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
          <div className="muted tiny" style={{ marginTop: 6 }}>
            Prefira o botão <strong>⬆ Nível</strong> na barra superior — ele mostra as novas habilidades,
            permite multiclassear e conduz as escolhas de subclasse, atributos e magias.
            {classes.length > 1 && ' Numa ficha multiclasse o ajuste manual cai na classe inicial.'}
          </div>

          {/* Escolhas de espécie e de classe (ancestral dracônico, dádiva de gigante, estilo de luta...) */}
          {escolhas.map(({ source, group, chosen, key, className }) => (
            <ChoiceGroup
              key={key}
              group={classes.length > 1 && className ? { ...group, name: `${group.name} · ${className}` } : group}
              value={chosen?.id}
              onChange={(optionId) => escolher(source, key, optionId)}
            />
          ))}

          {/* Manobras, Invocações Místicas, Metamagia: dá para revisar a qualquer momento. */}
          {gruposDeFeature.map((g) => (
            <FeaturePickCard
              key={`${g.classId}-${g.pick.id}`}
              grupo={g}
              onToggle={(optionId) => alternarFeature(g.pick.id, optionId, g.count)}
            />
          ))}

          {/* Talento de Origem adicional concedido pela espécie (Humano: traço Versátil) */}
          {species?.extraOriginFeat && (
            <Card title="Talento de Origem adicional">
              <p className="muted tiny" style={{ marginBottom: 10 }}>
                {species.name} concede um talento de Origem além do que vem do antecedente
                {bg ? ` (${featById(bg.featId)?.name})` : ''}.
              </p>
              <ChoiceAccordion>
              {ORIGIN_FEATS.map((f) => {
                const escolhido = (char.originFeats ?? [])[0] === f.id
                return (
                  <Choice
                    key={f.id}
                    id={f.id}
                    selected={escolhido}
                    title={f.name}
                    details={<p>{f.desc}</p>}
                    defaultOpen={escolhido}
                    onClick={() => update(char.id, { originFeats: escolhido ? [] : [f.id] })}
                  />
                )
              })}
              </ChoiceAccordion>
              {(char.originFeats ?? []).length === 0 && (
                <div className="banner warn">Você ainda não escolheu este talento.</div>
              )}
            </Card>
          )}
        </Sheet>
      )}
    </div>
  )
}
