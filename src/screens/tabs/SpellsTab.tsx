import { useState } from 'react'
import type { Character, Spell } from '../../types'
import { ABILITY_NAMES } from '../../types'
import { spellById } from '../../data/spells'
import { classById } from '../../data/classes'
import {
  PREPARATION_RULES, alwaysPreparedSpells, availableCantrips, cantripLimit, casterClasses,
  classLabel, classSpellCatalog, fmtMod, innateSpells, innateUsesLabel, knownCantripIds, pactSlots,
  preparableSpells, preparationMode, preparedLimit, preparedSpellIds, spellListClasses, spellSlots,
  spellcasting, subclassOf,
} from '../../engine/rules'
import { useStore } from '../../store/store'
import { Card, Empty, Sheet, SpellText } from '../../components/ui'

const ORDINAIS = ['Truques', '1º Nível', '2º Nível', '3º Nível', '4º Nível', '5º Nível', '6º Nível', '7º Nível', '8º Nível', '9º Nível']

const resumoMagia = (s: Spell) =>
  `${s.school} · ${s.castingTime} · ${s.range}${s.concentration ? ' · Concentração' : ''}${s.ritual ? ' · Ritual' : ''}`

export function SpellsTab({ char }: { char: Character }) {
  const { updateCharacter, spendSlot, spendPactSlot } = useStore()
  const [detail, setDetail] = useState<string | null>(null)
  /** folha aberta: preparação de magias, escolha de truques ou grimório */
  const [folha, setFolha] = useState<'preparar' | 'truques' | 'grimorio' | null>(null)
  /** id da magia que está sendo substituída numa troca */
  const [trocando, setTrocando] = useState<string | null>(null)

  const cls = classById(char.classId)
  const sc = spellcasting(char)
  const slots = spellSlots(char)
  const pact = pactSlots(char)
  const modo = preparationMode(char)
  const subclasse = subclassOf(char)
  /** Numa ficha multiclasse cada classe conjura com a habilidade e a CD dela. */
  const conjuradoras = casterClasses(char)

  // Truques e magias concedidos pela espécie, linhagem e talentos valem para qualquer classe.
  const inatas = innateSpells(char)
  const automaticas = alwaysPreparedSpells(char)

  const cardInatas = inatas.length > 0 && (
    <Card title="Magias de Espécie e Talentos">
      <p className="muted tiny" style={{ marginBottom: 10 }}>
        Concedidas pelos seus traços e talentos — você as tem além das magias da classe e elas
        não ocupam vaga no seu limite de preparadas.
      </p>
      {inatas.map((m) => (
        <div className="list-item eq" key={m.spell.id}>
          <div style={{ flex: 1 }} onClick={() => setDetail(m.spell.id)}>
            <strong style={{ fontSize: '.92rem' }}>
              {m.spell.name} <span className="muted tiny">({m.spell.level === 0 ? 'truque' : `${m.spell.level}º`})</span>
            </strong>
            <div className="tiny muted">{resumoMagia(m.spell)}</div>
            <div className="tiny gold">{m.source}{innateUsesLabel(char, m.freeUses) && ` · ${innateUsesLabel(char, m.freeUses)}`}</div>
            <div className="tiny muted">
              {ABILITY_NAMES[m.ability]} · CD {m.saveDC} · ataque {fmtMod(m.attackBonus)}
            </div>
            {m.nota && <div className="tiny muted">{m.nota}</div>}
          </div>
        </div>
      ))}
    </Card>
  )

  const cardAutomaticas = automaticas.length > 0 && (
    <Card title="Magias Sempre Preparadas">
      <p className="muted tiny" style={{ marginBottom: 10 }}>
        Concedidas por características como {subclasse?.name ?? 'sua subclasse'}. Elas estão
        sempre prontas, são conjuradas gastando seus espaços de magia normalmente e
        <strong> não contam</strong> no seu limite de magias preparadas.
      </p>
      {automaticas.map((m) => (
        <div className="list-item eq" key={m.spell.id}>
          <div style={{ flex: 1 }} onClick={() => setDetail(m.spell.id)}>
            <strong style={{ fontSize: '.92rem' }}>
              {m.spell.name} <span className="muted tiny">({m.spell.level === 0 ? 'truque' : `${m.spell.level}º`})</span>
            </strong>
            <div className="tiny muted">{resumoMagia(m.spell)}</div>
            <div className="tiny gold">{m.source}</div>
          </div>
        </div>
      ))}
    </Card>
  )

  // Quem não conjura pela classe ainda pode ter magias de espécie ou de subclasse.
  if (!sc || !cls || !modo) {
    if (inatas.length === 0 && automaticas.length === 0) {
      return (
        <Empty
          icon="✨"
          title={`${classLabel(char)} não conjura magias`}
          hint="Subclasses como Cavaleiro Místico e Trapaceiro Arcano ganham conjuração no 3º nível."
        />
      )
    }
    return (
      <div>
        <div className="banner">
          {cls?.name ?? 'Sua classe'} não conjura magias de classe, mas as magias abaixo vêm
          dos seus traços e características.
        </div>
        {cardAutomaticas}
        {cardInatas}
        {detail && <DetalheMagia id={detail} onClose={() => setDetail(null)} />}
      </div>
    )
  }

  const regra = PREPARATION_RULES[modo]
  const trocasDisponiveis = char.spellSwaps ?? 0

  const limitePreparadas = preparedLimit(char) ?? 0
  const preparadasIds = preparedSpellIds(char)
  const preparadas = preparadasIds.map((id) => spellById(id)).filter((s): s is Spell => !!s)
  const vagasLivres = limitePreparadas - preparadas.length
  /*
   * Clérigo, Druida e Mago editam a lista à vontade. Nas demais classes a troca
   * custa um uso — exceto quando a lista está acima do limite (fichas antigas ou
   * uma perda de nível), quando tirar magias sobrando é sempre permitido.
   */
  const excedente = preparadas.length > limitePreparadas
  const trocaLivre = modo === 'descanso-todas' || modo === 'grimorio' || excedente

  const limiteTruques = cantripLimit(char)
  const truquesIds = knownCantripIds(char)
  const truques = truquesIds.map((id) => spellById(id)).filter((s): s is Spell => !!s)

  // O que a subclasse já mantém preparado sai das listas de escolha — não faz
  // sentido gastar uma vaga com uma magia que você já tem de graça.
  const jaAutomatica = new Set(automaticas.map((m) => m.spell.id))
  const candidatas = preparableSpells(char).filter((s) => !jaAutomatica.has(s.id))
  const catalogo = classSpellCatalog(char).filter((s) => !jaAutomatica.has(s.id))
  const truquesCandidatos = availableCantrips(char).filter((s) => !jaAutomatica.has(s.id))
  const grimorio = char.spellsKnown
    .map((id) => spellById(id))
    .filter((s): s is Spell => !!s && s.level > 0)

  // ---------- Ações ----------
  /** Prepara uma magia numa vaga livre. */
  const preparar = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsPrepared: c.spellsPrepared.includes(id) ? c.spellsPrepared : [...c.spellsPrepared, id],
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown : [...c.spellsKnown, id],
    }))

  /** Tira uma magia da lista. No grimório ela continua registrada no livro. */
  const despreparar = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
      spellsKnown: modo === 'grimorio' ? c.spellsKnown : c.spellsKnown.filter((x) => x !== id),
    }))

  /** Substitui `de` por `para`, gastando uma troca. */
  const trocar = (de: string, para: string) => {
    updateCharacter(char.id, (c) => ({
      spellsPrepared: [...c.spellsPrepared.filter((x) => x !== de), para],
      spellsKnown: modo === 'grimorio'
        ? (c.spellsKnown.includes(para) ? c.spellsKnown : [...c.spellsKnown, para])
        : [...c.spellsKnown.filter((x) => x !== de), para],
      spellSwaps: Math.max(0, (c.spellSwaps ?? 0) - 1),
    }))
    setTrocando(null)
  }

  const toggleTruque = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown.filter((x) => x !== id) : [...c.spellsKnown, id],
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
    }))

  const toggleGrimorio = (id: string) =>
    updateCharacter(char.id, (c) => ({
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown.filter((x) => x !== id) : [...c.spellsKnown, id],
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
    }))

  const listasLabel = spellListClasses(char).map((c) => classById(c)?.name ?? c).join(', ')

  return (
    <div>
      <Card title="Conjuração">
        <div className="grid g3">
          <div className="ability">
            <div className="name">Habilidade</div>
            <div className="mod" style={{ fontSize: '1rem', paddingTop: 8 }}>{ABILITY_NAMES[sc.ability].slice(0, 3)}</div>
            <div className="score">{fmtMod(sc.mod)}</div>
          </div>
          <div className="ability">
            <div className="name">CD de Magia</div>
            <div className="mod">{sc.saveDC}</div>
            <div className="score">salvaguarda</div>
          </div>
          <div className="ability">
            <div className="name">Ataque</div>
            <div className="mod">{fmtMod(sc.attackBonus)}</div>
            <div className="score">mágico</div>
          </div>
        </div>
        {conjuradoras.length > 1 && (
          <div className="tiny muted" style={{ marginTop: 10 }}>
            Você conjura por mais de uma classe — cada uma tem a própria habilidade e a própria CD:
            {conjuradoras.map((c) => (
              <div key={c.classId}>
                <strong className="gold">{c.className} {c.level}</strong>{' '}
                — {ABILITY_NAMES[c.ability]} · CD {c.saveDC} · ataque {fmtMod(c.attackBonus)}
              </div>
            ))}
            Os espaços de magia abaixo são compartilhados, conforme a regra de multiclasse do PHB 2024.
          </div>
        )}
        <div className="tiny muted" style={{ marginTop: 10 }}>
          Lista de magias: <strong className="gold">{listasLabel}</strong>
          {sc.caster === 'terco' && ' · conjuração concedida pela subclasse'}
        </div>
      </Card>

      {/* --- Espaços de magia --- */}
      {pact ? (
        <Card title={`Espaços de Pacto (${pact.level}º nível)`}>
          <div className="spread">
            <div className="slots">
              {Array.from({ length: pact.count }, (_, i) => (
                <button
                  key={i}
                  className={`slot${i < char.pactSlotsSpent ? ' spent' : ''}`}
                  onClick={() => spendPactSlot(char.id, i < char.pactSlotsSpent ? -1 : 1)}
                  aria-label={`Espaço de pacto ${i + 1}`}
                />
              ))}
            </div>
            <span className="tiny muted">{pact.count - char.pactSlotsSpent}/{pact.count} disponíveis</span>
          </div>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            Espaços de Pacto recarregam em <strong>descanso curto</strong>.
          </div>
        </Card>
      ) : (
        slots.some((n) => n > 0) && (
          <Card title="Espaços de Magia">
            {slots.map((total, i) => {
              if (total === 0) return null
              const lvl = i + 1
              const gastos = char.slotsSpent[lvl] ?? 0
              return (
                <div className="spread" key={lvl} style={{ marginBottom: 10 }}>
                  <span style={{ width: 70, fontSize: '.85rem' }}>{lvl}º nível</span>
                  <div className="slots" style={{ flex: 1 }}>
                    {Array.from({ length: total }, (_, j) => (
                      <button
                        key={j}
                        className={`slot${j < gastos ? ' spent' : ''}`}
                        onClick={() => spendSlot(char.id, lvl, j < gastos ? -1 : 1)}
                        aria-label={`Espaço de ${lvl}º nível`}
                      />
                    ))}
                  </div>
                  <span className="tiny muted">{total - gastos}/{total}</span>
                </div>
              )
            })}
            <div className="tiny muted" style={{ marginTop: 4 }}>
              Toque num círculo para gastar; toque num gasto para recuperar. O descanso longo restaura todos.
            </div>
          </Card>
        )
      )}

      {/* --- Truques --- */}
      {limiteTruques > 0 && (
        <Card
          title={`Truques (${truques.length}/${limiteTruques})`}
          action={<button className="sm primary" onClick={() => setFolha('truques')}>Escolher</button>}
        >
          {truques.length === 0
            ? <p className="muted tiny">Você ainda não escolheu nenhum truque.</p>
            : truques.map((s) => (
              <div className="list-item eq" key={s.id} onClick={() => setDetail(s.id)}>
                <strong style={{ fontSize: '.92rem' }}>{s.name}</strong>
                <div className="tiny muted">{resumoMagia(s)}</div>
              </div>
            ))}
          <div className="tiny muted" style={{ marginTop: 8 }}>
            Truques não gastam espaço de magia. Ao subir de nível você pode trocar um truque por outro.
          </div>
        </Card>
      )}

      {cardAutomaticas}

      {/* --- Magias preparadas --- */}
      <Card
        title={`Magias Preparadas (${preparadas.length}/${limitePreparadas})`}
        action={<button className="sm primary" onClick={() => setFolha('preparar')}>Preparar</button>}
      >
        <div className="tiny muted" style={{ marginBottom: 10 }}>
          <strong className="gold">{regra.quando}:</strong> {regra.quantas.toLowerCase()}. {regra.texto}
          {!trocaLivre && (
            <div style={{ marginTop: 4 }}>
              Trocas disponíveis agora: <strong className={trocasDisponiveis > 0 ? 'gold' : ''}>{trocasDisponiveis}</strong>
              {modo === 'descanso-uma' ? ' (recarrega no descanso longo)' : ' (concedida a cada nível)'}
            </div>
          )}
        </div>

        {preparadas.length === 0 && (
          <p className="muted tiny">Nenhuma magia preparada — use o botão <strong>Preparar</strong>.</p>
        )}

        {ORDINAIS.map((titulo, lvl) => {
          if (lvl === 0) return null
          const lista = preparadas.filter((s) => s.level === lvl).sort((a, b) => a.name.localeCompare(b.name))
          if (lista.length === 0) return null
          return (
            <div key={lvl}>
              <div className="spell-lvl">{titulo}</div>
              {lista.map((s) => (
                <div className="list-item eq" key={s.id}>
                  <div className="spread">
                    <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                      <strong style={{ fontSize: '.92rem' }}>{s.name}</strong>
                      <div className="tiny muted">{resumoMagia(s)}</div>
                    </div>
                    <button
                      className="sm ghost"
                      onClick={() => {
                        if (trocaLivre) despreparar(s.id)
                        else { setTrocando(s.id); setFolha('preparar') }
                      }}
                      disabled={!trocaLivre && trocasDisponiveis === 0}
                    >{trocaLivre ? '✕' : '⇄'}</button>
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {excedente && (
          <div className="banner warn">
            ⚠ Você tem {preparadas.length} magias preparadas e o seu limite é {limitePreparadas}.
            Use o ✕ para tirar as que sobram.
          </div>
        )}
      </Card>

      {/* --- Grimório do Mago --- */}
      {modo === 'grimorio' && (
        <Card
          title={`Grimório (${grimorio.length} magias)`}
          action={<button className="sm" onClick={() => setFolha('grimorio')}>Estudar</button>}
        >
          <p className="muted tiny">
            Seu grimório guarda todas as magias que você aprendeu; a cada descanso longo você
            prepara, entre elas, até {limitePreparadas} magias.
          </p>
          {grimorio.length > 0 && (
            <div className="tiny muted" style={{ marginTop: 8 }}>
              {grimorio.map((s) => s.name).join(', ')}
            </div>
          )}
        </Card>
      )}

      {cardInatas}

      {/* ---------- Folha: preparar magias ---------- */}
      {folha === 'preparar' && (
        <Sheet
          title={trocando ? 'Trocar magia preparada' : 'Preparar magias'}
          onClose={() => { setFolha(null); setTrocando(null) }}
        >
          <div className="banner">
            <strong className="gold">{regra.quando}:</strong> {regra.quantas.toLowerCase()}.
            <div className="tiny" style={{ marginTop: 4 }}>{regra.texto}</div>
          </div>

          {trocando && (
            <div className="banner warn">
              Substituindo <strong>{spellById(trocando)?.name}</strong> — escolha a magia que entra no lugar.
              <button className="sm" style={{ marginTop: 8 }} onClick={() => setTrocando(null)}>Cancelar troca</button>
            </div>
          )}

          <div className="tiny muted" style={{ margin: '4px 0 10px' }}>
            Preparadas: <strong>{preparadas.length}/{limitePreparadas}</strong>
            {!trocando && vagasLivres > 0 && ` · ${vagasLivres} vaga(s) livre(s)`}
            {!trocaLivre && !trocando && vagasLivres <= 0 && trocasDisponiveis > 0
              && ' · a lista está cheia: use ⇄ numa magia preparada para trocá-la'}
          </div>

          {candidatas.length === 0 && (
            <p className="muted tiny">
              {modo === 'grimorio'
                ? 'Seu grimório ainda não tem magias — use "Estudar" para adicioná-las.'
                : 'Nenhuma magia disponível no seu nível.'}
            </p>
          )}

          {ORDINAIS.map((titulo, lvl) => {
            if (lvl === 0) return null
            const lista = candidatas.filter((s) => s.level === lvl)
            if (!lista.length) return null
            return (
              <details key={lvl} open={lvl <= 1}>
                <summary>{titulo} ({lista.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {lista.map((s) => {
                    const prep = preparadasIds.includes(s.id)
                    // Sem troca em curso, só dá para preencher vagas livres.
                    const podeEntrar = trocando ? !prep : !prep && vagasLivres > 0
                    return (
                      <div className={`list-item${prep ? ' eq' : ''}`} key={s.id}>
                        <div className="spread">
                          <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                            <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                            <div className="tiny muted">{resumoMagia(s)}</div>
                          </div>
                          {prep ? (
                            trocaLivre
                              ? <button className="sm gold" onClick={() => despreparar(s.id)}>✓ Preparada</button>
                              : <span className="tiny gold">✓ Preparada</span>
                          ) : (
                            <button
                              className="sm primary"
                              disabled={!podeEntrar}
                              onClick={() => (trocando ? trocar(trocando, s.id) : preparar(s.id))}
                            >{trocando ? 'Trocar' : '＋'}</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </Sheet>
      )}

      {/* ---------- Folha: truques ---------- */}
      {folha === 'truques' && (
        <Sheet title={`Truques (${truques.length}/${limiteTruques})`} onClose={() => setFolha(null)}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Escolha {limiteTruques} truque(s) da lista de {listasLabel}. Sempre que ganhar um nível
            nesta classe você pode substituir um truque por outro.
          </p>
          {truquesCandidatos.map((s) => {
            const tem = truquesIds.includes(s.id)
            return (
              <div className={`list-item${tem ? ' eq' : ''}`} key={s.id}>
                <div className="spread">
                  <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                    <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                    <div className="tiny muted">{resumoMagia(s)}</div>
                  </div>
                  <button
                    className={`sm${tem ? ' gold' : ' primary'}`}
                    disabled={!tem && truques.length >= limiteTruques}
                    onClick={() => toggleTruque(s.id)}
                  >{tem ? '✓' : '＋'}</button>
                </div>
              </div>
            )
          })}
        </Sheet>
      )}

      {/* ---------- Folha: grimório ---------- */}
      {folha === 'grimorio' && (
        <Sheet title="Grimório" onClose={() => setFolha(null)}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Você começa com 6 magias e adiciona 2 a cada nível de Mago, além das que copiar de
            pergaminhos e grimórios encontrados na aventura. Não há limite de tamanho.
          </p>
          {ORDINAIS.map((titulo, lvl) => {
            if (lvl === 0) return null
            const lista = catalogo.filter((s) => s.level === lvl)
            if (!lista.length) return null
            return (
              <details key={lvl} open={lvl <= 1}>
                <summary>{titulo} ({lista.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {lista.map((s) => {
                    const tem = char.spellsKnown.includes(s.id)
                    return (
                      <div className={`list-item${tem ? ' eq' : ''}`} key={s.id}>
                        <div className="spread">
                          <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                            <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                            <div className="tiny muted">{resumoMagia(s)}</div>
                          </div>
                          <button className={`sm${tem ? ' gold' : ' primary'}`} onClick={() => toggleGrimorio(s.id)}>
                            {tem ? '✓' : '＋'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </Sheet>
      )}

      {detail && <DetalheMagia id={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

/** Folha com a descrição completa de uma magia, usada nas duas variações da aba. */
function DetalheMagia({ id, onClose }: { id: string; onClose: () => void }) {
  const s = spellById(id)
  if (!s) return null
  return (
    <Sheet title={s.name} onClose={onClose}>
      <div className="muted tiny" style={{ marginBottom: 12, lineHeight: 1.7 }}>
        <strong className="gold">{s.level === 0 ? 'Truque' : `Magia de ${s.level}º nível`}</strong> · {s.school}
        <br /><strong>Tempo de Conjuração:</strong> {s.castingTime}
        <br /><strong>Alcance:</strong> {s.range}
        <br /><strong>Componentes:</strong> {s.components}
        <br /><strong>Duração:</strong> {s.duration}
        {s.concentration && <><br /><strong className="gold">Requer Concentração</strong></>}
        {s.ritual && <><br /><strong className="gold">Pode ser conjurada como Ritual</strong></>}
      </div>
      <SpellText desc={s.desc} />
      <div className="tiny muted" style={{ marginTop: 10 }}>Classes: {s.classes.map((c) => classById(c)?.name ?? c).join(', ')}</div>
    </Sheet>
  )
}
