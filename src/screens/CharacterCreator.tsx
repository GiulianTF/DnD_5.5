import { useMemo, useState } from 'react'
import type { AbilityKey, AbilityMethod, AbilityScores, Character, EquipmentOption, InventoryEntry } from '../types'
import { ABILITIES, ABILITY_NAMES } from '../types'
import { SPECIES } from '../data/species'
import { BACKGROUNDS } from '../data/backgrounds'
import { CLASSES, classById } from '../data/classes'
import { SKILLS, skillById } from '../data/skills'
import { SPELLS } from '../data/spells'
import { ORIGIN_FEATS, featById } from '../data/feats'
import { WEAPONS, ARMORS, SHIELD, GEAR, MASTERY_DESC, itemById } from '../data/equipment'
import { abilityMod, fmtMod, cantripLimit, preparedLimit, maxSpellLevel, masteryEligibleWeapons } from '../engine/rules'
import { POINT_BUY_COST, STANDARD_ARRAY, emptyScores, pointBuyRemaining } from '../engine/pointbuy'
import { roll4d6DropLowest } from '../engine/dice'
import { uid } from '../engine/uid'
import { newCharacter, useStore } from '../store/store'
import { Card, Choice, ChoiceGroup, Segmented } from '../components/ui'

const STEPS = ['Identidade', 'Espécie', 'Antecedente', 'Classe', 'Atributos', 'Perícias', 'Magias', 'Equipamento'] as const

