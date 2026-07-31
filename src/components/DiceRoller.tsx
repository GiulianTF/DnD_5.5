import { useEffect, useState } from 'react'
import type { RollEntry } from '../types'
import { useStore } from '../store/store'
import { roll, type Advantage } from '../engine/dice'
import { Sheet, Segmented } from './ui'

const DICE = [4, 6, 8, 10, 12, 20, 100]

/** Quanto tempo o resultado flutuante fica na tela. */
const TOAST_MS = 7000

export function useRoller() {
  const pushRoll = useStore((s) => s.pushRoll)
  return pushRoll
}

export function RollResult({ entry }: { entry: RollEntry }) {
  return (
    <div className="roll-result">
      <div className="muted tiny">{entry.label}</div>
      <div className={`roll-total ${entry.crit ?? ''}`} key={entry.id}>{entry.total}</div>
      <div className="muted tiny">
        {entry.formula} → [{entry.rolls.join(', ')}]
        {entry.discarded?.length ? ` (descartado: ${entry.discarded.join(', ')})` : ''}
      </div>
      {entry.crit === 'critico' && <div className="gold" style={{ fontWeight: 700, marginTop: 4 }}>⚔ ACERTO CRÍTICO! (20 natural)</div>}
      {entry.crit === 'falha' && <div style={{ color: 'var(--red)', fontWeight: 700, marginTop: 4 }}>💀 FALHA CRÍTICA! (1 natural)</div>}
    </div>
  )
}

/**
 * Mostra a última rolagem sobre a tela, venha ela de onde vier (perícia, ataque,
 * salvaguarda ou do rolador). Antes o resultado só existia no topo da aba e passava
 * despercebido quando a página estava rolada para baixo.
 */
export function RollToast({ oculto = false }: { oculto?: boolean }) {
  const ultima = useStore((s) => s.rollLog[0]) as RollEntry | undefined
  const [dispensada, setDispensada] = useState<string | null>(null)

  useEffect(() => {
    if (!ultima) return
    const t = setTimeout(() => setDispensada(ultima.id), TOAST_MS)
    return () => clearTimeout(t)
  }, [ultima?.id])

  if (oculto || !ultima || dispensada === ultima.id) return null

  return (
    <div className="roll-toast" role="status" aria-live="polite" onClick={() => setDispensada(ultima.id)}>
      <div className="roll-toast-info">
        <div className="label">{ultima.label}</div>
        <div className="muted tiny">
          {ultima.formula} → [{ultima.rolls.join(', ')}]
          {ultima.discarded?.length ? ` (descartado: ${ultima.discarded.join(', ')})` : ''}
        </div>
        {ultima.crit === 'critico' && <div className="gold tiny" style={{ fontWeight: 700 }}>⚔ ACERTO CRÍTICO!</div>}
        {ultima.crit === 'falha' && <div className="tiny" style={{ color: 'var(--red)', fontWeight: 700 }}>💀 FALHA CRÍTICA!</div>}
      </div>
      <div className={`roll-toast-total ${ultima.crit ?? ''}`} key={ultima.id}>{ultima.total}</div>
    </div>
  )
}

export function DiceRollerSheet({ onClose }: { onClose: () => void }) {
  const { rollLog, pushRoll, clearRolls } = useStore()
  const [count, setCount] = useState(1)
  const [modifier, setModifier] = useState(0)
  const [advantage, setAdvantage] = useState<Advantage>('normal')
  const [last, setLast] = useState<ReturnType<typeof roll> | null>(null)

  const doRoll = (sides: number) => {
    const isD20 = sides === 20
    const entry = roll({
      label: `${isD20 && advantage !== 'normal' ? `d20 com ${advantage}` : `${count}d${sides}`}`,
      count,
      sides,
      modifier,
      advantage: isD20 ? advantage : 'normal',
      isD20Test: isD20,
    })
    setLast(entry)
    pushRoll(entry)
  }

  return (
    <Sheet title="🎲 Rolador de Dados" onClose={onClose}>
      {last && <RollResult entry={last} />}

      <div className="grid g2" style={{ marginBottom: 10 }}>
        <div>
          <label>Quantidade de dados</label>
          <input
            type="number" inputMode="numeric" min={1} max={20} value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
        </div>
        <div>
          <label>Modificador</label>
          <input
            type="number" inputMode="numeric" value={modifier}
            onChange={(e) => setModifier(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <label>Vantagem / Desvantagem (apenas d20)</label>
      <Segmented
        value={advantage}
        onChange={setAdvantage}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'vantagem', label: 'Vantagem' },
          { value: 'desvantagem', label: 'Desvantagem' },
        ]}
      />

      <div className="dice-grid" style={{ marginTop: 12 }}>
        {DICE.map((d) => (
          <button key={d} className="die-btn primary" onClick={() => doRoll(d)}>d{d}</button>
        ))}
      </div>

      <div className="spread" style={{ marginTop: 18, marginBottom: 4 }}>
        <h3 style={{ fontSize: '.95rem', color: 'var(--gold)' }}>Histórico</h3>
        {rollLog.length > 0 && <button className="sm ghost" onClick={clearRolls}>Limpar</button>}
      </div>
      {rollLog.length === 0 && <div className="muted tiny">Nenhuma rolagem ainda.</div>}
      {rollLog.map((r) => (
        <div className="log-line" key={r.id}>
          <span style={{ flex: 1 }}>
            {r.label}
            <span className="muted tiny"> · {r.formula} [{r.rolls.join(', ')}]</span>
          </span>
          <strong className={r.crit === 'critico' ? 'gold' : ''}>{r.total}</strong>
        </div>
      ))}
    </Sheet>
  )
}
