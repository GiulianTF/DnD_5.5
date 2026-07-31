import { useMemo, useState } from 'react'
import type { Character, CoinKey, Item, ItemRarity } from '../../types'
import { COINS, COIN_NAMES, RARITY_NAMES, RARITY_ORDER } from '../../types'
import { ARMORS, GEAR, MAGIC_ITEMS, SHIELD, WEAPONS, itemById } from '../../data/equipment'
import {
  armorClass, attunedCount, isProficientWithArmor, isProficientWithWeapon, resolveInventory,
} from '../../engine/rules'
import { formatCopper, pagar, parseCost, purseInCopper } from '../../engine/money'
import { useStore } from '../../store/store'
import { uid } from '../../engine/uid'
import { Card, Empty, Sheet } from '../../components/ui'

const CATEGORIAS = [
  { id: 'arma', label: 'Armas', items: WEAPONS },
  { id: 'armadura', label: 'Armaduras e Escudos', items: [...ARMORS, SHIELD] },
  { id: 'equipamento', label: 'Equipamento', items: GEAR },
] as const

/** Remove acentos para a busca do catálogo funcionar com ou sem eles. */
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function ItemsTab({ char }: { char: Character }) {
  const update = useStore((s) => s.updateCharacter)
  const [catalog, setCatalog] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  // O catálogo do Livro do Mestre tem centenas de itens: filtramos e agrupamos por raridade.
  const magicosPorRaridade = useMemo(() => {
    const termo = semAcento(busca.trim())
    const filtrados = termo
      ? MAGIC_ITEMS.filter((i) => semAcento(i.name).includes(termo)
        || (i.magic?.categoryDetail && semAcento(i.magic.categoryDetail).includes(termo)))
      : MAGIC_ITEMS
    return RARITY_ORDER
      .map((r) => ({ rarity: r, items: filtrados.filter((i) => i.magic?.rarity === r) }))
      .filter((g) => g.items.length > 0)
  }, [busca])

  const inv = resolveInventory(char)
  const ac = armorClass(char)
  const attuned = attunedCount(char)
  const bolsa = char.coins

  /**
   * Adiciona o item e desconta o preço da bolsa. Se faltar dinheiro, o item entra
   * do mesmo jeito (pode ter sido um saque ou presente do mestre) e o aviso explica.
   */
  const addItem = (itemId: string) => {
    const item = itemById(itemId)
    const custo = parseCost(item?.cost)
    const nova = custo ? pagar(char.coins, custo) : null

    update(char.id, (c) => ({
      inventory: [...c.inventory, { uid: uid(), itemId, qty: 1, equipped: false }],
      ...(nova ? { coins: nova } : {}),
    }))

    if (!custo) setAviso(`${item?.name ?? 'Item'} adicionado (sem preço de tabela — nada foi descontado).`)
    else if (nova) setAviso(`${item?.name} comprado por ${formatCopper(custo)}.`)
    else setAviso(`${item?.name} adicionado, mas você não tinha ${formatCopper(custo)} — nada foi descontado.`)
  }

  const setCoin = (k: CoinKey, v: number) =>
    update(char.id, (c) => ({ coins: { ...c.coins, [k]: Math.max(0, Math.floor(v) || 0) } }))

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

      <Card title="Bolsa de Moedas">
        <div className="coin-grid">
          {COINS.map((k) => (
            <div key={k}>
              <label>{k.toUpperCase()} <span className="muted tiny">{COIN_NAMES[k]}</span></label>
              <input type="number" inputMode="numeric" min={0} value={bolsa[k]}
                onChange={(e) => setCoin(k, Number(e.target.value))} />
            </div>
          ))}
        </div>
        <div className="muted tiny" style={{ marginTop: 8 }}>
          Total: <strong className="gold">{formatCopper(purseInCopper(bolsa))}</strong>.
          Ao adicionar um item do catálogo, o preço de tabela é descontado automaticamente
          (com troco quando precisa quebrar uma moeda maior).
        </div>
      </Card>

      {catalog && (
        <Sheet title="Catálogo de Itens" onClose={() => { setCatalog(false); setAviso(null) }}>
          <div className="banner">
            Na bolsa: <strong className="gold">{formatCopper(purseInCopper(bolsa))}</strong>
            {aviso && <div className="tiny" style={{ marginTop: 4 }}>{aviso}</div>}
          </div>
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

          {/* Itens mágicos do Livro do Mestre: do Comum ao Artefato. */}
          <details open>
            <summary>Itens Mágicos ({MAGIC_ITEMS.length})</summary>
            <div style={{ marginTop: 8 }}>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar item mágico pelo nome…"
              />
              <p className="muted tiny" style={{ margin: '8px 0' }}>
                Catálogo completo do Livro do Mestre 2024, agrupado por raridade. Toque no nome
                para ler a descrição inteira.
              </p>
              {magicosPorRaridade.length === 0 && (
                <div className="muted tiny center" style={{ padding: 12 }}>Nenhum item com esse nome.</div>
              )}
              {magicosPorRaridade.map(({ rarity, items }) => (
                <details key={rarity} open={!!busca.trim()}>
                  <summary>{RARITY_NAMES[rarity]} ({items.length})</summary>
                  <div style={{ marginTop: 8 }}>
                    {items.map((item) => (
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
            </div>
          </details>
        </Sheet>
      )}

      {detail && (
        <Sheet title={itemById(detail)?.name ?? 'Item'} onClose={() => setDetail(null)}>
          <DetalheItem item={itemById(detail)!} />
          <button className="primary" style={{ width: '100%', marginTop: 12 }} onClick={() => { addItem(detail); setDetail(null) }}>
            Adicionar à mochila
          </button>
        </Sheet>
      )}
    </div>
  )
}

/** Ficha completa de um item: linha-resumo + texto integral do livro, quando houver. */
function DetalheItem({ item }: { item: Item }) {
  const m = item.magic
  return (
    <>
      <div className="muted tiny" style={{ marginBottom: 12, lineHeight: 1.7 }}>
        {m?.category && (
          <>
            <strong className="gold">{m.category}</strong>
            {m.categoryDetail ? ` (${m.categoryDetail})` : ''}
            {m.rarity ? ` · ${RARITY_NAMES[m.rarity]}` : ''}
            {m.attunement && (
              <><br /><strong>Requer sintonização</strong>{m.attunementBy ? ` ${m.attunementBy}` : ''}</>
            )}
            <br />
          </>
        )}
        {!m && describeItem(item)}
        {item.cost && <><br />Preço de tabela: {item.cost}</>}
      </div>
      {m?.text?.length
        ? m.text.map((p, i) => <p className="spell-p" key={i}>{p}</p>)
        : <p className="spell-p">{item.magic?.desc ?? item.desc ?? describeItem(item)}</p>}
    </>
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
  if (item.magic) {
    const m = item.magic
    const partes = [m.category ?? 'Item Mágico']
    if (m.rarity) partes.push(RARITY_NAMES[m.rarity])
    if (m.attunement) partes.push(`Sintonização${m.attunementBy ? ` ${m.attunementBy}` : ''}`)
    if (m.desc) partes.push(m.desc)
    return partes.join(' · ')
  }
  return [item.desc, item.cost].filter(Boolean).join(' · ') || 'Equipamento'
}
