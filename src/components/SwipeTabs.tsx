import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  LIMIAR_RODA, decidirTroca, definirEixo, deslocamento, proximoIndice, type Eixo,
} from '../engine/swipe'
import { temFolhaAberta } from './ui'

export interface SwipeTab<T extends string> {
  id: T
  label: string
  icon: string
}

const editavel = (el: EventTarget | null): boolean => {
  const alvo = el as HTMLElement | null
  if (!alvo?.tagName) return false
  return /^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable
}

/**
 * Abas com navegação lateral: arrastar o dedo troca de aba nos dois sentidos,
 * e no computador o mesmo caminho existe pelas setas ← → e pela rolagem
 * horizontal do trackpad. O conteúdo acompanha o dedo enquanto o gesto está em
 * curso, com resistência nas pontas para deixar claro que ali a lista acaba.
 */
export function SwipeTabs<T extends string>({ tabs, value, onChange, children, travado = false }: {
  tabs: SwipeTab<T>[]
  value: T
  onChange: (id: T) => void
  /** conteúdo da aba atual */
  children: ReactNode
  /** desliga a navegação enquanto há uma folha aberta por cima */
  travado?: boolean
}) {
  const indice = Math.max(0, tabs.findIndex((t) => t.id === value))
  const anterior = indice > 0 ? tabs[indice - 1] : undefined
  const proxima = indice < tabs.length - 1 ? tabs[indice + 1] : undefined

  /** deslocamento do conteúdo durante o gesto, em px */
  const [arrasto, setArrasto] = useState(0)
  /** de que lado a aba nova entrou, para animar a chegada */
  const [entrando, setEntrando] = useState<'esq' | 'dir' | null>(null)

  const painel = useRef<HTMLDivElement>(null)
  const barra = useRef<HTMLDivElement>(null)
  const gesto = useRef({ x: 0, y: 0, t: 0, eixo: 'indefinido' as Eixo, ativo: false })

  const irPara = useCallback((destino: number) => {
    const alvo = proximoIndice(indice, destino - indice, tabs.length)
    if (alvo === indice) return
    setEntrando(alvo > indice ? 'dir' : 'esq')
    onChange(tabs[alvo].id)
  }, [indice, onChange, tabs])

  // ---------- Toque ----------
  const aoTocar = (e: React.TouchEvent) => {
    if (travado || e.touches.length !== 1) return
    // Elementos que já usam o arrasto para outra coisa ficam de fora.
    if ((e.target as HTMLElement).closest?.('[data-sem-swipe]')) return
    const t = e.touches[0]
    gesto.current = { x: t.clientX, y: t.clientY, t: e.timeStamp, eixo: 'indefinido', ativo: true }
  }

  const aoArrastar = (e: React.TouchEvent) => {
    const g = gesto.current
    if (!g.ativo || travado) return
    const dx = e.touches[0].clientX - g.x
    const dy = e.touches[0].clientY - g.y

    if (g.eixo === 'indefinido') {
      // Só assumimos o gesto quando ele é claramente horizontal; caso contrário
      // devolvemos o controle para a rolagem vertical da página.
      g.eixo = definirEixo(dx, dy)
      if (g.eixo === 'vertical') { g.ativo = false; return }
      if (g.eixo === 'indefinido') return
    }

    setArrasto(deslocamento(dx, !!anterior, !!proxima))
  }

  const aoSoltar = (e: React.TouchEvent) => {
    const g = gesto.current
    gesto.current = { ...g, ativo: false }
    if (g.eixo !== 'horizontal' || travado) { setArrasto(0); return }

    const passo = decidirTroca(arrasto, e.timeStamp - g.t)
    setArrasto(0)
    if (passo !== 0) irPara(indice + passo)
  }

  // ---------- Trackpad (rolagem horizontal) ----------
  useEffect(() => {
    const el = painel.current
    if (!el || travado) return
    let acumulado = 0
    let bloqueado = false
    let zerar: ReturnType<typeof setTimeout>

    const aoRolar = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      clearTimeout(zerar)
      zerar = setTimeout(() => { acumulado = 0; bloqueado = false }, 220)
      if (bloqueado) return
      acumulado += e.deltaX
      if (Math.abs(acumulado) < LIMIAR_RODA) return
      bloqueado = true
      irPara(indice + (acumulado > 0 ? 1 : -1))
      acumulado = 0
    }

    el.addEventListener('wheel', aoRolar, { passive: false })
    return () => { clearTimeout(zerar); el.removeEventListener('wheel', aoRolar) }
  }, [indice, irPara, travado])

  // ---------- Teclado ----------
  useEffect(() => {
    if (travado) return
    const aoTeclar = (e: KeyboardEvent) => {
      // Uma folha aberta (detalhe de magia, rolador, item) fica na frente de
      // tudo: as setas pertencem a ela, não à troca de abas atrás dela.
      if (e.altKey || e.ctrlKey || e.metaKey || editavel(e.target) || temFolhaAberta()) return
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(indice + 1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(indice - 1) }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [indice, irPara, travado])

  // Com a barra rolando na horizontal, a aba ativa não pode ficar escondida.
  useEffect(() => {
    barra.current?.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [value])

  return (
    <div className="swipe-tabs">
      <div className="segmented tabs" role="tablist" ref={barra}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === value}
            aria-controls={`painel-${t.id}`}
            className={t.id === value ? 'on' : ''}
            onClick={() => irPara(tabs.indexOf(t))}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div
        ref={painel}
        className="tab-panel"
        onTouchStart={aoTocar}
        onTouchMove={aoArrastar}
        onTouchEnd={aoSoltar}
        onTouchCancel={() => { gesto.current.ativo = false; setArrasto(0) }}
      >
        <div
          id={`painel-${value}`}
          role="tabpanel"
          key={value}
          className={`tab-conteudo${entrando ? ` de-${entrando}` : ''}${arrasto ? ' arrastando' : ''}`}
          // O transform só existe durante o gesto: em repouso ele criaria um
          // bloco de contenção e quebraria as folhas em position: fixed.
          style={arrasto ? { transform: `translateX(${arrasto}px)` } : undefined}
          onAnimationEnd={() => setEntrando(null)}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
