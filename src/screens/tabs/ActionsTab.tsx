import { useState } from 'react'
import type { Character } from '../../types'
import { ABILITY_NAMES } from '../../types'
import {
  attackActions, abilityMods, characterResources, featurePickGroups, proficiencyBonus, spellcasting,
  type ResolvedFeaturePick, type ResourceState,
} from '../../engine/rules'
import { roll, rollDamage, type Advantage } from '../../engine/dice'
import { useStore } from '../../store/store'
import { Card, Empty, Segmented } from '../../components/ui'
import { ConfirmarUso } from '../../components/ConfirmarUso'

export function ActionsTab({ char }: { char: Character }) {
  const pushRoll = useStore((s) => s.pushRoll)
  const useResource = useStore((s) => s.useResource)
  const [advantage, setAdvantage] = useState<Advantage>('normal')
  const [critArmed, setCritArmed] = useState<Record<string, boolean>>({})
  /** opção aguardando a confirmação de uso */
  const [usando, setUsando] = useState<{
    grupo: ResolvedFeaturePick; nome: string; desc: string; custo: number; recurso?: ResourceState
  } | null>(null)

  const attacks = attackActions(char)
  const mods = abilityMods(char)
  const pb = proficiencyBonus(char.level)
  const sc = spellcasting(char)

  const recursos = characterResources(char)
  const recursoPorId = new Map(recursos.map((r) => [r.id, r]))
  const grupos = featurePickGroups(char)
  // Recursos que nenhum grupo de características já apresenta, listados no fim.
  const idsUsados = new Set(grupos.map((g) => g.resourceId).filter(Boolean) as string[])
  const outrosRecursos = recursos.filter((r) => !idsUsados.has(r.id))

  // O resultado aparece no aviso flutuante (RollToast), visível em qualquer ponto da página.
  const doAttack = (uid: string, name: string, bonus: number) => {
    const entry = roll({ label: `Ataque: ${name}`, sides: 20, modifier: bonus, advantage, isD20Test: true })
    pushRoll(entry)
    setCritArmed((c) => ({ ...c, [uid]: entry.crit === 'critico' }))
  }

  const doDamage = (uid: string, name: string, dice: string, bonus: number, type: string) => {
    pushRoll(rollDamage(`Dano: ${name}`, dice, bonus, type, critArmed[uid] ?? false))
    setCritArmed((c) => ({ ...c, [uid]: false }))
  }

  /**
   * Usar uma opção desconta o recurso dela (uma manobra tira um Dado de
   * Superioridade, uma metamagia tira os Pontos de Feitiçaria do custo). A
   * rolagem é opcional: quem rola na mesa marca o gasto do mesmo jeito.
   */
  const usarOpcao = (rolar: boolean) => {
    if (!usando) return
    const { grupo, nome, custo, recurso } = usando
    if (recurso && custo > 0) useResource(char.id, recurso.id, custo)
    if (rolar && grupo.die) {
      const lados = Number(grupo.die.replace('d', ''))
      if (Number.isFinite(lados) && lados > 0) {
        pushRoll(roll({ label: `${grupo.pick.name}: ${nome}`, sides: lados }))
      }
    }
    setUsando(null)
  }

  const Contador = ({ r }: { r: ResourceState }) => {
    const restantes = r.max - r.used
    const esgotado = restantes <= 0
    return (
      <div className="spread" style={{ marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: '.92rem' }}>{r.name}</strong>
          <div className="tiny muted">
            {r.shortRestUses
              ? `Recupera ${r.shortRestUses} uso no descanso curto · todos no longo`
              : `Recarrega em descanso ${r.recharge}`}
            {esgotado && <span style={{ color: 'var(--red)' }}> · ESGOTADO</span>}
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="sm" disabled={r.used <= 0} onClick={() => useResource(char.id, r.id, -1)}>+</button>
          <strong style={{ minWidth: 48, textAlign: 'center', color: esgotado ? 'var(--red)' : undefined }}>
            {restantes}/{r.max}
          </strong>
          <button className="sm" disabled={esgotado} onClick={() => useResource(char.id, r.id, 1)}>−</button>
        </div>
      </div>
    )
  }

  return (
    <div>
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
            pushRoll(entry)
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
              pushRoll(entry)
            }}>Rolar +{sc.attackBonus}</button>
          </div>
        </Card>
      )}

      {/*
        Recursos de classe e de subclasse: Manobras com os Dados de Superioridade,
        Canalizar Divindade, Metamagia com os Pontos de Feitiçaria, Pontos de Foco...
        Usar uma opção desconta o recurso e rola o dado associado, quando existe.
      */}
      {grupos.map((g, i) => {
        const recurso = g.resourceId ? recursoPorId.get(g.resourceId) : undefined
        const restantes = recurso ? recurso.max - recurso.used : Infinity
        // Clérigo e Paladino têm dois grupos ligados ao mesmo Canalizar Divindade:
        // o contador aparece só no primeiro deles.
        const primeiroDoRecurso = !recurso
          || grupos.findIndex((o) => o.resourceId === g.resourceId) === i
        return (
          <Card key={`${g.classId}-${g.pick.id}`} title={g.pick.name}>
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              <strong className="gold">{g.subclassName ?? g.className}</strong>
              {g.die && <> · Dado: <strong className="gold">{g.die}</strong></>}
              {g.count > 0 && <> · {g.chosen.length}/{g.count} escolhidas</>}
            </p>

            {recurso && primeiroDoRecurso && <Contador r={recurso} />}
            {recurso && !primeiroDoRecurso && (
              <div className="tiny muted" style={{ marginBottom: 10 }}>
                Usa o mesmo {recurso.name}: <strong className="gold">{restantes}/{recurso.max}</strong>
              </div>
            )}

            {g.pending && (
              <div className="banner warn">
                Faltam escolher {g.count - g.chosen.length} opção(ões). Toque no nome do
                personagem, no topo, e abra <strong>{g.pick.name}</strong>.
              </div>
            )}

            {g.active.length === 0 && !g.pending && (
              <div className="muted tiny">Nenhuma opção escolhida ainda.</div>
            )}

            {g.active.map((o) => {
              const custo = o.cost ?? (recurso ? 1 : 0)
              const semRecurso = custo > 0 && custo > restantes
              return (
                <div className="list-item" key={o.id}>
                  <div className="spread" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <strong style={{ fontSize: '.92rem' }}>{o.name}</strong>
                      {custo !== 1 && recurso && (
                        <span className="tiny gold"> · {custo === 0 ? 'sem custo' : `custo ${custo}`}</span>
                      )}
                      <div className="tiny muted">{o.desc}</div>
                    </div>
                    <button
                      className="sm primary"
                      disabled={semRecurso}
                      onClick={() => setUsando({ grupo: g, nome: o.name, desc: o.desc, custo, recurso })}
                    >
                      {g.die ? `🎲 Usar ${g.die}` : 'Usar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </Card>
        )
      })}

      {outrosRecursos.length > 0 && (
        <Card title="Outros Recursos">
          {outrosRecursos.map((r) => <Contador key={r.id} r={r} />)}
        </Card>
      )}

      {usando && (
        <ConfirmarUso
          titulo={usando.nome}
          subtitulo={usando.grupo.subclassName ?? usando.grupo.className}
          dados={usando.grupo.die}
          custos={usando.recurso && usando.custo > 0
            ? [{
              id: usando.recurso.id,
              label: `${usando.custo} ${usando.recurso.name}`,
              restantes: usando.recurso.max - usando.recurso.used,
            }]
            : undefined}
          detalhe={usando.desc}
          onUsar={usarOpcao}
          onFechar={() => setUsando(null)}
        />
      )}
    </div>
  )
}
