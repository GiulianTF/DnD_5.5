import { useState } from 'react'
import { useStore } from '../store/store'
import { isConfigured, syncNow, exportarJSON } from '../store/sync'
import { Card } from '../components/ui'

export function CloudTab({ online }: { online: boolean }) {
  const { supabaseUrl, supabaseKey, setSupabase, lastSync, characters } = useStore()
  const [url, setUrl] = useState(supabaseUrl)
  const [key, setKey] = useState(supabaseKey)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [instalavel, setInstalavel] = useState<Event | null>(
    (window as unknown as { __pwaPrompt?: Event }).__pwaPrompt ?? null,
  )

  const salvar = () => {
    setSupabase(url.trim(), key.trim())
    setStatus({ ok: true, message: 'Credenciais salvas neste aparelho.' })
  }

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
          <span className="pill">{isConfigured() ? '☁ Supabase configurado' : '☁ Supabase não configurado'}</span>
        </div>
        <p className="muted tiny" style={{ marginTop: 10, lineHeight: 1.55 }}>
          O aplicativo funciona 100% offline: todas as fichas ficam salvas no próprio aparelho.
          A nuvem é opcional e serve para você acessar as mesmas fichas em outro dispositivo.
        </p>
        {lastSync && (
          <div className="tiny muted" style={{ marginTop: 6 }}>
            Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
          </div>
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

      <Card title="Credenciais do Supabase">
        <p className="muted tiny" style={{ marginBottom: 10, lineHeight: 1.55 }}>
          Cole a URL e a chave <strong>anon</strong> do seu projeto (Configurações → API).
          Elas ficam salvas só neste aparelho. Rode o script <code>supabase/schema.sql</code> no
          SQL Editor do seu projeto antes da primeira sincronização.
        </p>
        <label>URL do projeto</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" autoComplete="off" />
        <label style={{ marginTop: 10 }}>Chave anon (pública)</label>
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi..." autoComplete="off" />
        <button style={{ width: '100%', marginTop: 12 }} onClick={salvar}>Salvar credenciais</button>
      </Card>

      <Card title="Sincronizar">
        <p className="muted tiny" style={{ marginBottom: 10 }}>
          A sincronização é nos dois sentidos. Quando a mesma ficha existe nos dois lados,
          vence a versão editada mais recentemente.
        </p>
        <button className="primary" style={{ width: '100%' }} disabled={!online || !isConfigured() || sincronizando} onClick={sincronizar}>
          {sincronizando ? 'Sincronizando...' : '☁ Sincronizar agora'}
        </button>
        {!online && <div className="muted tiny center" style={{ marginTop: 8 }}>Você está offline — suas fichas continuam salvas no aparelho.</div>}
        {status && <div className={`banner ${status.ok ? 'ok' : 'warn'}`} style={{ marginTop: 12 }}>{status.message}</div>}
      </Card>

      <Card title="Backup manual">
        <p className="muted tiny" style={{ marginBottom: 10 }}>Baixe um arquivo com todas as fichas — funciona mesmo sem internet.</p>
        <button style={{ width: '100%' }} disabled={!characters.length} onClick={() => exportarJSON(characters)}>
          ⬇ Exportar todas as fichas (JSON)
        </button>
      </Card>
    </div>
  )
}
