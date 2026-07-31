import { useState } from 'react'
import type { Character } from '../../types'
import { ABILITY_NAMES } from '../../types'
import { attackActions, abilityMods, proficiencyBonus, spellcasting } from '../../engine/rules'
import { roll, rollDamage, type Advantage } from '../../engine/dice'
import { useStore } from '../../store/store'
import { Card, Empty, Segmented } from '../../components/ui'
import { RollResult } from '../../components/DiceRoller'

export function ActionsTab({ char }: { char: Character }) {
  const pushRoll = useStore((s) => s.pushRoll)
  const [advantage, setAdvantage] = useState<Advantage>('normal')
  const [last, setLast] = useState<ReturnType<typeof roll> | null>(null)
  const [critArmed, setCritArmed] = useState<Record<string, boolean>>({})

  const attacks = attackActions(char)
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const sc = spellcasting(char)

  const doAttack = (uid: string, name: string, bonus: number) => {
    const entry = roll({ label: `Ataque: ${name}`, sides: 20, modifier: bonus, advantage, isD20Test: true })
    setLast(entry)
    pushRoll(entry)
    setCritArmed((c) => ({ ...c, [uid]: entry.crit === 'critico' }))
  }

  const doDamage = (uid: string, name: string, dice: string, bonus: number, type: string) => {
    const entry = rollDamage(`Dano: ${name}`, dice, bonus, type, critArmed[uid] ?? false)
    setLast(entry)
    pushRoll(entry)
    setCritArmed((c) => ({ ...c, [uid]: false }))
  }

  return (
    <div>
      {last && <RollResult entry={last} />}

      <Card title="Vantagem / Desvantagem">
        <Segmented
          value={advantage}
          onChange={setAdvantage}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'vantagem', label: 'Vantagem' },
            { value: 'desvantagem', label: 'Desvantagem' },
          ]}
        />
        <div className="muted tiny center" style={{ marginTop: 8 }}>
          Aplicado às rolagens de ataque abaixo.
        </div>
      </Card>

      {attacks.length === 0 ? (
        <Empty
          icon="⚔"
          title="Nenhuma arma equipada"
          hint="Vá até a aba Itens e equipe uma arma para que ela apareça aqui com os botões de Atacar e Dano."
        />
      ) : (
        attacks.map((a) => (
          <div className="card" key={a.uid}>
            <div className="spread" style={{ marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <strong>{a.name}</strong>
                <div className="tiny muted">
                  {a.damageDice}
                  {a.damageBonus !== 0 && (a.damageBonus > 0 ? ` +${a.damageBonus}` : ` ${a.damageBonus}`)} {a.damageType}
                  {' · '}{ABILITY_NAMES[a.ability]}{' · '}{a.range}
                </div>
                {a.properties.length > 0 && <div className="tiny muted">{a.properties.join(' · ')}</div>}
                <div className="tiny gold">Maestria: {a.mastery}</div>
              </div>
            </div>

            <div className="row" style={{ gap: 6 }}>
              <button className="primary" style={{ flex: 1 }} onClick={() => doAttack(a.uid, a.name, a.attackBonus)}>
                🎯 Atacar {a.attackBonus >= 0 ? `+${a.attackBonus}` : a.attackBonus}
              </button>
              <button
                className={critArmed[a.uid] ? 'gold' : ''}
                style={{ flex: 1 }}
                onClick={() => doDamage(a.uid, a.name, a.damageDice, a.damageBonus, a.damageType)}
              >
                💥 Dano{critArmed[a.uid] ? ' CRÍTICO' : ''}
              </button>
            </div>

            {a.versatileDice && (
              <button
                className="sm ghost" style={{ width: '100%', marginTop: 6 }}
                onClick={() => doDamage(a.uid, `${a.name} (duas mãos)`, a.versatileDice!, a.damageBonus, a.damageType)}
              >
                Dano com duas mãos ({a.versatileDice})
              </button>
            )}
          </div>
        ))
      )}

      <Card title="Ataque Desarmado">
        <div className="spread">
          <div>
            <strong>Golpe Desarmado</strong>
            <div className="tiny muted">1 + Força de dano de concussão</div>
          </div>
          <button className="sm primary" onClick={() => {
            const entry = roll({ label: 'Ataque: Desarmado', sides: 20, modifier: mods.for + pb, advantage, isD20Test: true })
            setLast(entry); pushRoll(entry)
          }}>Atacar {mods.for + pb >= 0 ? `+${mods.for + pb}` : mods.for + pb}</button>
        </div>
      </Card>

      {sc && (
        <Card title="Ataques Mágicos">
          <div className="spread">
            <div>
              <strong>Ataque de Magia</strong>
              <div className="tiny muted">
                {ABILITY_NAMES[sc.ability]} · CD de salvaguarda das suas magias: <strong className="gold">{sc.saveDC}</strong>
              </div>
            </div>
            <button className="sm primary" onClick={() => {
              const entry = roll({ label: 'Ataque de Magia', sides: 20, modifier: sc.attackBonus, advantage, isD20Test: true })
              setLast(entry); pushRoll(entry)
            }}>Rolar +{sc.attackBonus}</button>
          </div>
        </Card>
      )}
    </div>
  )
}
