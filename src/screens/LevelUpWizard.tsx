import { useMemo, useState } from 'react'
import type { AbilityKey, AsiChoice, Character, Spell } from '../types'
import { ABILITIES, ABILITY_NAMES } from '../types'
import { classById } from '../data/classes'
import { GENERAL_FEATS, featById } from '../data/feats'
import {
  PREPARATION_RULES, abilityMod, alwaysPreparedSpells, availableCantrips, cantripLimit,
  classLabel, classLevel, classSpellCatalog, featurePickGroups, finalAbilities, knownCantripIds,
  levelUpSummary, maxSpellLevel, multiclassOptions, pendingChoices, preparationMode, preparedLimit,
  preparedSpellIds, spellPickGroups, subclassIdOf, withLevelIn, type ResolvedChoice,
} from '../engine/rules'
import { rollHitDie } from '../engine/dice'
import { useStore } from '../store/store'
import {
  Card, Choice, ChoiceAccordion, ChoiceGroup, FeaturePickCard, Segmented, Sheet, SpellText,
} from '../components/ui'

type AsiMode = 'asi2' | 'asi11' | 'feat'
type HpMode = 'media' | 'rolar'

export function LevelUpWizard({ char, onClose }: { char: Character; onClose: () => void }) {
  const update = useStore((s) => s.updateCharacter)
  const novoNivel = char.level + 1

  /** Classe que vai receber este nível — a inicial, outra que ele já tem, ou uma nova. */
  const [targetClassId, setTargetClassId] = useState(char.classId)
  const [hpMode, setHpMode] = useState<HpMode>('media')
  /** Texto cru do campo de PV: só vira número quando está dentro do intervalo do dado. */
  const [hpTexto, setHpTexto] = useState('')
  const [subclassId, setSubclassId] = useState<string | undefined>(undefined)
  const [asiMode, setAsiMode] = useState<AsiMode>('asi2')
  const [asiAbilities, setAsiAbilities] = useState<AbilityKey[]>([])
  const [featId, setFeatId] = useState<string>('')
  const [novosTruques, setNovosTruques] = useState<string[]>([])
  const [novasMagias, setNovasMagias] = useState<string[]>([])
  const [novasEscolhasEspecie, setNovasEscolhasEspecie] = useState<Record<string, string>>({})
  const [novasEscolhasClasse, setNovasEscolhasClasse] = useState<Record<string, string>>({})
  /** magias escolhidas nos grupos que não vêm da lista da classe */
  const [picks, setPicks] = useState<Record<string, string[]>>({})
  /** manobras, invocações, metamagia... escolhidas neste nível */
  const [featurePicks, setFeaturePicks] = useState<Record<string, string[]>>({})

  const cls = classById(targetClassId)!
  // A subclasse escolhida agora já vale para tudo que vem a seguir: características,
  // escolhas próprias da subclasse (terreno druídico) e magias sempre preparadas.
  const subclasseAtual = subclassId ?? subclassIdOf(char, targetClassId)
  const opcoesDeClasse = useMemo(() => multiclassOptions(char), [char])
  const jaTemAClasse = classLevel(char, targetClassId) > 0

  const resumo = useMemo(
    () => levelUpSummary(char, novoNivel, targetClassId, subclasseAtual),
    [char, novoNivel, targetClassId, subclasseAtual],
  )

  /** Troca de classe alvo zera tudo que dependia da classe anterior. */
  const escolherClasse = (id: string) => {
    setTargetClassId(id)
    setSubclassId(undefined)
    setNovosTruques([])
    setNovasMagias([])
    setNovasEscolhasClasse({})
    setFeaturePicks({})
    setAsiMode('asi2')
    setAsiAbilities([])
    setFeatId('')
  }

  if (novoNivel > 20) {
    return (
      <Sheet title="Nível máximo" onClose={onClose}>
        <p className="muted">Seu personagem já está no nível 20, o máximo das regras do PHB 2024.</p>
      </Sheet>
    )
  }
  if (!resumo) return null

  const abs = finalAbilities(char)
  const dado = resumo.hitDie
  const hpRoll = (() => {
    const n = Number(hpTexto)
    return hpTexto.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= dado ? n : null
  })()

  // Ficha resultante deste nível, já com todas as escolhas feitas aqui.
  const draftDepois: Character = withLevelIn(char, targetClassId, subclasseAtual)
  const draft: Character = {
    ...draftDepois,
    speciesChoices: { ...(char.speciesChoices ?? {}), ...novasEscolhasEspecie },
    classChoices: { ...(char.classChoices ?? {}), ...novasEscolhasClasse },
    spellPicks: { ...(char.spellPicks ?? {}), ...picks },
    featureChoices: { ...(char.featureChoices ?? {}), ...featurePicks },
  }

  const modo = preparationMode(draft)
  const maxLvl = maxSpellLevel(draft)

  const truquesAtuais = knownCantripIds(char).length
  const truquesNovos = Math.max(0, cantripLimit(draft) - truquesAtuais)

  const limiteDepois = preparedLimit(draft) ?? 0
  // O Mago não "prepara mais": ele copia 2 magias novas para o grimório a cada nível.
  const magiasNovas = modo === 'grimorio'
    ? 2
    : Math.max(0, limiteDepois - preparedSpellIds(char).length)

  const disponiveisTruques = availableCantrips(draft).filter((s) => !char.spellsKnown.includes(s.id))
  const disponiveisMagias = classSpellCatalog(draft).filter((s) => !char.spellsKnown.includes(s.id))

  // Magias que a subclasse passa a manter sempre preparadas neste nível
  const jaPreparadas = new Set(alwaysPreparedSpells(char).map((a) => a.spell.id))
  const novasAutomaticas = alwaysPreparedSpells(draft).filter((m) => !jaPreparadas.has(m.spell.id))

  // Escolhas de espécie/classe/subclasse desbloqueadas até o novo nível e ainda não feitas
  const escolhasPendentes = pendingChoices(draft, novoNivel)
  const escolhaSelecionada = (source: ResolvedChoice['source'], key: string) =>
    source === 'especie' ? novasEscolhasEspecie[key] : novasEscolhasClasse[key]
  const escolhasOk = escolhasPendentes.every((e) => !!escolhaSelecionada(e.source, e.key))

  /*
   * Magias que não vêm da lista da classe (linhagem élfica, talentos como Tocado
   * pelo Feérico...) são escolhidas aqui, junto das magias novas da classe.
   */
  const gruposDeMagia = spellPickGroups(draft, {
    uptoLevel: novoNivel,
    extraFeatIds: asiMode === 'feat' && featId ? [featId] : [],
  })
  const gruposOk = gruposDeMagia.every((g) => !g.pending)

  /*
   * Manobras do Mestre de Batalha, Invocações Místicas do Bruxo, Metamagia...
   * Aparecem assim que a subclasse é escolhida aqui em cima, sem precisar
   * fechar o assistente e voltar depois.
   */
  const gruposDeFeature = featurePickGroups(draft)
    .filter((g) => g.pending || featurePicks[g.pick.id] !== undefined)
  const featuresOk = gruposDeFeature.every((g) => !g.pending)

  const togglePick = (grupoId: string, spellId: string, limite: number) => {
    setPicks((atual) => {
      const lista = atual[grupoId] ?? char.spellPicks?.[grupoId] ?? []
      if (lista.includes(spellId)) return { ...atual, [grupoId]: lista.filter((x) => x !== spellId) }
      if (lista.length >= limite) return atual
      return { ...atual, [grupoId]: [...lista, spellId] }
    })
  }

  const toggleFeature = (grupoId: string, optionId: string, limite: number) => {
    setFeaturePicks((atual) => {
      const lista = atual[grupoId] ?? char.featureChoices?.[grupoId] ?? []
      if (lista.includes(optionId)) return { ...atual, [grupoId]: lista.filter((x) => x !== optionId) }
      if (lista.length >= limite) return atual
      return { ...atual, [grupoId]: [...lista, optionId] }
    })
  }

  const precisaSubclasse = resumo.needsSubclass && !subclassId
  const asiOk = !resumo.needsAsi || (
    asiMode === 'feat' ? !!featId
      : asiMode === 'asi2' ? asiAbilities.length === 1
        : asiAbilities.length === 2
  )
  const hpOk = hpMode === 'media' || hpRoll !== null
  const truquesOk = novosTruques.length === truquesNovos
  const magiasOk = novasMagias.length === magiasNovas
  const podeConfirmar = hpOk && !precisaSubclasse && asiOk && truquesOk && magiasOk
    && escolhasOk && gruposOk && featuresOk

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
      classes: draftDepois.classes,
      levelClasses: draftDepois.levelClasses,
      subclassId: draftDepois.subclassId,
      asiChoices,
      hpRolls,
      speciesChoices: draft.speciesChoices,
      classChoices: draft.classChoices,
      spellPicks: draft.spellPicks,
      featureChoices: draft.featureChoices,
      spellsKnown: [...char.spellsKnown, ...novosTruques, ...novasMagias],
      // No grimório as magias novas entram no livro; a preparação é refeita no descanso longo.
      spellsPrepared: modo === 'grimorio'
        ? char.spellsPrepared
        : [...char.spellsPrepared, ...novasMagias],
      // Bardo, Bruxo, Feiticeiro e as subclasses conjuradoras trocam uma magia por nível.
      spellSwaps: modo === 'nivel-uma' ? (char.spellSwaps ?? 0) + 1 : char.spellSwaps,
    })
    onClose()
  }

  const featSelecionado = featById(featId)

  return (
    <Sheet title={`⬆ Subir para o Nível ${novoNivel}`} onClose={onClose}>
      <div className="banner">
        <strong className="gold">{cls.name} nível {resumo.classLevel}</strong>
        <div className="tiny">Nível de personagem {novoNivel} · {classLabel(draft)}</div>
        {resumo.proficiencyChanged && <div>Seu bônus de proficiência sobe para +{resumo.proficiencyBonus}!</div>}
      </div>

      {/* --- Em qual classe cai este nível (multiclasse) --- */}
      <Card title="Classe deste nível">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          Suba na mesma classe ou comece uma nova. Na multiclasse o nível de personagem é a soma
          de todos os níveis — o bônus de proficiência, os PV e os espaços de magia já saem
          calculados pelas regras do PHB 2024.
        </p>
        <ChoiceAccordion>
          {opcoesDeClasse.filter((o) => o.jaTem).map(({ cls: c }) => (
            <Choice
              key={c.id}
              id={`classe-${c.id}`}
              selected={targetClassId === c.id}
              title={`${c.name} — nível ${classLevel(char, c.id)} → ${classLevel(char, c.id) + 1}`}
              desc={`Dado de Vida d${c.hitDie}`}
              onClick={() => escolherClasse(c.id)}
            />
          ))}
        </ChoiceAccordion>

        <details style={{ marginTop: 10 }}>
          <summary className="muted">Começar uma classe nova (multiclasse)</summary>
          <div style={{ marginTop: 8 }}>
            <ChoiceAccordion>
              {opcoesDeClasse.filter((o) => !o.jaTem).map(({ cls: c, faltando }) => (
                <Choice
                  key={c.id}
                  id={`classe-nova-${c.id}`}
                  selected={targetClassId === c.id}
                  disabled={faltando.length > 0}
                  title={`${c.name} — nível 1`}
                  desc={faltando.length > 0
                    ? `Requer 13+ em ${faltando.map((k) => ABILITY_NAMES[k]).join(' ou ')}`
                    : `Dado de Vida d${c.hitDie} · ${c.primary}`}
                  details={
                    <>
                      <p><strong className="gold">Armaduras por multiclasse:</strong>{' '}
                        {(c.multiclassArmor ?? c.armor).join(', ') || 'nenhuma'}</p>
                      <p><strong className="gold">Armas por multiclasse:</strong>{' '}
                        {(c.multiclassWeapons ?? c.weapons).join(', ') || 'nenhuma'}</p>
                      <p className="muted tiny">
                        Entrar numa classe nova não concede as perícias, as salvaguardas nem o
                        equipamento inicial dela — só as proficiências reduzidas acima.
                      </p>
                    </>
                  }
                  onClick={() => { if (faltando.length === 0) escolherClasse(c.id) }}
                />
              ))}
            </ChoiceAccordion>
          </div>
        </details>

        {!jaTemAClasse && (
          <div className="banner">
            Primeiro nível de <strong className="gold">{cls.name}</strong>. Você passa a ser{' '}
            {classLabel(draft)}.
          </div>
        )}
      </Card>

      {/* --- Pontos de Vida --- */}
      <Card title="Pontos de Vida">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          Dado de Vida de {cls.name}: d{dado}. Use a média fixa ({dado / 2 + 1}) ou informe o
          resultado do dado — role aqui ou digite o valor que você rolou na mesa.
        </p>
        <Segmented
          value={hpMode}
          onChange={(m) => { setHpMode(m); setHpTexto('') }}
          options={[
            { value: 'media', label: `Média (${dado / 2 + 1})` },
            { value: 'rolar', label: 'Rolar / digitar' },
          ]}
        />
        {hpMode === 'rolar' && (
          <div style={{ marginTop: 10 }}>
            <button className="gold" style={{ width: '100%' }} onClick={() => setHpTexto(String(rollHitDie(dado)))}>
              🎲 Rolar 1d{dado}
            </button>
            <label style={{ marginTop: 10 }}>Valor do dado (1 a {dado})</label>
            <input
              type="number" inputMode="numeric" min={1} max={dado} placeholder={`Digite de 1 a ${dado}`}
              value={hpTexto}
              onChange={(e) => setHpTexto(e.target.value)}
            />
            {hpRoll !== null ? (
              <div className="center" style={{ marginTop: 8 }}>
                PV ganhos: <strong className="gold" style={{ fontSize: '1.3rem' }}>
                  {Math.max(1, hpRoll + abilityMod(abs.con))}
                </strong>
                <span className="muted"> ({hpRoll} do dado {abilityMod(abs.con) >= 0 ? '+' : '−'}{' '}
                  {Math.abs(abilityMod(abs.con))} de Constituição)</span>
              </div>
            ) : (
              <div className="banner warn">Informe um valor entre 1 e {dado}.</div>
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
        <Card title={`Escolha sua Subclasse de ${cls.name}`}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Esta escolha é permanente e concede características agora e em níveis futuros.
          </p>
          <ChoiceAccordion>
            {cls.subclasses.map((s) => (
              <Choice
                key={s.id}
                id={s.id}
                selected={subclassId === s.id}
                title={s.name}
                desc={s.desc}
                defaultOpen={subclassId === s.id}
                details={s.features.map((f) => (
                  <div className="feature" key={f.name}>
                    <h4>{f.name} <span className="muted tiny">· Nível {f.level}</span></h4>
                    <p>{f.desc}</p>
                  </div>
                ))}
                onClick={() => setSubclassId(s.id)}
              />
            ))}
          </ChoiceAccordion>
        </Card>
      )}

      {/* --- Escolhas de espécie e de classe (Estilo de Luta, Revelação Celestial...) --- */}
      {escolhasPendentes.map(({ source, group, key, className }) => (
        <ChoiceGroup
          key={key}
          group={className ? { ...group, name: `${group.name} · ${className}` } : group}
          value={escolhaSelecionada(source, key)}
          onChange={(optionId) => {
            if (source === 'especie') setNovasEscolhasEspecie((p) => ({ ...p, [key]: optionId }))
            else setNovasEscolhasClasse((p) => ({ ...p, [key]: optionId }))
          }}
        />
      ))}

      {/* --- Manobras, Invocações Místicas, Metamagia... --- */}
      {gruposDeFeature.map((g) => (
        <FeaturePickCard
          key={g.pick.id}
          grupo={g}
          onToggle={(optionId) => toggleFeature(g.pick.id, optionId, g.count)}
        />
      ))}

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
              <ChoiceAccordion>
                {GENERAL_FEATS.filter((f) => f.id !== 'aumento-de-habilidade').map((f) => (
                  <Choice key={f.id} id={f.id} selected={featId === f.id} title={f.name}
                    details={<p>{f.desc}</p>} defaultOpen={featId === f.id}
                    onClick={() => { setFeatId(f.id); setAsiAbilities([]) }} />
                ))}
              </ChoiceAccordion>
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

      {/* --- Magias que a subclasse passa a manter sempre preparadas --- */}
      {novasAutomaticas.length > 0 && (
        <Card title="Magias Sempre Preparadas">
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Estas magias passam a ficar sempre preparadas — você não precisa escolhê-las e
            elas não ocupam vaga no seu limite de magias preparadas.
          </p>
          {novasAutomaticas.map((m) => (
            <div className="feature" key={m.spell.id}>
              <h4>{m.spell.name} <span className="muted tiny">· {m.spell.level === 0 ? 'truque' : `${m.spell.level}º círculo`}</span></h4>
              <p>{m.source} · {m.spell.school} · {m.spell.castingTime} · {m.spell.range}</p>
            </div>
          ))}
        </Card>
      )}

      {/* --- Novos truques --- */}
      {truquesNovos > 0 && (
        <Card title={`Novos Truques (${novosTruques.length}/${truquesNovos})`}>
          <ChoiceAccordion>
            {disponiveisTruques.map((s: Spell) => (
              <Choice key={s.id} id={s.id} selected={novosTruques.includes(s.id)} title={s.name}
                desc={`${s.school} · ${s.castingTime} · ${s.range}`} details={<SpellText desc={s.desc} />}
                onClick={() => toggleSpell(novosTruques, setNovosTruques, s.id, truquesNovos)} />
            ))}
          </ChoiceAccordion>
        </Card>
      )}

      {/* --- Troca concedida pelo nível (Bardo, Bruxo, Feiticeiro e subclasses conjuradoras) --- */}
      {modo === 'nivel-uma' && (
        <Card title="Troca de Magia Preparada">
          <p className="muted tiny">
            {PREPARATION_RULES['nivel-uma'].texto} Ao confirmar este nível você ganha
            <strong className="gold"> 1 troca</strong>: use o botão <strong>⇄</strong> ao lado de uma
            magia na aba Magias para substituí-la. Truques podem ser trocados pelo botão
            <strong> Escolher</strong>, na mesma aba.
          </p>
        </Card>
      )}

      {/* --- Novas magias --- */}
      {magiasNovas > 0 && (
        <Card title={modo === 'grimorio' ? `Novas Magias no Grimório (${novasMagias.length}/${magiasNovas})` : `Novas Magias Preparadas (${novasMagias.length}/${magiasNovas})`}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            {modo === 'grimorio'
              ? `Você copia 2 magias de Mago de até ${maxLvl}º nível para o grimório. A lista de preparadas (até ${limiteDepois}) você redefine em cada descanso longo.`
              : `Sua lista de magias preparadas sobe para ${limiteDepois}, com magias de até ${maxLvl}º nível.`}
          </p>
          <ChoiceAccordion>
            {disponiveisMagias.map((s) => (
              <Choice key={s.id} id={s.id} selected={novasMagias.includes(s.id)} title={`${s.name} (${s.level}º)`}
                desc={`${s.school} · ${s.castingTime} · ${s.range}${s.concentration ? ' · Concentração' : ''}`}
                details={<SpellText desc={s.desc} />}
                onClick={() => toggleSpell(novasMagias, setNovasMagias, s.id, magiasNovas)} />
            ))}
          </ChoiceAccordion>
        </Card>
      )}

      {/* --- Magias que não vêm da lista da classe (linhagem, talentos, estilo de luta) --- */}
      {gruposDeMagia.filter((g) => g.pending || picks[g.pick.id]).map(({ pick, options, chosen }) => (
        <Card key={pick.id} title={`${pick.source} — ${pick.spellLevel === 0 ? 'truques' : `${pick.spellLevel}º círculo`} (${chosen.length}/${pick.count})`}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Escolha {pick.count} {pick.spellLevel === 0 ? 'truque(s)' : `magia(s) de ${pick.spellLevel}º círculo`}
            {' '}da lista de {pick.fromClasses.map((c) => classById(c)?.name ?? c).join(', ')}
            {pick.schools ? ` (escolas de ${pick.schools.join(' ou ')})` : ''}.
            {pick.nota ? ` ${pick.nota}` : ''}
          </p>
          <ChoiceAccordion>
            {options.map((s) => (
              <Choice key={s.id} id={`${pick.id}-${s.id}`} selected={chosen.includes(s.id)} title={s.name}
                desc={`${s.school} · ${s.castingTime} · ${s.range}${s.concentration ? ' · Concentração' : ''}`}
                details={<SpellText desc={s.desc} />}
                onClick={() => togglePick(pick.id, s.id, pick.count)} />
            ))}
          </ChoiceAccordion>
        </Card>
      ))}

      <button className="gold" style={{ width: '100%' }} disabled={!podeConfirmar} onClick={confirmar}>
        ✓ Confirmar Nível {novoNivel}
      </button>
      {!podeConfirmar && (
        <div className="muted tiny center" style={{ marginTop: 8 }}>
          {!hpOk && 'Informe o valor do Dado de Vida. '}
          {precisaSubclasse && 'Escolha uma subclasse. '}
          {!escolhasOk && `Faça as escolhas pendentes: ${escolhasPendentes.filter((e) => !escolhaSelecionada(e.source, e.key)).map((e) => e.group.name).join(', ')}. `}
          {!featuresOk && `Complete: ${gruposDeFeature.filter((g) => g.pending).map((g) => g.pick.name).join(', ')}. `}
          {!asiOk && 'Complete o incremento de atributo ou talento. '}
          {!truquesOk && `Escolha ${truquesNovos} truque(s). `}
          {!magiasOk && `Escolha ${magiasNovas} magia(s).`}
        </div>
      )}
    </Sheet>
  )
}
