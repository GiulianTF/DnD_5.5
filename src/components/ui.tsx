import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { OptionGroup } from '../types'
import { featureOptionBlocked, type ResolvedFeaturePick } from '../engine/rules'

/**
 * Escopo de acordeão: dentro dele apenas uma escolha fica expandida por vez —
 * abrir uma fecha automaticamente a anterior.
 */
const AccordionCtx = createContext<{ aberta: string | null; abrir: (id: string | null) => void } | null>(null)

export function ChoiceAccordion({ children }: { children: ReactNode }) {
  const [aberta, abrir] = useState<string | null>(null)
  return <AccordionCtx.Provider value={{ aberta, abrir }}>{children}</AccordionCtx.Provider>
}

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

/**
 * Item de escolha. Quando recebe `details`, vira um item expansível: selecionar
 * abre o detalhe e a setinha permite abrir/fechar sem mudar a seleção.
 */
export function Choice({ selected, title, desc, onClick, details, disabled, defaultOpen = false, id }: {
  selected: boolean
  title: string
  desc?: ReactNode
  onClick: () => void
  details?: ReactNode
  disabled?: boolean
  defaultOpen?: boolean
  /** identidade dentro do acordeão; por padrão usa o título */
  id?: string
}) {
  const acordeao = useContext(AccordionCtx)
  const chave = id ?? title
  const [localOpen, setLocalOpen] = useState(defaultOpen)

  // Dentro de um acordeão quem manda é o pai; fora dele cada item cuida de si.
  const open = acordeao ? acordeao.aberta === chave : localOpen
  const setOpen = (v: boolean) => (acordeao ? acordeao.abrir(v ? chave : null) : setLocalOpen(v))

  // Ao montar, deixa a opção já selecionada aberta.
  useEffect(() => {
    if (defaultOpen && acordeao) acordeao.abrir(chave)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!details) {
    return (
      <button className={`choice${selected ? ' on' : ''}`} onClick={onClick} disabled={disabled}>
        <strong>{selected ? '✓ ' : ''}{title}</strong>
        {desc && <span>{desc}</span>}
      </button>
    )
  }

  return (
    <div className={`choice expandable${selected ? ' on' : ''}${disabled ? ' disabled' : ''}`}>
      <div className="choice-head">
        <button
          className="choice-main"
          disabled={disabled}
          onClick={() => { onClick(); setOpen(true) }}
        >
          <strong>{selected ? '✓ ' : ''}{title}</strong>
          {desc && <span>{desc}</span>}
        </button>
        <button
          className="choice-toggle"
          aria-expanded={open}
          aria-label={open ? 'Recolher detalhes' : 'Ver detalhes'}
          onClick={() => setOpen(!open)}
        >{open ? '▲' : '▼'}</button>
      </div>
      {open && <div className="choice-details">{details}</div>}
    </div>
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
      <ChoiceAccordion>
        {group.options.map((o) => (
          <Choice
            key={o.id}
            id={o.id}
            selected={value === o.id}
            title={o.name}
            details={<p>{o.desc}</p>}
            defaultOpen={value === o.id}
            onClick={() => onChange(o.id)}
          />
        ))}
      </ChoiceAccordion>
      {aviso && !value && <div className="banner warn">Escolha uma opção para continuar.</div>}
    </Card>
  )
}

/**
 * Cartão de característica com várias opções (Manobras, Invocações Místicas,
 * Metamagia...). Grupos com `count > 0` são de escolha; os demais só listam o
 * que a característica concede.
 */
export function FeaturePickCard({ grupo, onToggle, aviso = true }: {
  grupo: ResolvedFeaturePick
  onToggle: (optionId: string) => void
  aviso?: boolean
}) {
  const { pick, count, options, chosen, die, subclassName, className } = grupo
  const escolhavel = count > 0
  const titulo = escolhavel ? `${pick.name} (${chosen.length}/${count})` : pick.name

  return (
    <Card title={titulo}>
      <p className="muted tiny" style={{ marginBottom: 10 }}>
        <strong className="gold">{subclassName ?? className}</strong>
        {die && <> · Dado: <strong className="gold">{die}</strong></>}
        {pick.desc && <> — {pick.desc}</>}
        {pick.nota && <> {pick.nota}</>}
      </p>
      <ChoiceAccordion>
        {options.map((o) => {
          const marcada = chosen.includes(o.id)
          const bloqueada = escolhavel && !marcada && (
            featureOptionBlocked(o, chosen) || chosen.length >= count
          )
          return (
            <Choice
              key={o.id}
              id={`${pick.id}-${o.id}`}
              selected={escolhavel ? marcada : true}
              disabled={bloqueada}
              title={o.name}
              desc={[
                o.cost !== undefined && o.cost !== 1 ? (o.cost === 0 ? 'sem custo' : `custo ${o.cost}`) : null,
                o.level && o.level > 1 ? `nível ${o.level}` : null,
                o.requires ? `exige ${options.find((x) => x.id === o.requires)?.name ?? o.requires}` : null,
              ].filter(Boolean).join(' · ') || undefined}
              details={<p>{o.desc}</p>}
              onClick={() => { if (escolhavel && !bloqueada) onToggle(o.id) }}
            />
          )
        })}
      </ChoiceAccordion>
      {aviso && escolhavel && chosen.length < count && (
        <div className="banner warn">Escolha {count - chosen.length} opção(ões) para continuar.</div>
      )}
    </Card>
  )
}

/**
 * Descrição integral de uma magia (um parágrafo por item, exatamente como no
 * Livro do Jogador). Os títulos padronizados do livro saem destacados.
 */
const TITULOS_DE_MAGIA = /^(Usando um Espaço de Magia de Círculo Superior\.|Aprimoramento de Truque\.)\s*/

export function SpellText({ desc }: { desc: string[] }) {
  return (
    <>
      {desc.map((paragrafo, i) => {
        const titulo = paragrafo.match(TITULOS_DE_MAGIA)
        return (
          <p className="spell-p" key={i}>
            {titulo
              ? <><strong className="gold">{titulo[1]}</strong> {paragrafo.slice(titulo[0].length)}</>
              : paragrafo}
          </p>
        )
      })}
    </>
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
