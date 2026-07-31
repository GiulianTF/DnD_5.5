/**
 * Gera um identificador único.
 *
 * `crypto.randomUUID()` só existe em contexto seguro (HTTPS ou localhost). Ao abrir o app
 * pelo IP da rede local via http:// — o caso de testar no celular — a função não existe e
 * quebraria a tela. `crypto.getRandomValues()` não tem essa restrição, então montamos o
 * UUID v4 a partir dele quando necessário.
 */
export function uid(): string {
  const c = globalThis.crypto
  if (typeof c?.randomUUID === 'function') return c.randomUUID()

  const bytes = new Uint8Array(16)
  c.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122

  const hex: string[] = []
  for (let i = 0; i < 256; i++) hex.push((i + 0x100).toString(16).slice(1))
  const b = Array.from(bytes, (v) => hex[v])
  return `${b[0]}${b[1]}${b[2]}${b[3]}-${b[4]}${b[5]}-${b[6]}${b[7]}-${b[8]}${b[9]}-${b[10]}${b[11]}${b[12]}${b[13]}${b[14]}${b[15]}`
}
