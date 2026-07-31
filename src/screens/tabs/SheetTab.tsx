import { useState } from 'react'
import type { Character } from '../../types'
import { ABILITIES, ABILITY_NAMES } from '../../types'
import {
  abilityMods, armorClass, characterFeats, characterResources, currentHp, finalAbilities,
  fmtMod, initiative, maxHp, passivePerception, proficiencyBonus, saves, skillValues, speed,
  spellcasting, unlockedFeatures,
} from '../../engine/rules'
import { useStore } from '../../store/store'
import { roll } from '../../engine/dice'
import { classById } from '../../data/classes'
import { speciesById } from '../../data/species'
import { backgroundById } from '../../data/backgrounds'
import { Card, Sheet, Stepper } from '../../components/ui'
import { RollResult } from '../../components/DiceRoller'

export function SheetTab({ char }: { char: Character }) {
  const { pushRoll, applyDamage, heal, setTempHp, shortRest, longRest, spendHitDie, useResource } = useStore()
  const [hpDelta, setHpDelta] = useState(0)
  const [lastRoll, setLastRoll] = useState<ReturnType<typeof roll> | null>(null)
  const [restSheet, setRestSheet] = useState<'curto' | 'longo' | null>(null)
  const [restMsg, setRestMsg] = useState<string[]>([])

  const abs = finalAbilities(char)
  const mods = abilityMods(char)
  const ac = armorClass(char)
  const hp = currentHp(char)
  const hpMax = maxHp(char)
  const pb = proficiencyBonus(char.level)
  const cls = classById(char.classId)
  const sc = spellcasting(char)
  const resources = characterResources(char)

  const doRoll = (label: string, modifier: number) => {
    const entry = roll({ label, sides: 20, modifier, isD20Test: true })
    setLastRoll(entry)
    pushRoll(entry)
  }

  const doShortRest = () => {
    shortRest(char.id)
    setRestMsg(['Recursos com recarga em descanso curto foram restaurados.',
      cls?.caster === 'pacto' ? 'Espaços de Pacto recuperados.' : ''].filter(Boolean))
    setRestSheet('curto')
  }

  const doLongRest = () => {
    longRest(char.id)
    setRestMsg([
      'Pontos de Vida totalmente restaurados.',
      `Dados de Vida recuperados: ${Math.max(1, Math.floor(char.level / 2))}.`,
      'Todos os espaços de magia restaurados.',
      'Todas as habilidades com recarga em descanso curto e longo restauradas.',
    ])
    setRestSheet('longo')
  }

  return (
    <div>
      {lastRoll && <RollResult entry={lastRoll} />}

      {/* --- Pontos de Vida --- */}
      <Card title="Pontos de Vida">
        <div className="spread" style={{ marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Georgia, serif' }}>{hp}</span>
            <span className="muted"> / {hpMax}</span>
            {char.tempHp > 0 && <span className="gold"> (+{char.tempHp} temp)</span>}
          </div>
          <div className="tiny muted">
            Dados de Vida: {char.level - char.hitDiceSpent}/{char.level} d{cls?.hitDie}
          </div>
        </div>
        <div className="hpbar"><div style={{ width: `${Math.max(0, (hp / hpMax) * 100)}%` }} /></div>

        <div className="row" style={{ marginTop: 12, gap: 6 }}>
          <input
            type="number" inputMode="numeric" placeholder="0" style={{ flex: 1 }}
            value={hpDelta || ''} onChange={(e) => setHpDelta(Number(e.target.value) || 0)}
          />
          <button className="sm" style={{ background: 'var(--red-dark)' }} disabled={!hpDelta}
            onClick={() => { applyDamage(char.id, hpDelta); setHpDelta(0) }}>− Dano</button>
          <button className="sm" style={{ background: 'var(--green)' }} disabled={!hpDelta}
            onClick={() => { heal(char.id, hpDelta); setHpDelta(0) }}>+ Cura</button>
          <button className="sm" disabled={!hpDelta} onClick={() => { setTempHp(char.id, hpDelta); setHpDelta(0) }}>Temp</button>
        </div>

        <div className="row" style={{ marginTop: 8, gap: 6 }}>
          <button className="sm" style={{ flex: 1 }} onClick={doShortRest}>🔥 Descanso Curto</button>
          <button className="sm primary" style={{ flex: 1 }} onClick={doLongRest}>🌙 Descanso Longo</button>
        </div>
      </Card>

      {/* --- Combate --- */}
      <Card title="Combate">
        <div className="grid g3">
          <div className="ability">
            <div className="name">CA</div>
            <div className="mod">{ac.total}</div>
            <div className="score tiny">{ac.breakdown}</div>
          </div>
          <button className="ability" onClick={() => doRoll('Iniciativa', initiative(char))}>
            <div className="name">Iniciativa</div>
            <div className="mod">{fmtMod(initiative(char))}</div>
            <div className="score">rolar</div>
          </button>
          <div className="ability">
            <div className="name">Deslocamento</div>
            <div className="mod">{speed(char)}</div>
            <div className="score">metros</div>
          </div>
        </div>
        <div className="row wrap" style={{ marginTop: 10, gap: 6 }}>
          <span className="pill gold">Proficiência {fmtMod(pb)}</span>
          <span className="pill">Percepção Passiva {passivePerception(char)}</span>
          {sc && <span className="pill">CD de Magia {sc.saveDC}</span>}
          {sc && <span className="pill">Ataque Mágico {fmtMod(sc.attackBonus)}</span>}
        </div>
      </Card>

      {/* --- Atributos --- */}
      <Card title="Atributos">
        <div className="grid g6">
          {ABILITIES.map((k) => (
            <button className="ability" key={k} onClick={() => doRoll(`Teste de ${ABILITY_NAMES[k]}`, mods[k])}>
              <div className="name">{ABILITY_NAMES[k].slice(0, 3)}</div>
              <div className="mod">{fmtMod(mods[k])}</div>
              <div className="score">{abs[k]}</div>
            </button>
          ))}
        </div>
        <div className="muted tiny center" style={{ marginTop: 8 }}>Toque em um atributo para rolar o teste.</div>
      </Card>

      {/* --- Recursos limitados --- */}
      {resources.length > 0 && (
        <Card title="Habilidades Limitadas">
          {resources.map((r) => {
            const restantes = r.max - r.used
            const esgotado = restantes <= 0
            return (
              <div className="list-item" key={r.id}>
                <div className="spread">
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '.92rem' }}>{r.name}</strong>
                    <div className="tiny muted">
                      Recarrega em descanso {r.recharge}
                      {esgotado && <span style={{ color: 'var(--red)' }}> · ESGOTADA</span>}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="sm" disabled={r.used <= 0} onClick={() => useResource(char.id, r.id, -1)}>+</button>
                    <strong style={{ minWidth: 48, textAlign: 'center', color: esgotado ? 'var(--red)' : undefined }}>
                      {restantes}/{r.max}
                    </strong>
                    <button className="sm" disabled={esgotado} onClick={() => useResource(char.id, r.id, 1)}>Usar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* --- Salvaguardas --- */}
      <Card title="Salvaguardas">
        <div className="grid g2">
          {saves(char).map((s) => (
            <button key={s.ability} className="list-item" style={{ textAlign: 'left', width: '100%' }}
              onClick={() => doRoll(`Salvaguarda de ${ABILITY_NAMES[s.ability]}`, s.value)}>
              <div className="spread">
                <span>{s.proficient ? '⬤' : '○'} {ABILITY_NAMES[s.ability]}</span>
                <strong>{fmtMod(s.value)}</strong>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* --- Perícias --- */}
      <Card title="Perícias">
        {skillValues(char).map((s) => (
          <button key={s.id} className="list-item" style={{ textAlign: 'left', width: '100%' }}
            onClick={() => doRoll(s.name, s.value)}>
            <div className="spread">
              <span>{s.proficient ? '⬤' : '○'} {s.name} <span className="muted tiny">({ABILITY_NAMES[s.ability].slice(0, 3)})</span></span>
              <strong>{fmtMod(s.value)}</strong>
            </div>
          </button>
        ))}
      </Card>

      {/* --- Características --- */}
      <Card title="Características de Classe">
        {unlockedFeatures(char).map((f, i) => (
          <div className="feature" key={`${f.level}-${f.name}-${i}`}>
            <h4>{f.name} <span className="muted tiny">· Nível {f.level}</span></h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </Card>

      <Card title="Espécie, Antecedente e Talentos">
        <div className="feature">
          <h4>{speciesById(char.speciesId)?.name}</h4>
          {speciesById(char.speciesId)?.traits.map((t) => (
            <p key={t.name}><strong>{t.name}:</strong> {t.desc}</p>
          ))}
        </div>
        <div className="feature">
          <h4>{backgroundById(char.backgroundId)?.name}</h4>
          <p>{backgroundById(char.backgroundId)?.desc}</p>
        </div>
        {characterFeats(char).map((f) => (
          <div className="feature" key={f.id}>
            <h4>{f.name} <span className="muted tiny">· Talento de {f.category}</span></h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </Card>

      <Card title="Anotações">
        <textarea
          value={char.notes}
          placeholder="História, aliados, objetivos, tesouros..."
          onChange={(e) => useStore.getState().updateCharacter(char.id, { notes: e.target.value })}
        />
      </Card>

      {restSheet && (
        <Sheet title={restSheet === 'curto' ? '🔥 Descanso Curto' : '🌙 Descanso Longo'} onClose={() => setRestSheet(null)}>
          <div className="banner ok">
            {restMsg.map((m) => <div key={m}>✓ {m}</div>)}
          </div>
          {restSheet === 'curto' && (
            <Card title="Gastar Dados de Vida">
              <p className="muted tiny" style={{ marginBottom: 10 }}>
                Role um Dado de Vida (d{cls?.hitDie}) + modificador de Constituição para recuperar PV.
                Disponíveis: <strong>{char.level - char.hitDiceSpent}</strong>.
              </p>
              <button
                className="gold" style={{ width: '100%' }}
                disabled={char.hitDiceSpent >= char.level}
                onClick={() => {
                  const healed = spendHitDie(char.id)
                  if (healed !== null) setRestMsg((m) => [...m, `Você rolou o Dado de Vida e recuperou ${healed} PV.`])
                }}
              >🎲 Rolar 1 Dado de Vida</button>
            </Card>
          )}
        </Sheet>
      )}
    </div>
  )
}
