import { useEffect, useRef, useState } from 'react'
import { useStore } from './store/store'
import { useAuth } from './store/auth'
import { syncNow } from './store/sync'
import { CharacterList } from './screens/CharacterList'
import { CharacterCreator } from './screens/CharacterCreator'
import { CharacterSheet } from './screens/CharacterSheet'
import { CloudTab } from './screens/CloudTab'
import { LoginScreen, SplashLoading } from './screens/LoginScreen'
import { DiceRollerSheet, RollToast } from './components/DiceRoller'

type View = 'lista' | 'criar' | 'ficha' | 'nuvem'

export default function App() {
  const { characters, activeId, setActive } = useStore()
  const { ready, session, offline, init } = useAuth()
  const [view, setView] = useState<View>('lista')
  const [roller, setRoller] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  // Verifica a sessão salva assim que o app abre.
  useEffect(() => {
    init()
  }, [init])

  // Sincroniza automaticamente ao entrar (uma vez por usuário logado).
  const syncedFor = useRef<string | null>(null)
  useEffect(() => {
    const uid = session?.user?.id ?? null
    if (uid && online && syncedFor.current !== uid) {
      syncedFor.current = uid
      syncNow()
    }
    if (!uid) syncedFor.current = null
  }, [session, online])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const char = characters.find((c) => c.id === activeId) ?? null

  // Se a ficha ativa for excluída, volta para a lista
  useEffect(() => {
    if (view === 'ficha' && !char) setView('lista')
  }, [view, char])

  // Enquanto verificamos a sessão salva, mostramos um splash curtinho.
  if (!ready) return <SplashLoading />
  // Sem sessão e sem ter escolhido o modo offline → tela de login.
  if (!session && !offline) return <LoginScreen />

  return (
    <div className="app">
      {!online && (
        <div className="banner warn" style={{ marginTop: 12 }}>
          📴 Você está offline. Tudo continua funcionando — as fichas estão salvas neste aparelho.
        </div>
      )}

      {view === 'lista' && (
        <CharacterList onNew={() => setView('criar')} onOpen={() => setView('ficha')} />
      )}

      {view === 'criar' && (
        <CharacterCreator onDone={() => setView('ficha')} onCancel={() => setView('lista')} />
      )}

      {view === 'ficha' && char && (
        <CharacterSheet char={char} onBack={() => { setActive(null); setView('lista') }} />
      )}

      {view === 'nuvem' && (
        <>
          <div className="topbar">
            <div style={{ flex: 1 }}>
              <h1>Nuvem e Backup</h1>
              <div className="sub">Sincronização, instalação e exportação</div>
            </div>
          </div>
          <CloudTab online={online} />
        </>
      )}

      {view !== 'criar' && (
        <>
          <button className="fab" onClick={() => setRoller(true)} aria-label="Rolador de dados">🎲</button>

          <nav className="tabbar">
            <button className={view === 'lista' ? 'active' : ''} onClick={() => { setActive(null); setView('lista') }}>
              <span className="ico">📚</span>Fichas
            </button>
            <button className={view === 'ficha' ? 'active' : ''} disabled={!char} onClick={() => char && setView('ficha')}>
              <span className="ico">🗡</span>Personagem
            </button>
            <button className={view === 'nuvem' ? 'active' : ''} onClick={() => setView('nuvem')}>
              <span className="ico">☁</span>Nuvem
            </button>
          </nav>
        </>
      )}

      {/* O rolador já mostra o resultado dentro dele — não duplicamos o aviso flutuante. */}
      <RollToast oculto={roller} />

      {roller && <DiceRollerSheet onClose={() => setRoller(false)} />}
    </div>
  )
}
