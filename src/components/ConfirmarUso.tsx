import { useState, type ReactNode } from 'react'
import { Sheet } from './ui'

export interface OpcaoDeCusto {
  /** valor devolvido em `onUsar` */
  id: string
  /** texto do botão de escolha ("3º nível", "Uso gratuito") */
  label: string
  /** quantos ainda restam desta opção */
  restantes?: number
}

/**
 * Confirmação de uso de uma magia, característica ou item.
 *
 * O jogador escolhe se quer rolar os dados na hora ou só marcar o uso — e o
 * gasto acontece nos dois casos, porque o recurso vai embora mesmo quando a
 * rolagem é feita na mesa, com dados de verdade. Quando há mais de uma forma
 * de pagar (um espaço de 3º ou de 4º nível, um uso gratuito do talento), a
 * escolha aparece antes dos botões.
 */
export function ConfirmarUso({ titulo, subtitulo, dados, custos, custoInicial, aviso, detalhe, onUsar, onFechar }: {
  titulo: string
  /** linha de apoio: escola da magia, característica de origem... */
  subtitulo?: string
  /** dado sugerido pelo texto do livro ("8d6"); sem ele não há o que rolar */
  dados?: string
  /** formas de pagar pelo uso; com uma só, ela é apenas informada */
  custos?: OpcaoDeCusto[]
  /** id do custo pré-selecionado */
  custoInicial?: string
  /** impedimento que desabilita o uso ("Sem espaços de magia disponíveis") */
  aviso?: string
  /** texto livre exibido acima dos botões */
  detalhe?: ReactNode
  /** `rolar` diz se o jogador pediu a rolagem; `custoId` é a forma de pagar escolhida */
  onUsar: (rolar: boolean, custoId?: string) => void
  onFechar: () => void
}) {
  const [custoId, setCustoId] = useState(custoInicial ?? custos?.[0]?.id)
  const bloqueado = !!aviso

  return (
    <Sheet title={titulo} onClose={onFechar}>
      {subtitulo && <div className="muted tiny" style={{ marginBottom: 10 }}>{subtitulo}</div>}

      {custos && custos.length > 1 && (
        <>
          <label>Gastar</label>
          <div className="row wrap" style={{ gap: 6, margin: '6px 0 12px' }}>
            {custos.map((c) => (
              <button
                key={c.id}
                className={`sm${c.id === custoId ? ' gold' : ''}`}
                onClick={() => setCustoId(c.id)}
              >
                {c.label}
                {c.restantes !== undefined && <span className="tiny muted"> ({c.restantes})</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {custos?.length === 1 && (
        <div className="banner">
          Vai gastar: <strong className="gold">{custos[0].label}</strong>
          {custos[0].restantes !== undefined && ` · restam ${custos[0].restantes}`}
        </div>
      )}

      {detalhe && <div className="tiny muted" style={{ marginBottom: 12, lineHeight: 1.6 }}>{detalhe}</div>}

      {aviso && <div className="banner warn">{aviso}</div>}

      <div className="row wrap" style={{ gap: 8, marginTop: 4 }}>
        {dados && (
          <button className="primary" style={{ flex: 1 }} disabled={bloqueado}
            onClick={() => onUsar(true, custoId)}>
            🎲 Rolar {dados}
          </button>
        )}
        <button style={{ flex: 1 }} disabled={bloqueado} onClick={() => onUsar(false, custoId)}>
          {dados ? 'Usar sem rolar' : 'Usar'}
        </button>
      </div>
      <div className="muted tiny center" style={{ marginTop: 10 }}>
        {dados
          ? 'Nos dois casos o gasto é marcado na ficha — role aqui ou na mesa, como preferir.'
          : 'O gasto é marcado na ficha.'}
      </div>
      <button className="ghost" style={{ width: '100%', marginTop: 10 }} onClick={onFechar}>Cancelar</button>
    </Sheet>
  )
}
