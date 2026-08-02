import { useState } from 'react'
import { useStore } from '../store/store'
import { useAuth } from '../store/auth'
import { syncNow, exportarJSON } from '../store/sync'
import { APP_VERSION, notaAtual } from '../data/patch-notes'
import { Card } from '../components/ui'

export function CloudTab({ online, onNovidades }: { online: boolean; onNovidades?: () => void }) {
  const { lastSync, characters } = useStore()
  const { session, signOut, setOffline } = useAuth()
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [instalavel, setInstalavel] = useState<Event | null>(
    (window as unknown as { __pwaPrompt?: Event }).__pwaPrompt ?? null,
  )

  const logado = Boolean(session)
  const email = session?.user?.email ?? ''
  const atual = notaAtual()

  const sincronizar = async () => {
    setSincronizando(true)
    setStatus(null)
    const r = await syncNow()
    setStatus(r)
    setSincronizando(false)
  }

  const instalar = async () => {
    const evt = instalavel as (Event & { prompt: () => Promise<void> }) | null
    if (!evt) return
    await evt.prompt()
    setInstalavel(null)
  }

  return (
    <div>
      <Card title="Status">
        <div className="row wrap" style={{ gap: 6 }}>
          <span className="pill" style={{ borderColor: online ? 'var(--green)' : 'var(--red)' }}>
            {online ? '🟢 Online' : '🔴 Offline'}
          </span>
          <span className="pill">{characters.length} ficha(s) no aparelho</span>
          <span className="pill">{logado ? '👤 Conta conectada' : '👤 Sem conta'}</span>
        </div>
        <p className="muted tiny" style={{ marginTop: 10, lineHeight: 1.55 }}>
          O aplicativo funciona 100% offline: todas as fichas ficam salvas no próprio aparelho.
          Com uma conta, elas também ficam na nuvem e você acessa as mesmas fichas em qualquer aparelho.
        </p>
        {lastSync && (
          <div className="tiny muted" style={{ marginTop: 6 }}>
            Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
          </div>
        )}
      </Card>

      <Card title="Conta">
        {logado ? (
          <>
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Conectado como <strong style={{ color: 'var(--text)' }}>{email}</strong>. Suas fichas
              são salvas na nuvem e visíveis somente para você.
            </p>
            <button style={{ width: '100%' }} onClick={() => signOut()}>Sair da conta</button>
          </>
        ) : (
          <>
            <p className="muted tiny" style={{ marginBottom: 10 }}>
              Você está usando sem conta — as fichas ficam apenas neste aparelho. Entre ou crie uma
              conta para guardá-las na nuvem e usá-las em outros dispositivos.
            </p>
            <button className="primary" style={{ width: '100%' }} onClick={() => setOffline(false)}>
              Entrar ou criar conta
            </button>
          </>
        )}
      </Card>

      <Card title="Instalar no aparelho">
        <p className="muted tiny" style={{ marginBottom: 10, lineHeight: 1.55 }}>
          Instale o app para usá-lo offline como um aplicativo comum, sem barra de navegador.
          No iPhone, use <strong>Compartilhar → Adicionar à Tela de Início</strong>. No Android e no
          computador, o botão abaixo aparece quando o navegador permite a instalação.
        </p>
        <button className="gold" style={{ width: '100%' }} disabled={!instalavel} onClick={instalar}>
          {instalavel ? '⬇ Instalar aplicativo' : 'Instalação indisponível neste navegador'}
        </button>
      </Card>

      <Card title="Sincronizar">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          A sincronização é nos dois sentidos. Quando a mesma ficha existe nos dois lados,
          vence a versão editada mais recentemente.
        </p>
        <button
          className="primary"
          style={{ width: '100%' }}
          disabled={!online || !logado || sincronizando}
          onClick={sincronizar}
        >
          {sincronizando ? 'Sincronizando...' : '☁ Sincronizar agora'}
        </button>
        {!logado && (
          <div className="muted tiny center" style={{ marginTop: 8 }}>
            Entre com uma conta para sincronizar na nuvem.
          </div>
        )}
        {!online && logado && (
          <div className="muted tiny center" style={{ marginTop: 8 }}>
            Você está offline — suas fichas continuam salvas no aparelho.
          </div>
        )}
        {status && <div className={`banner ${status.ok ? 'ok' : 'warn'}`} style={{ marginTop: 12 }}>{status.message}</div>}
      </Card>

      <Card title="Backup manual">
        <p className="muted tiny" style={{ marginBottom: 10 }}>Baixe um arquivo com todas as fichas — funciona mesmo sem internet.</p>
        <button style={{ width: '100%' }} disabled={!characters.length} onClick={() => exportarJSON(characters)}>
          ⬇ Exportar todas as fichas (JSON)
        </button>
      </Card>

      <Card title="Sobre o app">
        <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
          <span className="pill gold">{`v${APP_VERSION}`}</span>
          <span className="pill">{atual?.titulo ?? 'Fichas D&D 2024'}</span>
        </div>
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          {atual?.resumo ?? 'Fichas de D&D 5ª Edição pelo Livro do Jogador 2024.'}
        </p>
        {onNovidades && (
          <button style={{ width: '100%' }} onClick={onNovidades}>✨ Ver as novidades</button>
        )}
      </Card>
    </div>
  )
}
