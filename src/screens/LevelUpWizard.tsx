import { useMemo, useState } from 'react'
import type { AbilityKey, AsiChoice, Character, Spell } from '../types'
import { ABILITIES, ABILITY_NAMES } from '../types'
import { classById } from '../data/classes'
import { SPELLS, spellById } from '../data/spells'
import { GENERAL_FEATS, featById } from '../data/feats'
import {
  abilityMod, cantripLimit, finalAbilities, levelUpSummary, maxSpellLevel, preparedLimit,
} from '../engine/rules'
import { rollHitDie } from '../engine/dice'
import { useStore } from '../store/store'
import { Card, Choice, Segmented, Sheet } from '../components/ui'

type AsiMode = 'asi2' | 'asi11' | 'feat'

export function LevelUpWizard({ char, onClose }: { char: Character; onClose: () => void }) {
  const update = useStore((s) => s.updateCharacter)
  const novoNivel = char.level + 1
  const cls = classById(char.classId)!
  const resumo = useMemo(() => levelUpSummary(char, novoNivel), [char, novoNivel])

  const [hpMode, setHpMode] = useState<'media' | 'rolar'>('media')
  const [hpRoll, setHpRoll] = useState<number | null>(null)
  const [subclassId, setSubclassId] = useState<string | undefined>(char.subclassId)
  const [asiMode, setAsiMode] = useState<AsiMode>('asi2')
  const [asiAbilities, setAsiAbilities] = useState<AbilityKey[]>([])
  const [featId, setFeatId] = useState<string>('')
  const [novosTruques, setNovosTruques] = useState<string[]>([])
  const [novasMagias, setNovasMagias] = useState<string[]>([])

  if (!resumo) return null
  if (novoNivel > 20) {
    return (
      <Sheet title="Nível máximo" onClose={onClose}>
        <p className="muted">Seu personagem já está no nível 20, o máximo das regras do PHB 2024.</p>
      </Sheet>
    )
  }

  const abs = finalAbilities(char)
  const draftDepois: Character = { ...char, level: novoNivel }
  const truquesAtuais = char.spellsKnown.filter((id) => spellById(id)?.level === 0).length
  const truquesNovos = Math.max(0, cantripLimit(draftDepois) - truquesAtuais)
  const maxLvl = maxSpellLevel(draftDepois)

  const magiasAtuais = char.spellsKnown.filter((id) => (spellById(id)?.level ?? 0) > 0).length
  const limiteDepois = preparedLimit(draftDepois) ?? 0
  const magiasNovas = Math.max(0, limiteDepois - magiasAtuais)

  const disponiveisTruques = SPELLS.filter(
    (s) => s.level === 0 && s.classes.includes(char.classId) && !char.spellsKnown.includes(s.id),
  )
  const disponiveisMagias = SPELLS.filter(
    (s) => s.level >= 1 && s.level <= maxLvl && s.classes.includes(char.classId) && !char.spellsKnown.includes(s.id),
  )

  const precisaSubclasse = resumo.needsSubclass && !subclassId
  const asiOk = !resumo.needsAsi || (
    asiMode === 'feat' ? !!featId
      : asiMode === 'asi2' ? asiAbilities.length === 1
        : asiAbilities.length === 2
  )
  const truquesOk = novosTruques.length === truquesNovos
  const magiasOk = novasMagias.length === magiasNovas
  const podeConfirmar = !precisaSubclasse && asiOk && truquesOk && magiasOk

  const toggleAbility = (k: AbilityKey, limite: number) => {
    if (asiAbilities.includes(k)) setAsiAbilities(asiAbilities.filter((x) => x !== k))
    else if (asiAbilities.length < limite) setAsiAbilities([...asiAbilities, k])
  }

  const toggleSpell = (list: string[], set: (v: string[]) => void, id: string, limite: number) => {
    if (list.includes(id)) set(list.filter((x) => x !== id))
    else if (list.length < limite) set([...list, id])
  }

  const confirmar = () => {
    const asiChoices: AsiChoice[] = [...char.asiChoices]
    if (resumo.needsAsi) {
      if (asiMode === 'feat') {
        const feat = featById(featId)
        const bump: Partial<Record<AbilityKey, number>> = {}
        // Talentos gerais com incremento dão +1 na primeira habilidade elegível escolhida
        if (feat?.abilityIncrease?.length && asiAbilities[0]) bump[asiAbilities[0]] = 1
        asiChoices.push({ level: novoNivel, type: 'feat', featId, abilities: bump })
      } else if (asiMode === 'asi2') {
        asiChoices.push({ level: novoNivel, type: 'asi', abilities: { [asiAbilities[0]]: 2 } })
      } else {
        const bump: Partial<Record<AbilityKey, number>> = {}
        for (const k of asiAbilities) bump[k] = 1
        asiChoices.push({ level: novoNivel, type: 'asi', abilities: bump })
      }
    }

    const hpRolls = [...char.hpRolls]
    hpRolls[novoNivel - 2] = hpMode === 'rolar' ? hpRoll : null

    update(char.id, {
      level: novoNivel,
      subclassId: subclassId ?? char.subclassId,
      asiChoices,
      hpRolls,
      spellsKnown: [...char.spellsKnown, ...novosTruques, ...novasMagias],
      spellsPrepared: [...char.spellsPrepared, ...novosTruques, ...novasMagias],
    })
    onClose()
  }

  const featSelecionado = featById(featId)

  return (
    <Sheet title={`⬆ Subir para o Nível ${novoNivel}`} onClose={onClose}>
      <div className="banner">
        <strong className="gold">{cls.name} nível {novoNivel}</strong>
        {resumo.proficiencyChanged && <div>Seu bônus de proficiência sobe para +{resumo.proficiencyBonus}!</div>}
      </div>

      {/* --- Pontos de Vida --- */}
      <Card title="Pontos de Vida">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          Dado de Vida: d{resumo.hitDie}. Use a média fixa ({resumo.hitDie / 2 + 1}) ou role o dado.
        </p>
        <Segmented
          value={hpMode}
          onChange={(m) => { setHpMode(m); if (m === 'media') setHpRoll(null) }}
          options={[
            { value: 'media', label: `Média (${resumo.hitDie / 2 + 1})` },
            { value: 'rolar', label: 'Rolar o dado' },
          ]}
        />
        {hpMode === 'rolar' && (
          <div style={{ marginTop: 10 }}>
            <button className="gold" style={{ width: '100%' }} onClick={() => setHpRoll(rollHitDie(resumo.hitDie))}>
              🎲 Rolar 1d{resumo.hitDie}
            </button>
            {hpRoll !== null && (
              <div className="center" style={{ marginTop: 8 }}>
                Resultado: <strong className="gold" style={{ fontSize: '1.3rem' }}>{hpRoll}</strong>
                <span className="muted"> + {abilityMod(abs.con)} de Constituição</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* --- Novas características --- */}
      {resumo.features.length > 0 && (
        <Card title="Novas Habilidades Destravadas">
          {resumo.features.map((f) => (
            <div className="feature" key={f.name}>
              <h4>{f.name}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </Card>
      )}

      {/* --- Subclasse --- */}
      {resumo.needsSubclass && (
        <Card title="Escolha sua Subclasse">
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Esta escolha é permanente e concede características agora e em níveis futuros.
          </p>
          {cls.subclasses.map((s) => (
            <Choice key={s.id} selected={subclassId === s.id} title={s.name} desc={s.desc} onClick={() => setSubclassId(s.id)} />
          ))}
          {subclassId && (
            <div style={{ marginTop: 10 }}>
              {cls.subclasses.find((s) => s.id === subclassId)!.features.map((f) => (
                <div className="feature" key={f.name}>
                  <h4>{f.name} <span className="muted tiny">· Nível {f.level}</span></h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* --- Incremento de atributo / talento --- */}
      {resumo.needsAsi && (
        <Card title="Incremento de Atributo ou Talento">
          <Segmented
            value={asiMode}
            onChange={(m) => { setAsiMode(m); setAsiAbilities([]); setFeatId('') }}
            options={[
              { value: 'asi2', label: '+2 em uma' },
              { value: 'asi11', label: '+1 em duas' },
              { value: 'feat', label: 'Talento' },
            ]}
          />

          {asiMode !== 'feat' && (
            <div style={{ marginTop: 12 }}>
              <p className="muted tiny" style={{ marginBottom: 8 }}>
                Selecione {asiMode === 'asi2' ? '1 habilidade (recebe +2)' : '2 habilidades (cada uma recebe +1)'}.
                Máximo de 20 por habilidade.
              </p>
              {ABILITIES.map((k) => {
                const atual = abs[k]
                const incremento = asiMode === 'asi2' ? 2 : 1
                const noLimite = atual + incremento > 20
                const sel = asiAbilities.includes(k)
                return (
                  <button key={k} className={`choice${sel ? ' on' : ''}`} disabled={noLimite && !sel}
                    onClick={() => toggleAbility(k, asiMode === 'asi2' ? 1 : 2)}>
                    <strong>{sel ? '✓ ' : ''}{ABILITY_NAMES[k]}</strong>
                    <span>
                      {atual} → {Math.min(20, atual + (sel ? incremento : 0))}
                      {noLimite ? ' · já no máximo (20)' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {asiMode === 'feat' && (
            <div style={{ marginTop: 12 }}>
              {GENERAL_FEATS.filter((f) => f.id !== 'aumento-de-habilidade').map((f) => (
                <Choice key={f.id} selected={featId === f.id} title={f.name} desc={f.desc}
                  onClick={() => { setFeatId(f.id); setAsiAbilities([]) }} />
              ))}
              {featSelecionado?.abilityIncrease?.length && (
                <div style={{ marginTop: 10 }}>
                  <label>Este talento também concede +1 em uma habilidade:</label>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {featSelecionado.abilityIncrease.map((k) => (
                      <button key={k} className={`sm${asiAbilities[0] === k ? ' gold' : ''}`} onClick={() => setAsiAbilities([k])}>
                        {ABILITY_NAMES[k]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* --- Espaços de magia --- */}
      {(resumo.newSlots.length > 0 || resumo.pactChanged) && (
        <Card title="Espaços de Magia">
          {resumo.newSlots.map((s) => (
            <div className="spread" key={s.level} style={{ marginBottom: 6 }}>
              <span>Espaços de {s.level}º nível</span>
              <strong className="gold">+{s.gained} (total {s.total})</strong>
            </div>
          ))}
          {resumo.pactChanged && (
            <div className="spread">
              <span>Espaços de Pacto</span>
              <strong className="gold">{resumo.pactChanged.count} de {resumo.pactChanged.level}º nível</strong>
            </div>
          )}
        </Card>
      )}

      {/* --- Novos truques --- */}
      {truquesNovos > 0 && (
        <Card title={`Novos Truques (${novosTruques.length}/${truquesNovos})`}>
          {disponiveisTruques.map((s: Spell) => (
            <button key={s.id} className={`choice${novosTruques.includes(s.id) ? ' on' : ''}`}
              onClick={() => toggleSpell(novosTruques, setNovosTruques, s.id, truquesNovos)}>
              <strong>{novosTruques.includes(s.id) ? '✓ ' : ''}{s.name}</strong>
              <span>{s.school} · {s.castingTime} · {s.range}</span>
              <span>{s.desc}</span>
            </button>
          ))}
        </Card>
      )}

      {/* --- Novas magias --- */}
      {magiasNovas > 0 && (
        <Card title={`Novas Magias (${novasMagias.length}/${magiasNovas})`}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Você agora {char.classId === 'mago' ? 'adiciona ao grimório' : 'prepara'} até {limiteDepois} magias,
            de até {maxLvl}º nível.
          </p>
          {disponiveisMagias.map((s) => (
            <button key={s.id} className={`choice${novasMagias.includes(s.id) ? ' on' : ''}`}
              onClick={() => toggleSpell(novasMagias, setNovasMagias, s.id, magiasNovas)}>
              <strong>{novasMagias.includes(s.id) ? '✓ ' : ''}{s.name} <span className="muted">({s.level}º)</span></strong>
              <span>{s.school} · {s.castingTime} · {s.range}{s.concentration ? ' · Concentração' : ''}</span>
              <span>{s.desc}</span>
            </button>
          ))}
        </Card>
      )}

      <button className="gold" style={{ width: '100%' }} disabled={!podeConfirmar} onClick={confirmar}>
        ✓ Confirmar Nível {novoNivel}
      </button>
      {!podeConfirmar && (
        <div className="muted tiny center" style={{ marginTop: 8 }}>
          {precisaSubclasse && 'Escolha uma subclasse. '}
          {!asiOk && 'Complete o incremento de atributo ou talento. '}
          {!truquesOk && `Escolha ${truquesNovos} truque(s). `}
          {!magiasOk && `Escolha ${magiasNovas} magia(s).`}
        </div>
      )}
    </Sheet>
  )
}
