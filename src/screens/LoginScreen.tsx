import { useState } from 'react'
import { useAuth } from '../store/auth'
import { DungeonCanvas } from '../components/DungeonCanvas'

const versao = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'

/**
 * Código-convite para criar conta. É uma barreira LEVE (fica no cliente):
 * só quem receber o código consegue se cadastrar. Para trocar, basta mudar aqui
 * (ou definir VITE_CODIGO_CONVITE no ambiente).
 */
const CODIGO_CONVITE = import.meta.env.VITE_CODIGO_CONVITE || '98949894'

export function LoginScreen() {
  const { signInEmail, signUpEmail, setOffline } = useAuth()
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [etapa, setEtapa] = useState<'dados' | 'codigo'>('dados')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const trocarModo = (m: 'entrar' | 'criar') => {
    setModo(m)
    setEtapa('dados')
    setCodigo('')
    setStatus(null)
  }

  const voltarParaDados = () => {
    setEtapa('dados')
    setCodigo('')
    setStatus(null)
  }

  // "Envia" o código (simulado — quem distribui o código é você).
  const enviarCodigo = async () => {
    if (!email.trim() || !senha) {
      setStatus({ ok: false, message: 'Preencha e-mail e senha.' })
      return
    }
    if (senha.length < 6) {
      setStatus({ ok: false, message: 'A senha precisa ter pelo menos 6 caracteres.' })
      return
    }
    setCarregando(true)
    setStatus(null)
    await new Promise((r) => setTimeout(r, 700)) // simula o envio
    setCarregando(false)
    setEtapa('codigo')
    setStatus({ ok: true, message: `Enviamos um código de confirmação para ${email.trim()}. Digite-o abaixo.` })
  }

  const confirmarCodigo = async () => {
    if (codigo.trim() !== CODIGO_CONVITE) {
      setStatus({ ok: false, message: 'Código incorreto. Confira com quem te convidou.' })
      return
    }
    setCarregando(true)
    setStatus(null)
    const r = await signUpEmail(email, senha)
    setCarregando(false)
    setStatus(r)
    // Se a conta já vier com sessão, o App troca de tela sozinho.
  }

  const entrar = async () => {
    if (!email.trim() || !senha) {
      setStatus({ ok: false, message: 'Preencha e-mail e senha.' })
      return
    }
    setCarregando(true)
    setStatus(null)
    const r = await signInEmail(email, senha)
    setCarregando(false)
    setStatus(r)
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (carregando) return
    if (modo === 'entrar') return entrar()
    if (etapa === 'dados') return enviarCodigo()
    return confirmarCodigo()
  }

  const naEtapaCodigo = modo === 'criar' && etapa === 'codigo'

  return (
    <div className="login">
      <DungeonCanvas />

      <div className="login-content">
        <div className="brand">
          <div className="brand-icon">🐉</div>
          <h1>Fichas D&amp;D</h1>
          <div className="brand-sub">Livro do Jogador 2024</div>
        </div>

        <form className="login-card" onSubmit={enviar}>
          <div className="login-tabs">
            <button type="button" className={modo === 'entrar' ? 'on' : ''} onClick={() => trocarModo('entrar')}>
              Entrar
            </button>
            <button type="button" className={modo === 'criar' ? 'on' : ''} onClick={() => trocarModo('criar')}>
              Criar conta
            </button>
          </div>

          {naEtapaCodigo ? (
            <>
              <p className="muted tiny" style={{ marginBottom: 12, lineHeight: 1.55 }}>
                Para concluir o cadastro, digite o código de confirmação enviado.
                Não recebeu? Peça o código a quem te convidou.
              </p>
              <label htmlFor="login-codigo">Código de confirmação</label>
              <input
                id="login-codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="8 dígitos"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.15rem' }}
              />
              <button className="primary" type="submit" disabled={carregando} style={{ width: '100%', marginTop: 14 }}>
                {carregando ? 'Confirmando…' : 'Confirmar e criar conta'}
              </button>
              <button type="button" className="skip" onClick={voltarParaDados} style={{ marginTop: 6 }}>
                ← Voltar e corrigir os dados
              </button>
            </>
          ) : (
            <>
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="login-senha" style={{ marginTop: 10 }}>Senha</label>
              <input
                id="login-senha"
                type="password"
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                placeholder="mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />

              <button className="primary" type="submit" disabled={carregando} style={{ width: '100%', marginTop: 14 }}>
                {carregando
                  ? 'Aguarde…'
                  : modo === 'entrar'
                    ? 'Entrar'
                    : 'Criar minha conta'}
              </button>
            </>
          )}

          {status && (
            <div className={`banner ${status.ok ? 'ok' : 'warn'}`} style={{ marginTop: 12 }}>
              {status.message}
            </div>
          )}

          <div className="oauth-sep"><span>ou</span></div>

          <button
            type="button"
            className="google-btn"
            disabled
            title="Em breve"
            aria-label="Entrar com Google (em breve)"
          >
            <GoogleGlyph />
            Entrar com Google
            <span className="soon">em breve</span>
          </button>

          <button type="button" className="skip" onClick={() => setOffline(true)}>
            Usar sem conta (offline)
          </button>
        </form>

        <div className="version">versão {versao}</div>
      </div>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.2 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  )
}

/** Pequeno splash enquanto o app decide entre login e conteúdo. */
export function SplashLoading() {
  return (
    <div className="splash">
      <div className="splash-icon">🐉</div>
    </div>
  )
}
