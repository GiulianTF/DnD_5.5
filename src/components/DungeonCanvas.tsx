import { useEffect, useRef } from 'react'

/**
 * Fundo animado da tela de login: um corredor de masmorra em perspectiva,
 * com arcos recuando ao infinito, duas tochas tremeluzentes e brasas subindo.
 * Tudo desenhado no <canvas> — leve, sem imagens, respeita prefers-reduced-motion.
 */
export function DungeonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

    let w = 0
    let h = 0
    let dpr = 1
    const redimensionar = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    redimensionar()
    window.addEventListener('resize', redimensionar)

    // ---- Brasas ----
    interface Brasa { x: number; y: number; vx: number; vy: number; vida: number; max: number; r: number }
    const brasas: Brasa[] = []
    const novaBrasa = (lado: number): Brasa => {
      const baseX = lado < 0 ? w * 0.16 : w * 0.84
      const max = 90 + Math.random() * 80
      return {
        x: baseX + (Math.random() - 0.5) * 40,
        y: h * 0.46 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.4 + Math.random() * 0.7,
        vida: max,
        max,
        r: 1 + Math.random() * 1.8,
      }
    }

    const arcos = 20
    let inicio = 0
    let raf = 0

    const desenhar = (agora: number) => {
      if (!inicio) inicio = agora
      const t = reduzir ? 0 : (agora - inicio) / 1000

      // Fundo em gradiente vertical
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#0b0906')
      g.addColorStop(0.6, '#140f0a')
      g.addColorStop(1, '#1c140d')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      const vx = w / 2
      const vy = h * 0.44 // ponto de fuga um pouco acima do centro
      const maxW = w * 1.5
      const maxH = h * 1.5

      // Corredor: arcos concêntricos recuando (efeito de avançar para frente)
      const avanço = (t * 0.06) % 1
      for (let i = 0; i < arcos; i++) {
        let p = (i / arcos + avanço) % 1 // 0 = longe, 1 = perto
        const e = p * p // perspectiva
        const aw = maxW * e
        const ah = maxH * e
        const x = vx - aw / 2
        const y = vy - ah / 2
        const alpha = Math.min(1, e * 1.7) * 0.55
        // pedra fria ao fundo, esquentando (tocha) conforme se aproxima
        const r = Math.round(60 + 90 * e)
        const gr = Math.round(50 + 55 * e)
        const b = Math.round(42 + 30 * e)
        ctx.strokeStyle = `rgba(${r}, ${gr}, ${b}, ${alpha})`
        ctx.lineWidth = 1 + 2 * e
        roundRect(ctx, x, y, aw, ah, 18 * e)
        ctx.stroke()
      }

      // Brilho central (profundidade da masmorra)
      const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.5)
      glow.addColorStop(0, 'rgba(224,178,92,0.10)')
      glow.addColorStop(1, 'rgba(224,178,92,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      // ---- Tochas (duas, esquerda e direita) ----
      const flicker = (semente: number) =>
        0.72 +
        0.18 * Math.sin(t * 11 + semente) +
        0.1 * Math.sin(t * 27 + semente * 1.7) +
        (reduzir ? 0 : (Math.random() - 0.5) * 0.06)

      for (const lado of [-1, 1]) {
        const tx = lado < 0 ? w * 0.16 : w * 0.84
        const ty = h * 0.46
        const f = Math.max(0.4, flicker(lado * 3))
        const raio = Math.min(w, h) * 0.32 * f
        const luz = ctx.createRadialGradient(tx, ty, 0, tx, ty, raio)
        luz.addColorStop(0, `rgba(255,180,80,${0.5 * f})`)
        luz.addColorStop(0.4, `rgba(220,120,40,${0.22 * f})`)
        luz.addColorStop(1, 'rgba(180,60,20,0)')
        ctx.fillStyle = luz
        ctx.fillRect(0, 0, w, h)

        // Chama
        ctx.beginPath()
        ctx.ellipse(tx, ty - 4 * f, 5 * f, 12 * f, 0, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,${Math.round(160 * f)},60,${0.85 * f})`
        ctx.fill()
      }

      // ---- Brasas ----
      if (!reduzir) {
        if (brasas.length < 70 && Math.random() < 0.6) brasas.push(novaBrasa(Math.random() < 0.5 ? -1 : 1))
        for (let i = brasas.length - 1; i >= 0; i--) {
          const b = brasas[i]
          b.x += b.vx + Math.sin((t + i) * 2) * 0.15
          b.y -= b.vy
          b.vida -= 1
          if (b.vida <= 0 || b.y < h * 0.1) {
            brasas.splice(i, 1)
            continue
          }
          const a = (b.vida / b.max) * 0.9
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,${140 + Math.round(80 * (b.vida / b.max))},60,${a})`
          ctx.fill()
        }
      }

      // Vinheta para focar o centro
      const vig = ctx.createRadialGradient(vx, h * 0.5, h * 0.2, vx, h * 0.5, h * 0.8)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.65)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      if (!reduzir) raf = requestAnimationFrame(desenhar)
    }

    raf = requestAnimationFrame(desenhar)
    // Em reduced-motion desenhamos um quadro estático:
    if (reduzir) desenhar(0)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', redimensionar)
    }
  }, [])

  return <canvas ref={canvasRef} className="dungeon-canvas" aria-hidden="true" />
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
