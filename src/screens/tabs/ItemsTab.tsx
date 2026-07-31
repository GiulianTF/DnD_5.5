import { useState } from 'react'
import type { Character, Item } from '../../types'
import { ARMORS, GEAR, MAGIC_ITEMS, SHIELD, WEAPONS, itemById } from '../../data/equipment'
import {
  armorClass, attunedCount, isProficientWithArmor, isProficientWithWeapon, resolveInventory,
} from '../../engine/rules'
import { useStore } from '../../store/store'
import { uid } from '../../engine/uid'
import { Card, Empty, Sheet } from '../../components/ui'

const CATEGORIAS = [
  { id: 'arma', label: 'Armas', items: WEAPONS },
  { id: 'armadura', label: 'Armaduras e Escudos', items: [...ARMORS, SHIELD] },
  { id: 'equipamento', label: 'Equipamento', items: GEAR },
  { id: 'magico', label: 'Itens Mágicos', items: MAGIC_ITEMS },
] as const

export function ItemsTab({ char }: { char: Character }) {
  const update = useStore((s) => s.updateCharacter)
  const [catalog, setCatalog] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)

  const inv = resolveInventory(char)
  const ac = armorClass(char)
  const attuned = attunedCount(char)

  const addItem = (itemId: string) => {
    update(char.id, (c) => ({
      inventory: [...c.inventory, { uid: uid(), itemId, qty: 1, equipped: false }],
    }))
  }

  const removeItem = (uid: string) =>
    update(char.id, (c) => ({ inventory: c.inventory.filter((e) => e.uid !== uid) }))

  const patchEntry = (uid: string, patch: Partial<Character['inventory'][number]>) =>
    update(char.id, (c) => ({ inventory: c.inventory.map((e) => (e.uid === uid ? { ...e, ...patch } : e)) }))

  const toggleEquip = (uid: string) => {
    const entry = char.inventory.find((e) => e.uid === uid)
    if (!entry) return
    const item = itemById(entry.itemId)
    if (!item) return
    const equipping = !entry.equipped

    update(char.id, (c) => ({
      inventory: c.inventory.map((e) => {
        if (e.uid === uid) return { ...e, equipped: equipping }
        // Só uma armadura e um escudo por vez
        if (equipping && item.kind === 'armadura' && itemById(e.itemId)?.kind === 'armadura') return { ...e, equipped: false }
        if (equipping && item.kind === 'escudo' && itemById(e.itemId)?.kind === 'escudo') return { ...e, equipped: false }
        return e
      }),
    }))
  }

  const toggleAttune = (uid: string) => {
    const entry = char.inventory.find((e) => e.uid === uid)
    if (!entry) return
    if (!entry.attuned && attuned >= 3) return
    patchEntry(uid, { attuned: !entry.attuned })
  }

  const equipados = inv.filter((r) => r.entry.equipped || r.entry.attuned)
  const guardados = inv.filter((r) => !r.entry.equipped && !r.entry.attuned)

  const renderEntry = (r: ReturnType<typeof resolveInventory>[number]) => {
    const { entry, item, name } = r
    const podeEquipar = item.kind === 'arma' || item.kind === 'armadura' || item.kind === 'escudo'
    const podeSintonizar = !!item.magic?.attunement
    const podeBonus = item.kind === 'arma' || item.kind === 'armadura' || item.kind === 'escudo'
    const proficiente = item.kind === 'arma'
      ? isProficientWithWeapon(char, item)
      : (item.kind === 'armadura' || item.kind === 'escudo') ? isProficientWithArmor(char, item) : true

    return (
      <div className={`list-item${entry.equipped ? ' eq' : ''}`} key={entry.uid}>
        <div className="spread">
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '.93rem' }}>{name}</strong>
            <div className="tiny muted">{describeItem(item)}</div>
            {!proficiente && podeEquipar && (
              <div className="tiny" style={{ color: 'var(--red)' }}>⚠ Sem proficiência</div>
            )}
            {item.magic?.desc && <div className="tiny gold">{item.magic.desc}</div>}
          </div>
          <button className="sm ghost" onClick={() => removeItem(entry.uid)} aria-label="Remover">🗑</button>
        </div>

        <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
          {podeEquipar && (
            <button className={`sm${entry.equipped ? ' gold' : ''}`} onClick={() => toggleEquip(entry.uid)}>
              {entry.equipped ? '✓ Equipado' : 'Equipar'}
            </button>
          )}
          {podeSintonizar && (
            <button className={`sm${entry.attuned ? ' gold' : ''}`}
              disabled={!entry.attuned && attuned >= 3}
              onClick={() => toggleAttune(entry.uid)}>
              {entry.attuned ? '✓ Sintonizado' : 'Sintonizar'}
            </button>
          )}
          {podeBonus && (
            <div className="row" style={{ gap: 4 }}>
              <span className="tiny muted">Bônus mágico:</span>
              {[0, 1, 2, 3].map((b) => (
                <button key={b} className={`sm${(entry.bonus ?? 0) === b ? ' gold' : ' ghost'}`}
                  style={{ minWidth: 34, padding: '4px 6px' }}
                  onClick={() => patchEntry(entry.uid, { bonus: b })}>
                  {b === 0 ? '—' : `+${b}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Card title="Classe de Armadura">
        <div className="spread">
          <div>
            <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'Georgia, serif' }}>{ac.total}</span>
            <div className="tiny muted">{ac.breakdown}</div>
          </div>
          <div className="tiny muted center">
            Sintonização<br /><strong className={attuned >= 3 ? '' : 'gold'}>{attuned}/3</strong>
          </div>
        </div>
      </Card>

      <button className="primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => setCatalog(true)}>
        ＋ Adicionar item do catálogo
      </button>

      {inv.length === 0 && <Empty icon="🎒" title="Mochila vazia" hint="Adicione armas, armaduras e itens mágicos pelo catálogo." />}

      {equipados.length > 0 && (
        <Card title="Equipado / Sintonizado">{equipados.map(renderEntry)}</Card>
      )}
      {guardados.length > 0 && (
        <Card title="Na mochila">{guardados.map(renderEntry)}</Card>
      )}

      <Card title="Moedas de Ouro">
        <div className="row" style={{ gap: 6 }}>
          <input type="number" inputMode="numeric" value={char.gold}
            onChange={(e) => update(char.id, { gold: Math.max(0, Number(e.target.value) || 0) })} />
          <span className="gold">PO</span>
        </div>
      </Card>

      {catalog && (
        <Sheet title="Catálogo de Itens" onClose={() => setCatalog(false)}>
          {CATEGORIAS.map((cat) => (
            <details key={cat.id} open={cat.id === 'arma'}>
              <summary>{cat.label} ({cat.items.length})</summary>
              <div style={{ marginTop: 8 }}>
                {cat.items.map((item) => (
                  <div className="list-item" key={item.id}>
                    <div className="spread">
                      <div style={{ flex: 1 }} onClick={() => setDetail(item.id)}>
                        <strong style={{ fontSize: '.9rem' }}>{item.name}</strong>
                        <div className="tiny muted">{describeItem(item)}</div>
                      </div>
                      <button className="sm primary" onClick={() => addItem(item.id)}>＋</button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
          <div className="muted tiny center" style={{ marginTop: 12 }}>
            Para criar uma arma mágica, adicione a arma comum e depois escolha o bônus (+1/+2/+3) na mochila.
          </div>
        </Sheet>
      )}

      {detail && (
        <Sheet title={itemById(detail)?.name ?? 'Item'} onClose={() => setDetail(null)}>
          <p className="muted">{describeItem(itemById(detail)!)}</p>
          {itemById(detail)?.magic?.desc && <div className="banner">{itemById(detail)!.magic!.desc}</div>}
          <button className="primary" style={{ width: '100%' }} onClick={() => { addItem(detail); setDetail(null) }}>
            Adicionar à mochila
          </button>
        </Sheet>
      )}
    </div>
  )
}

function describeItem(item: Item): string {
  if (item.weapon) {
    const w = item.weapon
    const parts = [`${w.damage} ${w.damageType}`, w.category === 'simples' ? 'Simples' : 'Marcial']
    if (w.range) parts.push(w.range)
    if (w.properties.length) parts.push(w.properties.join(', '))
    parts.push(`Maestria: ${w.mastery}`)
    if (item.cost) parts.push(item.cost)
    return parts.join(' · ')
  }
  if (item.kind === 'escudo') return `+2 na CA · Escudo · ${item.cost ?? ''}`
  if (item.armor) {
    const a = item.armor
    const dex = a.dexMax === undefined ? '+ mod. DES' : a.dexMax === 0 ? 'sem bônus de DES' : `+ mod. DES (máx. ${a.dexMax})`
    const req = a.strengthReq ? ` · Requer FOR ${a.strengthReq}` : ''
    const furt = a.stealthDisadv ? ' · Desvantagem em Furtividade' : ''
    return `CA ${a.baseAC} ${dex} · Armadura ${a.category}${req}${furt} · ${item.cost ?? ''}`
  }
  if (item.magic?.desc) return item.magic.desc
  return [item.desc, item.cost].filter(Boolean).join(' · ') || 'Equipamento'
}
