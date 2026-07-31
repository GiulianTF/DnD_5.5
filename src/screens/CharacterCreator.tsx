import { useMemo, useState } from 'react'
import type { AbilityKey, AbilityMethod, AbilityScores, Character } from '../types'
import { ABILITIES, ABILITY_NAMES } from '../types'
import { SPECIES } from '../data/species'
import { BACKGROUNDS } from '../data/backgrounds'
import { CLASSES, classById } from '../data/classes'
import { SKILLS, skillById } from '../data/skills'
import { SPELLS } from '../data/spells'
import { featById } from '../data/feats'
import { WEAPONS, ARMORS, SHIELD, GEAR } from '../data/equipment'
import { abilityMod, fmtMod, cantripLimit, preparedLimit, maxSpellLevel } from '../engine/rules'
import { POINT_BUY_COST, STANDARD_ARRAY, emptyScores, pointBuyRemaining } from '../engine/pointbuy'
import { roll4d6DropLowest } from '../engine/dice'
import { uid } from '../engine/uid'
import { newCharacter, useStore } from '../store/store'
import { Card, Choice, Segmented } from '../components/ui'

const STEPS = ['Identidade', 'Espécie', 'Antecedente', 'Classe', 'Atributos', 'Perícias', 'Magias', 'Equipamento'] as const

