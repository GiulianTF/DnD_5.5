import { useEffect, type ReactNode } from 'react'
import type { OptionGroup } from '../types'

export function Sheet({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="ghost icon" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 14 }}>{footer}</div>}
      </div>
    </div>
  )
}

export function Card({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card">
      {title && (
        <div className="spread" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Choice({ selected, title, desc, onClick }: {
  selected: boolean
  title: string
  desc?: string
  onClick: () => void
}) {
  return (
    <button className={`choice${selected ? ' on' : ''}`} onClick={onClick}>
      <strong>{selected ? '✓ ' : ''}{title}</strong>
      {desc && <span>{desc}</span>}
    </button>
  )
}

/** Cartão de escolha obrigatória (ancestral dracônico, estilo de luta, dádiva de gigante...). */
export function ChoiceGroup({ group, value, onChange, aviso = true }: {
  group: OptionGroup
  value?: string
  onChange: (optionId: string) => void
  aviso?: boolean
}) {
  return (
    <Card title={group.name}>
      {group.desc && <p className="muted tiny" style={{ marginBottom: 10 }}>{group.desc}</p>}
      {group.options.map((o) => (
        <Choice key={o.id} selected={value === o.id} title={o.name} desc={o.desc} onClick={() => onChange(o.id)} />
      ))}
      {aviso && !value && <div className="banner warn">Escolha uma opção para continuar.</div>}
    </Card>
  )
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label?: ReactNode
}) {
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="sm" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <div style={{ minWidth: 44, textAlign: 'center', fontWeight: 700 }}>{label ?? value}</div>
      <button className="sm" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  )
}

export function Empty({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <div>{title}</div>
      {hint && <div className="tiny" style={{ marginTop: 6 }}>{hint}</div>}
    </div>
  )
}
