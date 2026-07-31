import { useRef } from 'react'
import { useStore } from '../store/store'
import { classById } from '../data/classes'
import { speciesById } from '../data/species'
import { currentHp, maxHp, armorClass } from '../engine/rules'
import { exportarJSON, importarJSON } from '../store/sync'
import { Card, Empty } from '../components/ui'

export function CharacterList({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const { characters, setActive, deleteCharacter, replaceAll } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const abrir = (id: string) => { setActive(id); onOpen(id) }

  const importar = async (file: File) => {
    try {
      const fichas = await importarJSON(file)
      const existentes = new Map(characters.map((c) => [c.id, c]))
      for (const f of fichas) {
        const atual = existentes.get(f.id)
        if (!atual || (f.updatedAt ?? 0) > (atual.updatedAt ?? 0)) existentes.set(f.id, f)
      }
      replaceAll([...existentes.values()])
      alert(`Importação concluída: ${fichas.length} ficha(s) processada(s).`)
    } catch (e) {
      alert(`Não consegui importar: ${(e as Error).message}`)
    }
  }

  return (
    <div>
      <div className="topbar">
        <div style={{ flex: 1 }}>
          <h1>Minhas Fichas</h1>
          <div className="sub">D&D 5ª Edição · Livro do Jogador 2024</div>
        </div>
      </div>

      <button className="primary" style={{ width: '100%', marginBottom: 14 }} onClick={onNew}>
        ＋ Criar Novo Personagem
      </button>

      {characters.length === 0 ? (
        <Empty
          icon="🐉"
          title="Nenhuma ficha ainda"
          hint="Crie seu primeiro personagem — o assistente guia você por espécie, antecedente, classe, atributos, perícias, magias e equipamento."
        />
      ) : (
        characters.map((c) => {
          const cls = classById(c.classId)
          const sp = speciesById(c.speciesId)
          const hp = currentHp(c)
          const hpMax = maxHp(c)
          return (
            <div className="card" key={c.id} style={{ cursor: 'pointer' }}>
              <div className="spread" onClick={() => abrir(c.id)}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '1.05rem', fontFamily: 'Georgia, serif' }}>{c.name}</strong>
                  <div className="tiny muted" style={{ marginTop: 3 }}>
                    {sp?.name} · {cls?.name} nível {c.level}
                    {c.subclassId && ` · ${cls?.subclasses.find((s) => s.id === c.subclassId)?.name ?? ''}`}
                  </div>
                  <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
                    <span className="pill">❤ {hp}/{hpMax}</span>
                    <span className="pill">🛡 CA {armorClass(c).total}</span>
                  </div>
                </div>
                <button className="ghost icon" onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Excluir a ficha de ${c.name}? Isso não pode ser desfeito.`)) deleteCharacter(c.id)
                }}>🗑</button>
              </div>
              <div className="hpbar" style={{ marginTop: 10 }}>
                <div style={{ width: `${Math.max(0, (hp / hpMax) * 100)}%` }} />
              </div>
            </div>
          )
        })
      )}

      <Card title="Backup local">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          Funciona offline. Exporte um arquivo JSON com todas as suas fichas para guardar ou transferir de aparelho.
        </p>
        <div className="row" style={{ gap: 6 }}>
          <button className="sm" style={{ flex: 1 }} disabled={!characters.length} onClick={() => exportarJSON(characters)}>
            ⬇ Exportar
          </button>
          <button className="sm" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>⬆ Importar</button>
        </div>
        <input
          ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }}
        />
      </Card>
    </div>
  )
}