export function CharacterCreator({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const addCharacter = useStore((s) => s.addCharacter)
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [speciesId, setSpeciesId] = useState('humano')
  const [backgroundId, setBackgroundId] = useState('soldado')
  const [bgBonuses, setBgBonuses] = useState<Partial<Record<AbilityKey, number>>>({})
  const [classId, setClassId] = useState('guerreiro')
  const [method, setMethod] = useState<AbilityMethod>('array')
  const [scores, setScores] = useState<AbilityScores>(emptyScores(8))
  const [arrayAssign, setArrayAssign] = useState<Partial<Record<AbilityKey, number>>>({})
  const [rolled, setRolled] = useState<number[]>([])
  const [skillProfs, setSkillProfs] = useState<string[]>([])
  const [cantrips, setCantrips] = useState<string[]>([])
  const [spells, setSpells] = useState<string[]>([])
  const [gold, setGold] = useState(0)
  const [startingItems, setStartingItems] = useState<string[]>([])

  const cls = classById(classId)!
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)!
  const sp = SPECIES.find((s) => s.id === speciesId)!

  // Personagem provisório para consultar limites de magia
  const draft: Character = useMemo(
    () => newCharacter({ classId, level: 1, speciesId, backgroundId, baseAbilities: scores, backgroundBonuses: bgBonuses }),
    [classId, speciesId, backgroundId, scores, bgBonuses],
  )

  const finalScores = useMemo(() => {
    const r = { ...scores }
    for (const [k, v] of Object.entries(bgBonuses)) r[k as AbilityKey] += v ?? 0
    return r
  }, [scores, bgBonuses])

  const bgTotal = Object.values(bgBonuses).reduce((a, b) => a + (b ?? 0), 0)
  const bgOk = bgTotal === 3 && Object.values(bgBonuses).every((v) => (v ?? 0) <= 2)

  const cantripsNeeded = cantripLimit(draft)
  const spellsNeeded = classId === 'mago' ? 6 : (preparedLimit(draft) ?? 0)
  const maxLvl = maxSpellLevel(draft)

  const classSpells = SPELLS.filter((s) => s.classes.includes(classId))
  const availableCantrips = classSpells.filter((s) => s.level === 0)
  const availableSpells = classSpells.filter((s) => s.level >= 1 && s.level <= Math.max(1, maxLvl))

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return name.trim().length > 0
      case 1: return !!speciesId
      case 2: return bgOk
      case 3: return !!classId
      case 4: return methodComplete()
      case 5: return skillProfs.filter((s) => !bg.skills.includes(s)).length === cls.skillCount
      case 6: return cantrips.length === cantripsNeeded && (spellsNeeded === 0 || spells.length === spellsNeeded)
      default: return true
    }
  }

  function methodComplete(): boolean {
    if (method === 'pointbuy') return pointBuyRemaining(scores) === 0
    if (method === 'array') return Object.keys(arrayAssign).length === 6
    return ABILITIES.every((k) => scores[k] >= 3 && scores[k] <= 20)
  }

  const toggle = (list: string[], setList: (v: string[]) => void, id: string, limit: number) => {
    if (list.includes(id)) setList(list.filter((x) => x !== id))
    else if (list.length < limit) setList([...list, id])
  }

  const finish = () => {
    const allSkills = [...new Set([...bg.skills, ...skillProfs])]
    const char = newCharacter({
      name: name.trim(),
      speciesId,
      backgroundId,
      backgroundBonuses: bgBonuses,
      classId,
      level: 1,
      abilityMethod: method,
      baseAbilities: scores,
      skillProfs: allSkills,
      spellsKnown: [...cantrips, ...spells],
      spellsPrepared: [...cantrips, ...spells],
      gold,
      inventory: startingItems.map((itemId) => ({ uid: uid(), itemId, qty: 1, equipped: false })),
    })
    addCharacter(char)
    onDone()
  }

  return (
    <div>
      <div className="topbar">
        <button className="ghost icon" onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>←</button>
        <div style={{ flex: 1 }}>
          <h1>{STEPS[step]}</h1>
          <div className="sub">Passo {step + 1} de {STEPS.length}</div>
        </div>
      </div>

      <div className="step-dots">
        {STEPS.map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}
      </div>

      {/* ---------- 0. IDENTIDADE ---------- */}
      {step === 0 && (
        <Card title="Quem é seu personagem?">
          <label>Nome do personagem</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Thalia Ventocinza" autoFocus />
          <p className="muted tiny" style={{ marginTop: 12, lineHeight: 1.5 }}>
            Este assistente segue o Livro do Jogador de 2024. Você vai escolher espécie, antecedente
            (que já concede um talento de origem), classe, atributos, perícias, magias e equipamento inicial.
          </p>
        </Card>
      )}

      {/* ---------- 1. ESPÉCIE ---------- */}
      {step === 1 && (
        <>
          {SPECIES.map((s) => (
            <Choice
              key={s.id}
              selected={speciesId === s.id}
              title={s.name}
              desc={`${s.size} · Deslocamento ${s.speed} m${s.darkvision ? ` · Visão no escuro ${s.darkvision} m` : ''}`}
              onClick={() => setSpeciesId(s.id)}
            />
          ))}
          {sp && (
            <Card title={`Traços de ${sp.name}`}>
              {sp.traits.map((t) => (
                <div className="feature" key={t.name}>
                  <h4>{t.name}</h4>
                  <p>{t.desc}</p>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {/* ---------- 2. ANTECEDENTE ---------- */}
      {step === 2 && (
        <>
          {BACKGROUNDS.map((b) => (
            <Choice
              key={b.id}
              selected={backgroundId === b.id}
              title={b.name}
              desc={`${b.abilities.map((a) => ABILITY_NAMES[a]).join(', ')} · Talento: ${featById(b.featId)?.name}`}
              onClick={() => { setBackgroundId(b.id); setBgBonuses({}) }}
            />
          ))}

          <Card title="Bônus de Habilidade do Antecedente">
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Distribua <strong>+2 e +1</strong> ou <strong>+1, +1 e +1</strong> entre as três habilidades do antecedente.
              Distribuído: {bgTotal}/3.
            </p>
            {bg.abilities.map((k) => (
              <div className="spread" key={k} style={{ marginBottom: 8 }}>
                <span>{ABILITY_NAMES[k]}</span>
                <div className="segmented" style={{ width: 170 }}>
                  {[0, 1, 2].map((v) => (
                    <button
                      key={v}
                      className={(bgBonuses[k] ?? 0) === v ? 'on' : ''}
                      onClick={() => setBgBonuses({ ...bgBonuses, [k]: v })}
                    >+{v}</button>
                  ))}
                </div>
              </div>
            ))}
            {!bgOk && <div className="banner warn">O total precisa ser exatamente 3, com no máximo +2 em uma habilidade.</div>}
            <hr />
            <div className="muted tiny">
              <strong className="gold">Talento de Origem:</strong> {featById(bg.featId)?.name} — {featById(bg.featId)?.desc}
              <br /><br />
              <strong className="gold">Perícias:</strong> {bg.skills.map((s) => skillById(s).name).join(', ')}
              <br /><strong className="gold">Ferramenta:</strong> {bg.tool}
              <br /><strong className="gold">Equipamento:</strong> {bg.equipment}
            </div>
          </Card>
        </>
      )}

      {/* ---------- 3. CLASSE ---------- */}
      {step === 3 && (
        <>
          {CLASSES.map((c) => (
            <Choice
              key={c.id}
              selected={classId === c.id}
              title={c.name}
              desc={`Dado de Vida d${c.hitDie} · ${c.primary} · Salvaguardas: ${c.saves.map((s) => ABILITY_NAMES[s]).join(', ')}`}
              onClick={() => { setClassId(c.id); setSkillProfs([]); setCantrips([]); setSpells([]) }}
            />
          ))}
          <Card title={`${cls.name} — Nível 1`}>
            <div className="muted tiny" style={{ marginBottom: 10 }}>
              <strong className="gold">Armaduras:</strong> {cls.armor.length ? cls.armor.join(', ') : 'Nenhuma'}<br />
              <strong className="gold">Armas:</strong> {cls.weapons.join(', ')}<br />
              <strong className="gold">Equipamento inicial:</strong> {cls.startingEquipment}
            </div>
            {cls.features.filter((f) => f.level === 1).map((f) => (
              <div className="feature" key={f.name}>
                <h4>{f.name}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* ---------- 4. ATRIBUTOS ---------- */}
      {step === 4 && (
        <>
          <Card title="Método de distribuição">
            <Segmented
              value={method}
              onChange={(m) => {
                setMethod(m)
                setScores(emptyScores(m === 'pointbuy' ? 8 : 10))
                setArrayAssign({})
                setRolled([])
              }}
              options={[
                { value: 'array', label: 'Array Padrão' },
                { value: 'pointbuy', label: 'Compra de Pontos' },
                { value: 'manual', label: 'Rolagem / Manual' },
              ]}
            />

            {method === 'array' && (
              <>
                <p className="muted tiny" style={{ margin: '12px 0 8px' }}>
                  Distribua os valores <strong>15, 14, 13, 12, 10, 8</strong> entre as habilidades.
                </p>
                {ABILITIES.map((k) => {
                  const usados = Object.entries(arrayAssign).filter(([kk]) => kk !== k).map(([, v]) => v)
                  const disponiveis = [...STANDARD_ARRAY]
                  for (const u of usados) {
                    const i = disponiveis.indexOf(u!)
                    if (i >= 0) disponiveis.splice(i, 1)
                  }
                  return (
                    <div className="spread" key={k} style={{ marginBottom: 8 }}>
                      <span style={{ width: 110 }}>{ABILITY_NAMES[k]}</span>
                      <select
                        style={{ flex: 1 }}
                        value={arrayAssign[k] ?? ''}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          const next = { ...arrayAssign }
                          if (!v) delete next[k]
                          else next[k] = v
                          setArrayAssign(next)
                          setScores((s) => ({ ...s, [k]: v || 10 }))
                        }}
                      >
                        <option value="">—</option>
                        {[...new Set([...disponiveis, arrayAssign[k]].filter(Boolean) as number[])]
                          .sort((a, b) => b - a)
                          .map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  )
                })}
              </>
            )}

            {method === 'pointbuy' && (
              <>
                <p className="muted tiny" style={{ margin: '12px 0 8px' }}>
                  27 pontos. Valores de 8 a 15 (custo: 14 = 7 pts, 15 = 9 pts).
                  Restam <strong className={pointBuyRemaining(scores) < 0 ? '' : 'gold'}>{pointBuyRemaining(scores)}</strong> pontos.
                </p>
                {ABILITIES.map((k) => (
                  <div className="spread" key={k} style={{ marginBottom: 8 }}>
                    <span style={{ width: 110 }}>{ABILITY_NAMES[k]}</span>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        className="sm"
                        disabled={scores[k] <= 8}
                        onClick={() => setScores({ ...scores, [k]: scores[k] - 1 })}
                      >−</button>
                      <strong style={{ minWidth: 30, textAlign: 'center' }}>{scores[k]}</strong>
                      <button
                        className="sm"
                        disabled={scores[k] >= 15 || pointBuyRemaining(scores) < (POINT_BUY_COST[scores[k] + 1] - POINT_BUY_COST[scores[k]])}
                        onClick={() => setScores({ ...scores, [k]: scores[k] + 1 })}
                      >+</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {method === 'manual' && (
              <>
                <p className="muted tiny" style={{ margin: '12px 0 8px' }}>
                  Digite os valores que você rolou na mesa, ou use o botão para rolar 4d6 descartando o menor.
                </p>
                <button className="gold" style={{ width: '100%', marginBottom: 10 }} onClick={() => {
                  const results = Array.from({ length: 6 }, () => roll4d6DropLowest())
                  setRolled(results.map((r) => r.total))
                }}>🎲 Rolar 4d6 (descartar o menor) × 6</button>
                {rolled.length > 0 && (
                  <div className="banner">
                    Valores rolados: <strong>{rolled.join(', ')}</strong> — digite-os nos campos abaixo como preferir.
                  </div>
                )}
                {ABILITIES.map((k) => (
                  <div className="spread" key={k} style={{ marginBottom: 8 }}>
                    <span style={{ width: 110 }}>{ABILITY_NAMES[k]}</span>
                    <input
                      type="number" inputMode="numeric" min={3} max={20} style={{ width: 90 }}
                      value={scores[k]}
                      onChange={(e) => setScores({ ...scores, [k]: Math.max(3, Math.min(20, Number(e.target.value) || 3)) })}
                    />
                  </div>
                ))}
              </>
            )}
          </Card>

          <Card title="Resultado final (com bônus do antecedente)">
            <div className="grid g6">
              {ABILITIES.map((k) => (
                <div className="ability" key={k}>
                  <div className="name">{ABILITY_NAMES[k].slice(0, 3)}</div>
                  <div className="mod">{fmtMod(abilityMod(finalScores[k]))}</div>
                  <div className="score">{finalScores[k]}{bgBonuses[k] ? ` (+${bgBonuses[k]})` : ''}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ---------- 5. PERÍCIAS ---------- */}
      {step === 5 && (
        <Card title={`Escolha ${cls.skillCount} perícias de ${cls.name}`}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Seu antecedente já concede: <strong className="gold">{bg.skills.map((s) => skillById(s).name).join(', ')}</strong>.
            Escolhidas: {skillProfs.filter((s) => !bg.skills.includes(s)).length}/{cls.skillCount}
          </p>
          {cls.skillChoices.map((id) => {
            const s = skillById(id)
            const fromBg = bg.skills.includes(id)
            const chosen = skillProfs.includes(id)
            const escolhidas = skillProfs.filter((x) => !bg.skills.includes(x)).length
            return (
              <button
                key={id}
                className={`choice${chosen || fromBg ? ' on' : ''}`}
                disabled={fromBg}
                onClick={() => {
                  if (chosen) setSkillProfs(skillProfs.filter((x) => x !== id))
                  else if (escolhidas < cls.skillCount) setSkillProfs([...skillProfs, id])
                }}
              >
                <strong>{chosen || fromBg ? '✓ ' : ''}{s.name}</strong>
                <span>{ABILITY_NAMES[s.ability]}{fromBg ? ' · já concedida pelo antecedente' : ''}</span>
              </button>
            )
          })}
          <hr />
          <div className="muted tiny">
            Perícias fora da lista da classe também aparecem na ficha, mas só são treinadas se
            concedidas pelo antecedente, espécie ou talentos.
          </div>
          <details style={{ marginTop: 8 }}>
            <summary className="muted">Ver todas as perícias e habilidades</summary>
            <div className="grid g2" style={{ marginTop: 8 }}>
              {SKILLS.map((s) => (
                <div key={s.id} className="tiny muted">{s.name} <span className="gold">({ABILITY_NAMES[s.ability].slice(0, 3)})</span></div>
              ))}
            </div>
          </details>
        </Card>
      )}

      {/* ---------- 6. MAGIAS ---------- */}
      {step === 6 && (
        <>
          {cls.caster === 'nenhum' ? (
            <Card title="Sem conjuração">
              <p className="muted">
                {cls.name} não conjura magias no 1º nível. Algumas subclasses (como Cavaleiro Arcano e
                Trapaceiro Arcano) desbloqueiam conjuração no 3º nível — o assistente de evolução avisará.
              </p>
            </Card>
          ) : (
            <>
              {cantripsNeeded > 0 && (
                <Card title={`Truques (${cantrips.length}/${cantripsNeeded})`}>
                  {availableCantrips.map((s) => (
                    <button
                      key={s.id}
                      className={`choice${cantrips.includes(s.id) ? ' on' : ''}`}
                      onClick={() => toggle(cantrips, setCantrips, s.id, cantripsNeeded)}
                    >
                      <strong>{cantrips.includes(s.id) ? '✓ ' : ''}{s.name}</strong>
                      <span>{s.school} · {s.castingTime} · {s.range}</span>
                      <span>{s.desc}</span>
                    </button>
                  ))}
                </Card>
              )}
              {spellsNeeded > 0 && (
                <Card title={`${classId === 'mago' ? 'Magias no grimório' : 'Magias preparadas'} (${spells.length}/${spellsNeeded})`}>
                  <p className="muted tiny" style={{ marginBottom: 10 }}>
                    {classId === 'mago'
                      ? 'Você começa com 6 magias de 1º nível no grimório.'
                      : `Você prepara ${spellsNeeded} magia(s) de até ${maxLvl}º nível.`}
                  </p>
                  {availableSpells.map((s) => (
                    <button
                      key={s.id}
                      className={`choice${spells.includes(s.id) ? ' on' : ''}`}
                      onClick={() => toggle(spells, setSpells, s.id, spellsNeeded)}
                    >
                      <strong>{spells.includes(s.id) ? '✓ ' : ''}{s.name} <span className="muted">({s.level}º)</span></strong>
                      <span>{s.school} · {s.castingTime} · {s.range} · {s.duration}{s.concentration ? ' · Concentração' : ''}</span>
                      <span>{s.desc}</span>
                    </button>
                  ))}
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* ---------- 7. EQUIPAMENTO ---------- */}
      {step === 7 && (
        <>
          <Card title="Equipamento inicial da classe">
            <p className="muted tiny">{cls.startingEquipment}</p>
            <p className="muted tiny" style={{ marginTop: 6 }}>Do antecedente: {bg.equipment}</p>
          </Card>

          <Card title="Selecione os itens para a mochila">
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Marque o que você levou. Depois é possível equipar armas e armaduras na aba Itens — a CA e os
              ataques são recalculados automaticamente.
            </p>
            <details open>
              <summary>Armas ({startingItems.filter((i) => WEAPONS.some((w) => w.id === i)).length})</summary>
              <div style={{ marginTop: 8 }}>
                {WEAPONS.map((w) => (
                  <button key={w.id} className={`choice${startingItems.includes(w.id) ? ' on' : ''}`}
                    onClick={() => setStartingItems((p) => p.includes(w.id) ? p.filter((x) => x !== w.id) : [...p, w.id])}>
                    <strong>{startingItems.includes(w.id) ? '✓ ' : ''}{w.name}</strong>
                    <span>{w.weapon!.damage} {w.weapon!.damageType} · {w.weapon!.category} · Maestria: {w.weapon!.mastery}</span>
                  </button>
                ))}
              </div>
            </details>
            <details>
              <summary>Armaduras e escudos</summary>
              <div style={{ marginTop: 8 }}>
                {[...ARMORS, SHIELD].map((a) => (
                  <button key={a.id} className={`choice${startingItems.includes(a.id) ? ' on' : ''}`}
                    onClick={() => setStartingItems((p) => p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id])}>
                    <strong>{startingItems.includes(a.id) ? '✓ ' : ''}{a.name}</strong>
                    <span>CA {a.armor!.baseAC}{a.kind === 'escudo' ? ' (bônus)' : ''} · {a.kind === 'escudo' ? 'Escudo' : a.armor!.category}</span>
                  </button>
                ))}
              </div>
            </details>
            <details>
              <summary>Equipamento geral</summary>
              <div style={{ marginTop: 8 }}>
                {GEAR.map((g) => (
                  <button key={g.id} className={`choice${startingItems.includes(g.id) ? ' on' : ''}`}
                    onClick={() => setStartingItems((p) => p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id])}>
                    <strong>{startingItems.includes(g.id) ? '✓ ' : ''}{g.name}</strong>
                    {g.desc && <span>{g.desc}</span>}
                  </button>
                ))}
              </div>
            </details>
          </Card>

          <Card title="Moedas de ouro">
            <input type="number" inputMode="numeric" min={0} value={gold} onChange={(e) => setGold(Math.max(0, Number(e.target.value) || 0))} />
          </Card>
        </>
      )}

      <div className="row" style={{ marginTop: 16, marginBottom: 20 }}>
        {step > 0 && <button style={{ flex: 1 }} onClick={() => setStep(step - 1)}>Voltar</button>}
        {step < STEPS.length - 1 ? (
          <button className="primary" style={{ flex: 2 }} disabled={!canAdvance()} onClick={() => setStep(step + 1)}>
            Continuar
          </button>
        ) : (
          <button className="gold" style={{ flex: 2 }} onClick={finish}>✓ Criar Personagem</button>
        )}
      </div>
      {!canAdvance() && step < STEPS.length - 1 && (
        <div className="muted tiny center" style={{ marginBottom: 20 }}>Complete as escolhas deste passo para continuar.</div>
      )}
    </div>
  )
}
