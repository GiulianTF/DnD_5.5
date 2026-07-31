import { useState } from 'react'
import type { Character, Spell } from '../../types'
import { ABILITY_NAMES } from '../../types'
import { SPELLS, spellById } from '../../data/spells'
import { classById } from '../../data/classes'
import {
  cantripLimit, maxSpellLevel, pactSlots, preparedLimit, spellSlots, spellcasting,
} from '../../engine/rules'
import { useStore } from '../../store/store'
import { Card, Empty, Sheet } from '../../components/ui'

const ORDINAIS = ['Truques', '1º Nível', '2º Nível', '3º Nível', '4º Nível', '5º Nível', '6º Nível', '7º Nível', '8º Nível', '9º Nível']

export function SpellsTab({ char }: { char: Character }) {
  const { updateCharacter, spendSlot, spendPactSlot } = useStore()
  const [browser, setBrowser] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)

  const cls = classById(char.classId)
  const sc = spellcasting(char)
  const slots = spellSlots(char)
  const pact = pactSlots(char)
  const prepLimit = preparedLimit(char)
  const cantripMax = cantripLimit(char)
  const maxLvl = maxSpellLevel(char)

  if (!sc || !cls) {
    return (
      <Empty
        icon="✨"
        title={`${cls?.name ?? 'Esta classe'} não conjura magias`}
        hint="Subclasses como Cavaleiro Arcano e Trapaceiro Arcano ganham conjuração no 3º nível."
      />
    )
  }

  const conhecidas = char.spellsKnown.map((id) => spellById(id)).filter((s): s is Spell => !!s)
  const preparadas = char.spellsPrepared
  const truquesConhecidos = conhecidas.filter((s) => s.level === 0)
  const magiasConhecidas = conhecidas.filter((s) => s.level > 0)
  const preparadasCount = magiasConhecidas.filter((s) => preparadas.includes(s.id)).length

  const togglePrepared = (id: string) => {
    const s = spellById(id)
    if (!s) return
    if (s.level === 0) return // truques estão sempre disponíveis
    updateCharacter(char.id, (c) => ({
      spellsPrepared: c.spellsPrepared.includes(id)
        ? c.spellsPrepared.filter((x) => x !== id)
        : [...c.spellsPrepared, id],
    }))
  }

  const addSpell = (id: string) => {
    updateCharacter(char.id, (c) => ({
      spellsKnown: c.spellsKnown.includes(id) ? c.spellsKnown : [...c.spellsKnown, id],
      spellsPrepared: spellById(id)?.level === 0 ? [...c.spellsPrepared, id] : c.spellsPrepared,
    }))
  }

  const removeSpell = (id: string) => {
    updateCharacter(char.id, (c) => ({
      spellsKnown: c.spellsKnown.filter((x) => x !== id),
      spellsPrepared: c.spellsPrepared.filter((x) => x !== id),
    }))
  }

  const catalogo = SPELLS.filter((s) => s.classes.includes(char.classId) && s.level <= maxLvl)
  const porNivel = (lvl: number) => catalogo.filter((s) => s.level === lvl)

  return (
    <div>
      <Card title="Conjuração">
        <div className="grid g3">
          <div className="ability">
            <div className="name">Habilidade</div>
            <div className="mod" style={{ fontSize: '1rem', paddingTop: 8 }}>{ABILITY_NAMES[sc.ability].slice(0, 3)}</div>
            <div className="score">{sc.mod >= 0 ? `+${sc.mod}` : sc.mod}</div>
          </div>
          <div className="ability">
            <div className="name">CD de Magia</div>
            <div className="mod">{sc.saveDC}</div>
            <div className="score">salvaguarda</div>
          </div>
          <div className="ability">
            <div className="name">Ataque</div>
            <div className="mod">+{sc.attackBonus}</div>
            <div className="score">mágico</div>
          </div>
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

      <button className="primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => setBrowser(true)}>
        ＋ Adicionar magia ao repertório
      </button>

      {prepLimit !== null && (
        <div className={`banner${preparadasCount > prepLimit ? ' warn' : ''}`}>
          Magias preparadas: <strong>{preparadasCount}/{prepLimit}</strong>
          {' · '}Truques: <strong>{truquesConhecidos.length}/{cantripMax}</strong>
          {preparadasCount > prepLimit && <div>⚠ Você excedeu o limite de magias preparadas do seu nível.</div>}
        </div>
      )}

      {conhecidas.length === 0 && (
        <Empty icon="📖" title="Nenhuma magia no repertório" hint="Use o botão acima para adicionar truques e magias." />
      )}

      {ORDINAIS.map((titulo, lvl) => {
        const lista = conhecidas.filter((s) => s.level === lvl)
        if (lista.length === 0) return null
        return (
          <div key={lvl}>
            <div className="spell-lvl">{titulo}</div>
            {lista.map((s) => {
              const prep = lvl === 0 || preparadas.includes(s.id)
              return (
                <div className={`list-item${prep ? ' eq' : ''}`} key={s.id}>
                  <div className="spread">
                    <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                      <strong style={{ fontSize: '.92rem' }}>{s.name}</strong>
                      <div className="tiny muted">
                        {s.school} · {s.castingTime} · {s.range}
                        {s.concentration ? ' · Concentração' : ''}{s.ritual ? ' · Ritual' : ''}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      {lvl > 0 && (
                        <button className={`sm${prep ? ' gold' : ''}`} onClick={() => togglePrepared(s.id)}>
                          {prep ? '✓ Preparada' : 'Preparar'}
                        </button>
                      )}
                      <button className="sm ghost" onClick={() => removeSpell(s.id)}>🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {browser && (
        <Sheet title={`Magias de ${cls.name}`} onClose={() => setBrowser(false)}>
          <p className="muted tiny" style={{ marginBottom: 10 }}>
            Mostrando magias de até {maxLvl}º nível, o máximo acessível no seu nível atual.
          </p>
          {ORDINAIS.slice(0, maxLvl + 1).map((titulo, lvl) => {
            const lista = porNivel(lvl)
            if (!lista.length) return null
            return (
              <details key={lvl} open={lvl <= 1}>
                <summary>{titulo} ({lista.length})</summary>
                <div style={{ marginTop: 8 }}>
                  {lista.map((s) => {
                    const tem = char.spellsKnown.includes(s.id)
                    return (
                      <div className="list-item" key={s.id}>
                        <div className="spread">
                          <div style={{ flex: 1 }} onClick={() => setDetail(s.id)}>
                            <strong style={{ fontSize: '.9rem' }}>{s.name}</strong>
                            <div className="tiny muted">{s.school} · {s.castingTime} · {s.range}</div>
                          </div>
                          <button className={`sm${tem ? '' : ' primary'}`} disabled={tem} onClick={() => addSpell(s.id)}>
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

      {detail && (() => {
        const s = spellById(detail)!
        return (
          <Sheet title={s.name} onClose={() => setDetail(null)}>
            <div className="muted tiny" style={{ marginBottom: 12, lineHeight: 1.7 }}>
              <strong className="gold">{s.level === 0 ? 'Truque' : `Magia de ${s.level}º nível`}</strong> · {s.school}
              <br /><strong>Tempo de Conjuração:</strong> {s.castingTime}
              <br /><strong>Alcance:</strong> {s.range}
              <br /><strong>Componentes:</strong> {s.components}
              <br /><strong>Duração:</strong> {s.duration}
              {s.concentration && <><br /><strong className="gold">Requer Concentração</strong></>}
              {s.ritual && <><br /><strong className="gold">Pode ser conjurada como Ritual</strong></>}
            </div>
            <p style={{ lineHeight: 1.6, fontSize: '.9rem' }}>{s.desc}</p>
            <div className="tiny muted" style={{ marginTop: 10 }}>Classes: {s.classes.map((c) => classById(c)?.name ?? c).join(', ')}</div>
            {!char.spellsKnown.includes(s.id) && (
              <button className="primary" style={{ width: '100%', marginTop: 12 }} onClick={() => { addSpell(s.id); setDetail(null) }}>
                Adicionar ao repertório
              </button>
            )}
          </Sheet>
        )
      })()}
    </div>
  )
}
