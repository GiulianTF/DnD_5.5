import { useState } from 'react'
import type { Character } from '../types'
import { classById } from '../data/classes'
import { speciesById } from '../data/species'
import { SheetTab } from './tabs/SheetTab'
import { SkillsTab } from './tabs/SkillsTab'
import { ActionsTab } from './tabs/ActionsTab'
import { ItemsTab } from './tabs/ItemsTab'
import { SpellsTab } from './tabs/SpellsTab'
import { LevelUpWizard } from './LevelUpWizard'
import { Card, Choice, ChoiceAccordion, ChoiceGroup, Sheet } from '../components/ui'
import { useStore } from '../store/store'
import { characterChoices, speciesLabel } from '../engine/rules'
import { ORIGIN_FEATS, featById } from '../data/feats'
import { backgroundById } from '../data/backgrounds'

type Tab = 'ficha' | 'pericias' | 'acoes' | 'itens' | 'magias'

const TABS: { id: Tab; label: string; icon: string }[] = [
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

  const cls = classById(char.classId)
  const sub = cls?.subclasses.find((s) => s.id === char.subclassId)
  const species = speciesById(char.speciesId)
  const escolhas = characterChoices(char)
  const bg = backgroundById(char.backgroundId)

  const escolher = (source: 'especie' | 'classe', groupId: string, optionId: string) => {
    if (source === 'especie') {
      update(char.id, (c) => ({ speciesChoices: { ...(c.speciesChoices ?? {}), [groupId]: optionId } }))
    } else {
      update(char.id, (c) => ({ classChoices: { ...(c.classChoices ?? {}), [groupId]: optionId } }))
    }
  }

  return (
    <div>
      <div className="topbar">
        <button className="ghost icon" onClick={onBack}>←</button>
        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setEditando(true)}>
          <h1>{char.name}</h1>
          <div className="sub">
            {speciesLabel(char)} · {cls?.name} {char.level}
            {sub && ` · ${sub.name}`}
          </div>
        </div>
        <button className="gold sm" onClick={() => setLevelUp(true)} disabled={char.level >= 20}>
          ⬆ Nível
        </button>
      </div>

      <div className="segmented tabs" style={{ marginBottom: 12 }}>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'ficha' && <SheetTab char={char} />}
      {tab === 'pericias' && <SkillsTab char={char} />}
      {tab === 'acoes' && <ActionsTab char={char} />}
      {tab === 'itens' && <ItemsTab char={char} />}
      {tab === 'magias' && <SpellsTab char={char} />}

      {levelUp && <LevelUpWizard char={char} onClose={() => setLevelUp(false)} />}

      {editando && (
        <Sheet title="Editar personagem" onClose={() => setEditando(false)}>
          <label>Nome</label>
          <input value={char.name} onChange={(e) => update(char.id, { name: e.target.value })} />

          {cls && cls.subclasses.length > 0 && char.level >= 3 && (
            <>
              <label style={{ marginTop: 12 }}>Subclasse</label>
              <select value={char.subclassId ?? ''} onChange={(e) => update(char.id, { subclassId: e.target.value || undefined })}>
                <option value="">— nenhuma —</option>
                {cls.subclasses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}

          <label style={{ marginTop: 12 }}>Nível (ajuste manual)</label>
          <input
            type="number" inputMode="numeric" min={1} max={20} value={char.level}
            onChange={(e) => update(char.id, { level: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          />
          <div className="muted tiny" style={{ marginTop: 6 }}>
            Prefira o botão <strong>⬆ Nível</strong> na barra superior — ele mostra as novas habilidades e
            conduz as escolhas de subclasse, atributos e magias.
          </div>

          {/* Escolhas de espécie e de classe (ancestral dracônico, dádiva de gigante, estilo de luta...) */}
          {escolhas.map(({ source, group, chosen }) => (
            <ChoiceGroup
              key={`${source}-${group.id}`}
              group={group}
              value={chosen?.id}
              onChange={(optionId) => escolher(source, group.id, optionId)}
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
