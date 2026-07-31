import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null; info: string }

/**
 * Sem isto, qualquer erro de renderização desmonta a árvore e o usuário vê só uma tela branca,
 * sem pista do que aconteceu. Aqui o erro vira uma mensagem legível, com saída de emergência.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro na interface:', error, info)
    this.setState({ info: info.componentStack ?? '' })
  }

  render() {
    const { error, info } = this.state
    if (!error) return this.props.children

    return (
      <div className="app" style={{ paddingTop: 24 }}>
        <div className="card">
          <h3 style={{ color: 'var(--red)' }}>Algo deu errado</h3>
          <p className="muted" style={{ fontSize: '.9rem', lineHeight: 1.5 }}>
            A tela não pôde ser exibida. Suas fichas continuam salvas neste aparelho — nada foi perdido.
          </p>
          <div className="banner warn" style={{ marginTop: 12, wordBreak: 'break-word' }}>
            <strong>{error.name}:</strong> {error.message}
          </div>
          <div className="row" style={{ gap: 6, marginTop: 12 }}>
            <button className="primary" style={{ flex: 1 }} onClick={() => this.setState({ error: null, info: '' })}>
              Tentar de novo
            </button>
            <button style={{ flex: 1 }} onClick={() => window.location.reload()}>Recarregar</button>
          </div>
          {info && (
            <details style={{ marginTop: 12 }}>
              <summary className="muted tiny">Detalhes técnicos</summary>
              <pre className="tiny muted" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                {error.stack}
                {info}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