export function CharacterCreator({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const addCharacter = useStore((s) => s.addCharacter)
  const [step, setStep] = useState(0)

  const [name, setName] = useState('')
  const [speciesId, setSpeciesId] = useState('humano')
  const [speciesChoices, setSpeciesChoices] = useState<Record<string, string>>({})
  const [speciesSkills, setSpeciesSkills] = useState<string[]>([])
  const [originFeats, setOriginFeats] = useState<string[]>([])
  const [backgroundId, setBackgroundId] = useState('')
  const [bgBonuses, setBgBonuses] = useState<Partial<Record<AbilityKey, number>>>({})
  /** Regra opcional de mesa: distribuir os bônus do antecedente em qualquer atributo. */
  const [bgFree, setBgFree] = useState(false)
  const [classId, setClassId] = useState('guerreiro')
  const [classChoices, setClassChoices] = useState<Record<string, string>>({})
  const [masteries, setMasteries] = useState<string[]>([])
  const [method, setMethod] = useState<AbilityMethod>('array')
  const [scores, setScores] = useState<AbilityScores>(emptyScores(8))
  const [arrayAssign, setArrayAssign] = useState<Partial<Record<AbilityKey, number>>>({})
  /** Texto cru dos campos manuais — a validação (3..20) só acontece ao sair do campo. */
  const [manualText, setManualText] = useState<Partial<Record<AbilityKey, string>>>({})
  const [rolled, setRolled] = useState<number[]>([])
  const [skillProfs, setSkillProfs] = useState<string[]>([])
  const [cantrips, setCantrips] = useState<string[]>([])
  const [spells, setSpells] = useState<string[]>([])
  const [classEquipId, setClassEquipId] = useState('A')
  const [bgEquipId, setBgEquipId] = useState('A')
  const [extraGold, setExtraGold] = useState(0)
  const [extraItems, setExtraItems] = useState<string[]>([])

  const cls = classById(classId)!
  const bg = BACKGROUNDS.find((b) => b.id === backgroundId)
  const sp = SPECIES.find((s) => s.id === speciesId)!

  // Escolhas de espécie e de classe já disponíveis no nível 1
  const speciesGroups = (sp.choices ?? []).filter((g) => (g.level ?? 1) <= 1)
  const classGroups = (cls.choices ?? []).filter((g) => (g.level ?? 1) <= 1)
  const extraSkills = sp.extraSkills ?? 0
  const bgSkills = bg?.skills ?? []

  const classEquip = cls.equipmentOptions.find((o) => o.id === classEquipId) ?? cls.equipmentOptions[0]
  const bgEquip = bg?.equipmentOptions.find((o) => o.id === bgEquipId) ?? bg?.equipmentOptions[0]

  // Personagem provisório para consultar limites de magia e armas elegíveis à maestria
  const draft: Character = useMemo(
    () => newCharacter({ classId, level: 1, speciesId, backgroundId, baseAbilities: scores, backgroundBonuses: bgBonuses }),
    [classId, speciesId, backgroundId, scores, bgBonuses],
  )

  // Maestria em Armas (Guerreiro 3 no nível 1; Bárbaro, Paladino, Patrulheiro e Ladino 2)
  const masteryNeeded = cls.masteryCount?.(1) ?? 0
  const masteryWeapons = useMemo(() => masteryEligibleWeapons(draft), [draft])

  const finalScores = useMemo(() => {
    const r = { ...scores }
    for (const [k, v] of Object.entries(bgBonuses)) r[k as AbilityKey] += v ?? 0
    return r
  }, [scores, bgBonuses])

  /** Atributos que podem receber os bônus do antecedente (3 do antecedente ou todos, na regra livre). */
  const bgAbilityOptions = bgFree ? ABILITIES : (bg?.abilities ?? [])
  const bgTotal = Object.values(bgBonuses).reduce((a, b) => a + (b ?? 0), 0)
  const bgOk = !!bg && bgTotal === 3 && Object.values(bgBonuses).every((v) => (v ?? 0) <= 2)

  const cantripsNeeded = cantripLimit(draft)
  const spellsNeeded = classId === 'mago' ? 6 : (preparedLimit(draft) ?? 0)
  const maxLvl = maxSpellLevel(draft)

  const classSpells = SPELLS.filter((s) => s.classes.includes(classId))
  const availableCantrips = classSpells.filter((s) => s.level === 0)
  const availableSpells = classSpells.filter((s) => s.level >= 1 && s.level <= Math.max(1, maxLvl))

  // Perícias já garantidas por antecedente, espécie ou escolhas de espécie
  const skillsFromChoices = speciesGroups
    .map((g) => g.options.find((o) => o.id === speciesChoices[g.id])?.grantsSkill)
    .filter((s): s is string => !!s)
  const skillsJaConcedidas = [...new Set([...bgSkills, ...speciesSkills, ...skillsFromChoices])]
  const escolhidasDaClasse = skillProfs.filter((s) => !skillsJaConcedidas.includes(s)).length

  const especieOk =
    speciesGroups.every((g) => !!speciesChoices[g.id])
    && speciesSkills.length === extraSkills
    && (!sp.extraOriginFeat || originFeats.length === 1)

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return name.trim().length > 0
      case 1: return !!speciesId && especieOk
      case 2: return bgOk
      case 3: return !!classId && classGroups.every((g) => !!classChoices[g.id]) && masteries.length === masteryNeeded
      case 4: return methodComplete()
      case 5: return escolhidasDaClasse === cls.skillCount
      case 6: return cantrips.length === cantripsNeeded && (spellsNeeded === 0 || spells.length === spellsNeeded)
      default: return true
    }
  }

  function methodComplete(): boolean {
    if (method === 'pointbuy') return pointBuyRemaining(scores) === 0
    if (method === 'array') return Object.keys(arrayAssign).length === 6
    return ABILITIES.every((k) => {
      const texto = manualText[k] ?? String(scores[k])
      const n = Number(texto)
      return texto.trim() !== '' && Number.isFinite(n) && n >= 3 && n <= 20 && scores[k] >= 3 && scores[k] <= 20
    })
  }

  const toggle = (list: string[], setList: (v: string[]) => void, id: string, limit: number) => {
    if (list.includes(id)) setList(list.filter((x) => x !== id))
    else if (list.length < limit) setList([...list, id])
  }

  /** Junta os itens das opções escolhidas com os extras marcados manualmente. */
  const inventarioInicial = (): InventoryEntry[] => {
    const somar = new Map<string, number>()
    for (const opt of [classEquip, bgEquip]) {
      for (const g of opt?.items ?? []) somar.set(g.itemId, (somar.get(g.itemId) ?? 0) + (g.qty ?? 1))
    }
    for (const id of extraItems) somar.set(id, (somar.get(id) ?? 0) + 1)
    return [...somar.entries()]
      .filter(([itemId]) => !!itemById(itemId))
      .map(([itemId, qty]) => ({ uid: uid(), itemId, qty, equipped: false }))
  }

  const ouroTotal = (classEquip?.gold ?? 0) + (bgEquip?.gold ?? 0) + extraGold

  const finish = () => {
    const allSkills = [...new Set([...bgSkills, ...speciesSkills, ...skillProfs])]
    const char = newCharacter({
      name: name.trim(),
      speciesId,
      speciesChoices,
      originFeats,
      backgroundId,
      backgroundBonuses: bgBonuses,
      freeBackgroundBonuses: bgFree,
      classId,
      classChoices,
      weaponMasteries: masteries,
      level: 1,
      abilityMethod: method,
      baseAbilities: scores,
      skillProfs: allSkills,
      spellsKnown: [...cantrips, ...spells],
      spellsPrepared: [...cantrips, ...spells],
      gold: ouroTotal,
      inventory: inventarioInicial(),
    })
    addCharacter(char)
    onDone()
  }

  const listaDeItens = (opt: EquipmentOption) =>
    opt.items.map((g) => `${g.qty && g.qty > 1 ? `${g.qty}× ` : ''}${itemById(g.itemId)?.name ?? g.itemId}`)

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
          <Card title="Escolha a espécie">
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Toque numa espécie para selecioná-la e ver os traços; use a seta para abrir sem escolher.
            </p>
            {SPECIES.map((s) => (
              <Choice
                key={s.id}
                selected={speciesId === s.id}
                title={s.name}
                desc={`${s.size} · Deslocamento ${s.speed} m${s.darkvision ? ` · Visão no escuro ${s.darkvision} m` : ''}`}
                defaultOpen={speciesId === s.id}
                details={
                  <>
                    {s.traits.map((t) => (
                      <div className="feature" key={t.name}>
                        <h4>{t.name}</h4>
                        <p>{t.desc}</p>
                      </div>
                    ))}
                    {(s.extraSkills ?? 0) > 0 && <p><strong className="gold">Perícias extras:</strong> {s.extraSkills}</p>}
                    {s.extraOriginFeat && <p><strong className="gold">Talento de Origem adicional:</strong> sim</p>}
                    {(s.choices ?? []).some((g) => (g.level ?? 1) > 1) && (
                      <p>Esta espécie ainda tem escolhas que só aparecem em níveis mais altos — o assistente
                        de evolução vai pedi-las na hora certa.</p>
                    )}
                  </>
                }
                onClick={() => {
                  setSpeciesId(s.id)
                  setSpeciesChoices({})
                  setSpeciesSkills([])
                  setOriginFeats([])
                }}
              />
            ))}
          </Card>

          {/* Escolhas obrigatórias da espécie (cor do dragão, dádiva de gigante, linhagem...) */}
          {speciesGroups.map((g) => (
            <ChoiceGroup
              key={g.id}
              group={g}
              value={speciesChoices[g.id]}
              onChange={(optionId) => setSpeciesChoices({ ...speciesChoices, [g.id]: optionId })}
            />
          ))}

          {/* Humano: perícia extra do traço Habilidoso */}
          {extraSkills > 0 && (
            <Card title={`Perícia adicional (${speciesSkills.length}/${extraSkills})`}>
              <p className="muted tiny" style={{ marginBottom: 10 }}>
                {sp.name} concede proficiência em {extraSkills} perícia à sua escolha.
              </p>
              {SKILLS.map((s) => {
                const doBg = bgSkills.includes(s.id)
                const marcada = speciesSkills.includes(s.id)
                return (
                  <button
                    key={s.id}
                    className={`choice${marcada ? ' on' : ''}`}
                    disabled={doBg}
                    onClick={() => toggle(speciesSkills, setSpeciesSkills, s.id, extraSkills)}
                  >
                    <strong>{marcada ? '✓ ' : ''}{s.name}</strong>
                    <span>{ABILITY_NAMES[s.ability]}{doBg ? ' · já concedida pelo antecedente' : ''}</span>
                  </button>
                )
              })}
            </Card>
          )}

          {/* Humano: talento de Origem adicional do traço Versátil */}
          {sp.extraOriginFeat && (
            <Card title="Talento de Origem adicional">
              <p className="muted tiny" style={{ marginBottom: 10 }}>
                O traço <strong>Versátil</strong> de {sp.name} concede um talento de Origem à sua escolha,
                além do talento que vem do seu antecedente
                {bg ? ` (${featById(bg.featId)?.name})` : ''}.
              </p>
              {ORIGIN_FEATS.map((f) => {
                const jaDoAntecedente = !!bg && f.id === bg.featId && !f.repeatable
                const escolhido = originFeats[0] === f.id
                return (
                  <Choice
                    key={f.id}
                    selected={escolhido}
                    title={f.name}
                    disabled={jaDoAntecedente}
                    defaultOpen={escolhido}
                    details={
                      <>
                        <p>{f.desc}</p>
                        {jaDoAntecedente && <p className="gold">Você já ganha este talento pelo antecedente.</p>}
                      </>
                    }
                    onClick={() => setOriginFeats(escolhido ? [] : [f.id])}
                  />
                )
              })}
              {originFeats.length === 0 && <div className="banner warn">Escolha um talento de Origem para continuar.</div>}
            </Card>
          )}
        </>
      )}

      {/* ---------- 2. ANTECEDENTE ---------- */}
      {step === 2 && (
        <>
          <Card title="Escolha o antecedente">
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Nenhum antecedente vem marcado. Toque em um para escolhê-lo e ver os detalhes;
              a seta abre as informações sem selecionar.
            </p>
            {BACKGROUNDS.map((b) => (
              <Choice
                key={b.id}
                selected={backgroundId === b.id}
                title={b.name}
                desc={`${b.abilities.map((a) => ABILITY_NAMES[a]).join(', ')} · Talento: ${featById(b.featId)?.name}`}
                defaultOpen={backgroundId === b.id}
                details={
                  <>
                    <p>{b.desc}</p>
                    <p><strong className="gold">Talento de Origem:</strong> {featById(b.featId)?.name} — {featById(b.featId)?.desc}</p>
                    <p><strong className="gold">Perícias:</strong> {b.skills.map((s) => skillById(s).name).join(', ')}</p>
                    <p><strong className="gold">Ferramenta:</strong> {b.tool}</p>
                    <p><strong className="gold">Bônus de habilidade:</strong> +2/+1 ou +1/+1/+1 entre {b.abilities.map((a) => ABILITY_NAMES[a]).join(', ')}</p>
                    <p><strong className="gold">Equipamento:</strong> {b.equipment}</p>
                    <p>Você escolhe entre este pacote e 50 PO no passo de Equipamento.</p>
                  </>
                }
                onClick={() => { setBackgroundId(b.id); setBgBonuses({}); setBgEquipId('A') }}
              />
            ))}
            {!backgroundId && <div className="banner warn">Escolha um antecedente para continuar.</div>}
          </Card>

          {bg && (
            <Card title="Bônus de Habilidade do Antecedente">
              <Segmented
                value={bgFree ? 'livre' : 'antecedente'}
                onChange={(v) => { setBgFree(v === 'livre'); setBgBonuses({}) }}
                options={[
                  { value: 'antecedente', label: 'Habilidades do antecedente' },
                  { value: 'livre', label: 'Livre (regra da mesa)' },
                ]}
              />
              <p className="muted tiny" style={{ margin: '12px 0 10px' }}>
                Distribua <strong>+2 e +1</strong> ou <strong>+1, +1 e +1</strong>{' '}
                {bgFree
                  ? 'entre quaisquer atributos — use esta opção se o seu mestre não prende os bônus às habilidades do antecedente.'
                  : `entre as três habilidades de ${bg.name}.`}
                {' '}Distribuído: {bgTotal}/3.
              </p>
              {bgAbilityOptions.map((k) => (
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
            </Card>
          )}
        </>
      )}

      {/* ---------- 3. CLASSE ---------- */}
      {step === 3 && (
        <>
          <Card title="Escolha a classe">
            {CLASSES.map((c) => (
              <Choice
                key={c.id}
                selected={classId === c.id}
                title={c.name}
                desc={`Dado de Vida d${c.hitDie} · ${c.primary} · Salvaguardas: ${c.saves.map((s) => ABILITY_NAMES[s]).join(', ')}`}
                defaultOpen={classId === c.id}
                details={
                  <>
                    <p><strong className="gold">Armaduras:</strong> {c.armor.length ? c.armor.join(', ') : 'Nenhuma'}</p>
                    <p><strong className="gold">Armas:</strong> {c.weapons.join(', ')}</p>
                    <p><strong className="gold">Perícias:</strong> escolha {c.skillCount} entre {c.skillChoices.map((s) => skillById(s).name).join(', ')}</p>
                    <p><strong className="gold">Equipamento inicial:</strong> {c.startingEquipment}</p>
                    {c.features.filter((f) => f.level === 1).map((f) => (
                      <div className="feature" key={f.name}>
                        <h4>{f.name}</h4>
                        <p>{f.desc}</p>
                      </div>
                    ))}
                  </>
                }
                onClick={() => {
                  setClassId(c.id)
                  setSkillProfs([])
                  setCantrips([])
                  setSpells([])
                  setClassChoices({})
                  setMasteries([])
                  setClassEquipId('A')
                }}
              />
            ))}
          </Card>

          {/* Escolhas de nível 1 da classe: Estilo de Luta, Ordem Divina, Ordem Primal... */}
          {classGroups.map((g) => (
            <ChoiceGroup
              key={g.id}
              group={g}
              value={classChoices[g.id]}
              onChange={(optionId) => setClassChoices({ ...classChoices, [g.id]: optionId })}
            />
          ))}

          {/* Maestria em Armas — Guerreiro escolhe 3 armas já no nível 1 */}
          {masteryNeeded > 0 && (
            <Card title={`Maestria em Armas (${masteries.length}/${masteryNeeded})`}>
              <p className="muted tiny" style={{ marginBottom: 10 }}>
                Escolha {masteryNeeded} arma{masteryNeeded > 1 ? 's' : ''} com as quais {cls.name} é proficiente.
                Você passa a usar a propriedade de maestria dessas armas.
              </p>
              {masteryWeapons.map((w) => {
                const marcada = masteries.includes(w.id)
                return (
                  <Choice
                    key={w.id}
                    selected={marcada}
                    title={w.name}
                    desc={`Maestria: ${w.weapon!.mastery} · ${w.weapon!.damage} ${w.weapon!.damageType} · ${w.weapon!.category}`}
                    details={
                      <>
                        <p><strong className="gold">{w.weapon!.mastery}:</strong> {MASTERY_DESC[w.weapon!.mastery] ?? 'Propriedade de maestria desta arma.'}</p>
                        {w.weapon!.properties.length > 0 && <p><strong className="gold">Propriedades:</strong> {w.weapon!.properties.join(', ')}</p>}
                      </>
                    }
                    onClick={() => toggle(masteries, setMasteries, w.id, masteryNeeded)}
                  />
                )
              })}
              {masteries.length !== masteryNeeded && (
                <div className="banner warn">Escolha exatamente {masteryNeeded} arma{masteryNeeded > 1 ? 's' : ''}.</div>
              )}
            </Card>
          )}

          {(cls.choices ?? []).some((g) => (g.level ?? 1) > 1) && (
            <Card title="Escolhas de níveis futuros">
              <p className="muted tiny">
                {(cls.choices ?? []).filter((g) => (g.level ?? 1) > 1)
                  .map((g) => `${g.name} (nível ${g.level})`).join(', ')} — o assistente de evolução
                pedirá essas escolhas quando você chegar ao nível certo.
              </p>
            </Card>
          )}
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
                setManualText({})
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
                {ABILITIES.map((k) => {
                  const texto = manualText[k] ?? String(scores[k])
                  return (
                    <div className="spread" key={k} style={{ marginBottom: 8 }}>
                      <span style={{ width: 110 }}>{ABILITY_NAMES[k]}</span>
                      <input
                        type="number" inputMode="numeric" min={3} max={20} style={{ width: 90 }}
                        value={texto}
                        // Enquanto digita nada é corrigido — a validação acontece ao sair do campo.
                        onChange={(e) => {
                          const t = e.target.value
                          setManualText((p) => ({ ...p, [k]: t }))
                          const n = Number(t)
                          if (t.trim() !== '' && Number.isFinite(n)) setScores((s) => ({ ...s, [k]: n }))
                        }}
                        onBlur={() => {
                          const n = Number(manualText[k] ?? scores[k])
                          const corrigido = Number.isFinite(n) && n !== 0
                            ? Math.max(3, Math.min(20, Math.trunc(n)))
                            : Math.max(3, Math.min(20, scores[k])) || 10
                          setScores((s) => ({ ...s, [k]: corrigido }))
                          setManualText((p) => ({ ...p, [k]: String(corrigido) }))
                        }}
                      />
                    </div>
                  )
                })}
                {ABILITIES.some((k) => {
                  const t = manualText[k] ?? String(scores[k])
                  const n = Number(t)
                  return t.trim() === '' || !Number.isFinite(n) || n < 3 || n > 20
                }) && (
                  <div className="banner warn">Os valores precisam ficar entre 3 e 20 — ajuste antes de continuar.</div>
                )}
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
            Você já é treinado em: <strong className="gold">{skillsJaConcedidas.map((s) => skillById(s).name).join(', ')}</strong>.
            Escolhidas: {escolhidasDaClasse}/{cls.skillCount}
          </p>
          {cls.skillChoices.map((id) => {
            const s = skillById(id)
            const jaTem = skillsJaConcedidas.includes(id)
            const chosen = skillProfs.includes(id)
            return (
              <button
                key={id}
                className={`choice${chosen || jaTem ? ' on' : ''}`}
                disabled={jaTem}
                onClick={() => {
                  if (chosen) setSkillProfs(skillProfs.filter((x) => x !== id))
                  else if (escolhidasDaClasse < cls.skillCount) setSkillProfs([...skillProfs, id])
                }}
              >
                <strong>{chosen || jaTem ? '✓ ' : ''}{s.name}</strong>
                <span>{ABILITY_NAMES[s.ability]}{jaTem ? ' · já concedida' : ''}</span>
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
                    <Choice
                      key={s.id}
                      selected={cantrips.includes(s.id)}
                      title={s.name}
                      desc={`${s.school} · ${s.castingTime} · ${s.range}`}
                      details={<p>{s.desc}</p>}
                      onClick={() => toggle(cantrips, setCantrips, s.id, cantripsNeeded)}
                    />
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
                    <Choice
                      key={s.id}
                      selected={spells.includes(s.id)}
                      title={`${s.name} (${s.level}º)`}
                      desc={`${s.school} · ${s.castingTime} · ${s.range} · ${s.duration}${s.concentration ? ' · Concentração' : ''}`}
                      details={<p>{s.desc}</p>}
                      onClick={() => toggle(spells, setSpells, s.id, spellsNeeded)}
                    />
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
          <Card title={`Equipamento inicial de ${cls.name}`}>
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Escolha uma das opções. Os itens vão direto para a sua mochila e as moedas para o seu ouro.
            </p>
            {cls.equipmentOptions.map((o) => (
              <Choice
                key={o.id}
                selected={classEquipId === o.id}
                title={`Opção ${o.id}`}
                desc={o.label}
                defaultOpen={classEquipId === o.id}
                details={
                  <>
                    <p><strong className="gold">Itens:</strong> {listaDeItens(o).join(', ') || 'nenhum'}</p>
                    <p><strong className="gold">Moedas:</strong> {o.gold} PO</p>
                  </>
                }
                onClick={() => setClassEquipId(o.id)}
              />
            ))}
          </Card>

          {bg && (
            <Card title={`Equipamento de ${bg.name}`}>
              {bg.equipmentOptions.map((o) => (
                <Choice
                  key={o.id}
                  selected={bgEquipId === o.id}
                  title={`Opção ${o.id}`}
                  desc={o.label}
                  defaultOpen={bgEquipId === o.id}
                  details={
                    <>
                      <p><strong className="gold">Itens:</strong> {listaDeItens(o).join(', ') || 'nenhum'}</p>
                      <p><strong className="gold">Moedas:</strong> {o.gold} PO</p>
                    </>
                  }
                  onClick={() => setBgEquipId(o.id)}
                />
              ))}
            </Card>
          )}

          <Card title="O que vai na sua mochila">
            {classEquip && listaDeItens(classEquip).length > 0 && (
              <div className="muted tiny" style={{ marginBottom: 6 }}>
                <strong className="gold">{cls.name}:</strong> {listaDeItens(classEquip).join(', ')}
              </div>
            )}
            {bg && bgEquip && listaDeItens(bgEquip).length > 0 && (
              <div className="muted tiny" style={{ marginBottom: 6 }}>
                <strong className="gold">{bg.name}:</strong> {listaDeItens(bgEquip).join(', ')}
              </div>
            )}
            {extraItems.length > 0 && (
              <div className="muted tiny" style={{ marginBottom: 6 }}>
                <strong className="gold">Extras:</strong> {extraItems.map((i) => itemById(i)?.name ?? i).join(', ')}
              </div>
            )}
            {classEquip && bgEquip && listaDeItens(classEquip).length === 0 && listaDeItens(bgEquip).length === 0 && extraItems.length === 0 && (
              <div className="muted tiny">Nenhum item — você começa só com moedas.</div>
            )}
            <hr />
            <div className="spread">
              <span>Ouro inicial</span>
              <strong className="gold" style={{ fontSize: '1.2rem' }}>{ouroTotal} PO</strong>
            </div>
            <div className="muted tiny" style={{ marginTop: 4 }}>
              {classEquip?.gold ?? 0} PO da classe + {bgEquip?.gold ?? 0} PO do antecedente
              {extraGold ? ` + ${extraGold} PO extras` : ''}.
            </div>
          </Card>

          <Card title="Itens extras (opcional)">
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Comprou algo com o seu ouro ou o mestre te deu um item? Marque aqui. Depois é possível
              equipar armas e armaduras na aba Itens — a CA e os ataques são recalculados automaticamente.
            </p>
            <details>
              <summary>Armas ({extraItems.filter((i) => WEAPONS.some((w) => w.id === i)).length})</summary>
              <div style={{ marginTop: 8 }}>
                {WEAPONS.map((w) => (
                  <button key={w.id} className={`choice${extraItems.includes(w.id) ? ' on' : ''}`}
                    onClick={() => setExtraItems((p) => p.includes(w.id) ? p.filter((x) => x !== w.id) : [...p, w.id])}>
                    <strong>{extraItems.includes(w.id) ? '✓ ' : ''}{w.name}</strong>
                    <span>{w.weapon!.damage} {w.weapon!.damageType} · {w.weapon!.category} · Maestria: {w.weapon!.mastery}</span>
                  </button>
                ))}
              </div>
            </details>
            <details>
              <summary>Armaduras e escudos</summary>
              <div style={{ marginTop: 8 }}>
                {[...ARMORS, SHIELD].map((a) => (
                  <button key={a.id} className={`choice${extraItems.includes(a.id) ? ' on' : ''}`}
                    onClick={() => setExtraItems((p) => p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id])}>
                    <strong>{extraItems.includes(a.id) ? '✓ ' : ''}{a.name}</strong>
                    <span>CA {a.armor!.baseAC}{a.kind === 'escudo' ? ' (bônus)' : ''} · {a.kind === 'escudo' ? 'Escudo' : a.armor!.category}</span>
                  </button>
                ))}
              </div>
            </details>
            <details>
              <summary>Equipamento geral</summary>
              <div style={{ marginTop: 8 }}>
                {GEAR.map((g) => (
                  <button key={g.id} className={`choice${extraItems.includes(g.id) ? ' on' : ''}`}
                    onClick={() => setExtraItems((p) => p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id])}>
                    <strong>{extraItems.includes(g.id) ? '✓ ' : ''}{g.name}</strong>
                    {g.desc && <span>{g.desc}</span>}
                  </button>
                ))}
              </div>
            </details>
            <label style={{ marginTop: 12 }}>Moedas de ouro adicionais</label>
            <input
              type="number" inputMode="numeric" min={0} value={extraGold}
              onChange={(e) => setExtraGold(Math.max(0, Number(e.target.value) || 0))}
            />
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
