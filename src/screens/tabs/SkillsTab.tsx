import type { Character } from '../../types'
import { ABILITY_NAMES } from '../../types'
import {
  activeWeaponMasteries, fmtMod, masteryEligibleWeapons, proficiencyBonus, proficiencyGroups,
  skillValues, weaponMasteryCount,
} from '../../engine/rules'
import { MASTERY_DESC } from '../../data/equipment'
import { useStore } from '../../store/store'
import { roll } from '../../engine/dice'
import { Card, Choice } from '../../components/ui'

/** Aba com as perícias e todas as demais proficiências (armadura, armas, ferramentas, maestrias). */
export function SkillsTab({ char }: { char: Character }) {
  const { pushRoll, updateCharacter } = useStore()
  const pb = proficiencyBonus(char.level)
  const profs = proficiencyGroups(char)
  const pericias = skillValues(char)
  const treinadas = pericias.filter((s) => s.proficient)

  const masteryMax = weaponMasteryCount(char)
  const masterias = activeWeaponMasteries(char)
  const elegiveis = masteryEligibleWeapons(char)

  const doRoll = (label: string, modifier: number) =>
    pushRoll(roll({ label, sides: 20, modifier, isD20Test: true }))

  const toggleMastery = (id: string) => {
    const atuais = char.weaponMasteries ?? []
    if (atuais.includes(id)) updateCharacter(char.id, { weaponMasteries: atuais.filter((x) => x !== id) })
    else if (atuais.length < masteryMax) updateCharacter(char.id, { weaponMasteries: [...atuais, id] })
  }

  return (
    <div>
      <Card title="Perícias">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          Treinado em {treinadas.length} perícia(s) · bônus de proficiência {fmtMod(pb)}.
          Toque numa perícia para rolar o teste.
        </p>
        {pericias.map((s) => (
          <button key={s.id} className="list-item" style={{ textAlign: 'left', width: '100%' }}
            onClick={() => doRoll(s.name, s.value)}>
            <div className="spread">
              <span>{s.proficient ? '⬤' : '○'} {s.name} <span className="muted tiny">({ABILITY_NAMES[s.ability].slice(0, 3)})</span></span>
              <strong>{fmtMod(s.value)}</strong>
            </div>
          </button>
        ))}
      </Card>

      <Card title="Proficiências">
        <div className="feature">
          <h4>Armaduras</h4>
          <p>{profs.armaduras.length ? profs.armaduras.join(', ') : 'Nenhuma'}</p>
        </div>
        <div className="feature">
          <h4>Armas</h4>
          <p>{profs.armas.length ? profs.armas.join(', ') : 'Nenhuma'}</p>
        </div>
        <div className="feature">
          <h4>Ferramentas e instrumentos</h4>
          <p>{profs.ferramentas.length ? profs.ferramentas.join(' · ') : 'Nenhuma'}</p>
        </div>
      </Card>

      {masteryMax > 0 && (
        <Card title={`Maestria em Armas (${masterias.length}/${masteryMax})`}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            No nível {char.level} você domina a propriedade de maestria de {masteryMax} arma(s).
            Toque para trocar as armas escolhidas.
          </p>
          {masterias.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {masterias.map((w) => (
                <div className="feature" key={w.id}>
                  <h4>{w.name} <span className="muted tiny">· {w.weapon!.mastery}</span></h4>
                  <p>{MASTERY_DESC[w.weapon!.mastery] ?? 'Propriedade de maestria desta arma.'}</p>
                </div>
              ))}
            </div>
          )}
          {masterias.length < masteryMax && (
            <div className="banner warn">
              Você ainda pode escolher {masteryMax - masterias.length} arma(s) para a Maestria em Armas.
            </div>
          )}
          <details style={{ marginTop: 8 }}>
            <summary className="muted">Escolher armas</summary>
            <div style={{ marginTop: 8 }}>
              {elegiveis.map((w) => {
                const marcada = (char.weaponMasteries ?? []).includes(w.id)
                return (
                  <Choice
                    key={w.id}
                    selected={marcada}
                    title={w.name}
                    desc={`Maestria: ${w.weapon!.mastery} · ${w.weapon!.damage} ${w.weapon!.damageType}`}
                    details={<p><strong className="gold">{w.weapon!.mastery}:</strong> {MASTERY_DESC[w.weapon!.mastery] ?? 'Propriedade de maestria desta arma.'}</p>}
                    onClick={() => toggleMastery(w.id)}
                  />
                )
              })}
            </div>
          </details>
        </Card>
      )}
    </div>
  )
}
