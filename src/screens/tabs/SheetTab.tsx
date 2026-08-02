import { useState } from 'react'
import type { Character } from '../../types'
import { ABILITIES, ABILITY_NAMES } from '../../types'
import {
  abilityMods, armorClass, characterChoices, characterFeats, characterResources, currentHp,
  finalAbilities, fmtMod, initiative, maxHp, passivePerception, proficiencyBonus, saves,
  speciesLabel, speciesVariants, speed, spellcasting, unlockedFeatures,
} from '../../engine/rules'
import { featById } from '../../data/feats'
import { FEAT_CATEGORY_NAMES } from '../../data/feats'
import { useStore } from '../../store/store'
import { roll } from '../../engine/dice'
import { classById } from '../../data/classes'
import { speciesById } from '../../data/species'
import { backgroundById } from '../../data/backgrounds'
import { Card, Sheet } from '../../components/ui'

export function SheetTab({ char }: { char: Character }) {
  const {
    pushRoll, applyDamage, heal, setTempHp, shortRest, longRest, spendHitDie, useResource,
    setDeathSaves, rollDeathSave,
  } = useStore()
  const [hpDelta, setHpDelta] = useState(0)
  const [restSheet, setRestSheet] = useState<'curto' | 'longo' | null>(null)
  const [restMsg, setRestMsg] = useState<string[]>([])
  const [deathMsg, setDeathMsg] = useState<string | null>(null)

  const abs = finalAbilities(char)
  const mods = abilityMods(char)
  const ac = armorClass(char)
  const hp = currentHp(char)
  const hpMax = maxHp(char)
  const pb = proficiencyBonus(char.level)
  const cls = classById(char.classId)
  const sc = spellcasting(char)
  const resources = characterResources(char)
  const feats = characterFeats(char)
  const escolhas = characterChoices(char)
  const pendentes = escolhas.filter((e) => !e.chosen)
  const variantes = speciesVariants(char)
  const pendentesEspecie = pendentes.filter((e) => e.source === 'especie')
  const bg = backgroundById(char.backgroundId)
  const bonusDoAntecedente = ABILITIES
    .filter((k) => (char.backgroundBonuses[k] ?? 0) > 0)
    .map((k) => `${ABILITY_NAMES[k]} +${char.backgroundBonuses[k]}`)
    .join(', ')

  // O resultado aparece no aviso flutuante (RollToast), visível em qualquer ponto da página.
  const doRoll = (label: string, modifier: number) => {
    pushRoll(roll({ label, sides: 20, modifier, isD20Test: true }))
  }

  // --- Teste de Morte ---
  const morrendo = hp <= 0
  const ds = char.deathSaves
  const morto = ds.failures >= 3
  const estavel = ds.successes >= 3 && !morto

  const doDeathSave = () => {
    const entry = rollDeathSave(char.id)
    if (!entry) return
    const dado = entry.rolls[0]
    if (dado === 20) setDeathMsg('20 natural! Você recupera 1 PV e volta à consciência.')
    else if (dado === 1) setDeathMsg('1 natural: conta como DUAS falhas.')
    else if (dado >= 10) setDeathMsg(`${dado}: sucesso.`)
    else setDeathMsg(`${dado}: falha.`)
  }

  // Alternar marcador: clicar no último preenchido desmarca; nos demais, marca até ali.
  const marcar = (kind: 'successes' | 'failures', i: number) => {
    const atual = ds[kind]
    const novo = i + 1 === atual ? i : i + 1
    setDeathSaves(char.id, { ...ds, [kind]: novo })
    setDeathMsg(null)
  }

  const doShortRest = () => {
    const parciais = resources.filter((r) => r.shortRestUses && r.used > 0)
    shortRest(char.id)
    setRestMsg([
      'Recursos com recarga em descanso curto foram restaurados.',
      ...parciais.map((r) => `${r.name}: +${Math.min(r.shortRestUses!, r.used)} uso recuperado.`),
      cls?.caster === 'pacto' ? 'Espaços de Pacto recuperados.' : '',
    ].filter(Boolean))
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
      {pendentes.length > 0 && (
        <div className="banner warn">
          Escolhas pendentes: <strong>{pendentes.map((p) => p.group.name).join(', ')}</strong>.
          Toque no nome do personagem, no topo, para escolher.
        </div>
      )}

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

      {/* --- Teste de Morte --- */}
      <div className={`death-wrap${morrendo && !morto && !estavel ? ' destaque' : ''}`}>
        <Card title="☠️ Teste de Morte">
          {morrendo && !morto && !estavel && (
            <div className="banner warn">
              Você está a <strong>0 PV</strong> e Inconsciente: no início de cada turno seu, role um Teste de Morte!
            </div>
          )}
          {morto && (
            <div className="banner warn"><strong>3 falhas — o personagem morreu.</strong></div>
          )}
          {estavel && (
            <div className="banner ok">3 sucessos — você está <strong>Estável</strong> (permanece a 0 PV, Inconsciente).</div>
          )}

          <div className="grid g2" style={{ marginTop: 4 }}>
            <div>
              <div className="tiny muted" style={{ marginBottom: 4 }}>Sucessos ✚</div>
              <div className="row" style={{ gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`death-pip ok${i < ds.successes ? ' on' : ''}`}
                    aria-label={`Marcar sucesso ${i + 1}`}
                    onClick={() => marcar('successes', i)}
                  >{i < ds.successes ? '●' : '○'}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="tiny muted" style={{ marginBottom: 4 }}>Falhas ✖</div>
              <div className="row" style={{ gap: 8 }}>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`death-pip bad${i < ds.failures ? ' on' : ''}`}
                    aria-label={`Marcar falha ${i + 1}`}
                    onClick={() => marcar('failures', i)}
                  >{i < ds.failures ? '●' : '○'}</button>
                ))}
              </div>
            </div>
          </div>

          <button
            className="primary"
            style={{ width: '100%', marginTop: 12 }}
            disabled={morto || estavel}
            onClick={doDeathSave}
          >🎲 Rolar Teste de Morte (1d20)</button>
          {deathMsg && <div className="tiny center" style={{ marginTop: 8 }}>{deathMsg}</div>}
          <p className="muted tiny" style={{ marginTop: 8 }}>
            10 ou mais: sucesso · 9 ou menos: falha · 1 natural: duas falhas · 20 natural: recupera 1 PV.
            Três sucessos: Estável. Três falhas: morte. Recuperar PV zera os marcadores.
          </p>
        </Card>
      </div>

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
                      {r.shortRestUses
                        ? `Recupera ${r.shortRestUses} uso no descanso curto · todos no longo`
                        : `Recarrega em descanso ${r.recharge}`}
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

      {/* --- Características --- */}
      <Card title="Características de Classe">
        {unlockedFeatures(char).map((f, i) => (
          <div className="feature" key={`${f.level}-${f.name}-${i}`}>
            <h4>{f.name} <span className="muted tiny">· Nível {f.level}</span></h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </Card>

      {/* --- Talentos --- */}
      <Card title="Talentos">
        {feats.length === 0 && <div className="muted tiny">Nenhum talento ainda.</div>}
        {feats.map((f) => (
          <div className="feature" key={f.id}>
            <h4>
              {f.name}{' '}
              <span className="muted tiny">· {FEAT_CATEGORY_NAMES[f.category]} · {f.origem}</span>
            </h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </Card>

      {/* --- Escolhas de espécie e de classe --- */}
      {escolhas.length > 0 && (
        <Card title="Escolhas de Espécie e Classe">
          {escolhas.map(({ group, chosen, source }) => (
            <div className="feature" key={`${source}-${group.id}`}>
              <h4>
                {group.name}{' '}
                <span className="muted tiny">· {source === 'especie' ? 'Espécie' : 'Classe'}</span>
              </h4>
              {chosen ? (
                <p><strong className="gold">{chosen.name}:</strong> {chosen.desc}</p>
              ) : (
                <p style={{ color: 'var(--red)' }}>
                  Escolha pendente — abra <strong>Editar personagem</strong> (toque no nome, no topo) para escolher.
                </p>
              )}
            </div>
          ))}
        </Card>
      )}

      <Card title="Espécie e Antecedente">
        <div className="feature">
          <h4>{speciesLabel(char)}</h4>
          {/* Variações escolhidas (linhagem élfica, ancestral dracônico, legado infernal...) */}
          {variantes.map((v) => (
            <p key={v.group}><strong className="gold">{v.group}:</strong> {v.option}</p>
          ))}
          {pendentesEspecie.map((p) => (
            <p key={p.group.id} style={{ color: 'var(--red)' }}>
              <strong>{p.group.name}:</strong> ainda não escolhido
            </p>
          ))}
          {speciesById(char.speciesId)?.traits.map((t) => (
            <p key={t.name}><strong>{t.name}:</strong> {t.desc}</p>
          ))}
        </div>
        <div className="feature">
          <h4>{bg?.name ?? 'Sem antecedente'}</h4>
          <p>{bg?.desc}</p>
          {bg && (
            <>
              <p>
                <strong className="gold">Bônus de habilidade:</strong>{' '}
                {bonusDoAntecedente || 'nenhum distribuído'}
                {char.freeBackgroundBonuses ? ' (distribuição livre)' : ''}
              </p>
              <p><strong className="gold">Talento de Origem:</strong> {featById(bg.featId)?.name}</p>
              <p><strong className="gold">Ferramenta:</strong> {bg.tool}</p>
            </>
          )}
        </div>
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
